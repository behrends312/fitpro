const Exercicio = require('../models/Exercicio');

// GET /exercicios — lista exercícios disponíveis para o personal (seus + públicos)
async function listar(req, res, next) {
  try {
    const { busca, musculo, equipamento, dificuldade } = req.query;
    const query = {
      ativo: true,
      $or: [{ criadoPor: req.user.id }, { publica: true }],
    };

    if (busca) query.nome = { $regex: busca, $options: 'i' };
    if (musculo) query.musculosPrincipais = musculo;
    if (equipamento) query.equipamento = equipamento;
    if (dificuldade) query.dificuldade = dificuldade;

    const exercicios = await Exercicio.find(query)
      .populate('criadoPor', 'nome email')
      .sort({ createdAt: -1 });

    res.json(exercicios);
  } catch (err) {
    next(err);
  }
}

// GET /exercicios/:id
async function getById(req, res, next) {
  try {
    const exercicio = await Exercicio.findOne({
      _id: req.params.id,
      ativo: true,
      $or: [{ criadoPor: req.user.id }, { publica: true }],
    }).populate('criadoPor', 'nome email');

    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado.' });
    res.json(exercicio);
  } catch (err) {
    next(err);
  }
}

// POST /exercicios
async function criar(req, res, next) {
  try {
    const {
      nome, descricao, instrucoes, musculosPrincipais, musculosSecundarios,
      equipamento, dificuldade, publica,
    } = req.body;

    const data = {
      nome,
      descricao,
      instrucoes,
      musculosPrincipais: JSON.parse(musculosPrincipais || '[]'),
      musculosSecundarios: JSON.parse(musculosSecundarios || '[]'),
      equipamento,
      dificuldade,
      publica: publica === 'true' || publica === true,
      criadoPor: req.user.id,
    };

    if (req.files?.video?.[0]) {
      data.videoPath = req.files.video[0].path;
      data.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
    }
    if (req.files?.thumbnail?.[0]) {
      data.thumbnailPath = req.files.thumbnail[0].path;
      data.thumbnailUrl = `/uploads/images/${req.files.thumbnail[0].filename}`;
    }

    const exercicio = await Exercicio.create(data);
    res.status(201).json(exercicio);
  } catch (err) {
    next(err);
  }
}

// PATCH /exercicios/:id
async function atualizar(req, res, next) {
  try {
    const exercicio = await Exercicio.findOne({ _id: req.params.id, criadoPor: req.user.id });
    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado ou sem permissão.' });

    const campos = ['nome', 'descricao', 'instrucoes', 'equipamento', 'dificuldade', 'publica'];
    campos.forEach((c) => {
      if (req.body[c] !== undefined) exercicio[c] = req.body[c];
    });
    if (req.body.musculosPrincipais) exercicio.musculosPrincipais = JSON.parse(req.body.musculosPrincipais);
    if (req.body.musculosSecundarios) exercicio.musculosSecundarios = JSON.parse(req.body.musculosSecundarios);

    if (req.files?.video?.[0]) {
      exercicio.videoPath = req.files.video[0].path;
      exercicio.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
    }
    if (req.files?.thumbnail?.[0]) {
      exercicio.thumbnailPath = req.files.thumbnail[0].path;
      exercicio.thumbnailUrl = `/uploads/images/${req.files.thumbnail[0].filename}`;
    }

    await exercicio.save();
    res.json(exercicio);
  } catch (err) {
    next(err);
  }
}

// DELETE /exercicios/:id
async function deletar(req, res, next) {
  try {
    const exercicio = await Exercicio.findOne({ _id: req.params.id, criadoPor: req.user.id });
    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado ou sem permissão.' });
    exercicio.ativo = false;
    await exercicio.save();
    res.json({ message: 'Exercício removido.' });
  } catch (err) {
    next(err);
  }
}

// POST /exercicios/importar — cria exercício se não existir (por nome) para esse personal
async function importar(req, res, next) {
  try {
    const { nome, musculosPrincipais, equipamento, dificuldade } = req.body;
    if (!nome) return res.status(400).json({ message: 'Nome é obrigatório.' });

    let exercicio = await Exercicio.findOne({
      nome: { $regex: `^${nome.trim()}$`, $options: 'i' },
      criadoPor: req.user.id,
      ativo: true,
    });

    if (!exercicio) {
      exercicio = await Exercicio.create({
        nome: nome.trim(),
        musculosPrincipais: musculosPrincipais || [],
        equipamento: equipamento || 'outro',
        dificuldade: dificuldade || 'intermediario',
        criadoPor: req.user.id,
        publica: false,
      });
    }

    res.json(exercicio);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, getById, criar, atualizar, deletar, importar };
