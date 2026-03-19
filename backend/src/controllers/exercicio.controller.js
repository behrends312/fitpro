const Exercicio = require('../models/Exercicio');
const { uploadToR2, deleteFromR2, gerarKey } = require('../middlewares/upload');

// GET /exercicios
async function listar(req, res, next) {
  try {
    const { busca, musculo, equipamento, dificuldade, scope } = req.query;

    let baseQuery;
    if (scope === 'minha') {
      baseQuery = { ativo: true, criadoPor: req.user.id };
    } else if (scope === 'predefinidos') {
      baseQuery = { ativo: true, publica: true };
    } else {
      baseQuery = { ativo: true, $or: [{ criadoPor: req.user.id }, { publica: true }] };
    }

    const query = { ...baseQuery };
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
      const f = req.files.video[0];
      const key = gerarKey('videos', f.originalname);
      data.videoUrl = await uploadToR2(f.buffer, key, f.mimetype);
    }
    if (req.files?.thumbnail?.[0]) {
      const f = req.files.thumbnail[0];
      const key = gerarKey('images', f.originalname);
      data.thumbnailUrl = await uploadToR2(f.buffer, key, f.mimetype);
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
    campos.forEach((c) => { if (req.body[c] !== undefined) exercicio[c] = req.body[c]; });
    if (req.body.musculosPrincipais) exercicio.musculosPrincipais = JSON.parse(req.body.musculosPrincipais);
    if (req.body.musculosSecundarios) exercicio.musculosSecundarios = JSON.parse(req.body.musculosSecundarios);

    if (req.files?.video?.[0]) {
      // Apaga vídeo antigo do R2
      if (exercicio.videoUrl) await deleteFromR2(exercicio.videoUrl).catch(() => {});
      const f = req.files.video[0];
      const key = gerarKey('videos', f.originalname);
      exercicio.videoUrl = await uploadToR2(f.buffer, key, f.mimetype);
    }
    if (req.files?.thumbnail?.[0]) {
      if (exercicio.thumbnailUrl) await deleteFromR2(exercicio.thumbnailUrl).catch(() => {});
      const f = req.files.thumbnail[0];
      const key = gerarKey('images', f.originalname);
      exercicio.thumbnailUrl = await uploadToR2(f.buffer, key, f.mimetype);
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

// POST /exercicios/importar
async function importar(req, res, next) {
  try {
    const { nome, musculosPrincipais, equipamento, dificuldade, gifUrl } = req.body;
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
        ...(gifUrl ? { thumbnailUrl: gifUrl } : {}),
      });
    } else if (gifUrl && !exercicio.thumbnailUrl) {
      exercicio.thumbnailUrl = gifUrl;
      await exercicio.save();
    }

    res.json(exercicio);
  } catch (err) {
    next(err);
  }
}

// POST /exercicios/sync-thumbnails — aplica mapa nome→thumbnailUrl em bulk
async function syncThumbnails(req, res, next) {
  try {
    const { mapa } = req.body; // { "Supino Reto": "https://...", ... }
    if (!mapa || typeof mapa !== 'object') {
      return res.status(400).json({ message: 'Campo "mapa" obrigatório.' });
    }

    let atualizados = 0;
    const detalhes = [];

    for (const [nome, thumbnailUrl] of Object.entries(mapa)) {
      const regex = new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const result = await Exercicio.updateMany(
        { nome: { $regex: regex } },
        { $set: { thumbnailUrl } }
      );
      if (result.modifiedCount > 0) {
        atualizados += result.modifiedCount;
        detalhes.push({ nome, count: result.modifiedCount });
      }
    }

    res.json({ message: `${atualizados} exercício(s) atualizado(s).`, detalhes });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, getById, criar, atualizar, deletar, importar, syncThumbnails };
