const PlanoTreino = require('../models/PlanoTreino');
const Treino = require('../models/Treino');
const User = require('../models/User');

// GET /planos — listar planos do personal
async function listar(req, res, next) {
  try {
    const planos = await PlanoTreino.find({ personal: req.user.id, ativo: true })
      .populate({
        path: 'treinos.treino',
        select: 'nome tipo exercicios',
        populate: { path: 'exercicios.exercicio', select: 'nome' },
      })
      .sort({ createdAt: -1 });
    res.json(planos);
  } catch (err) {
    next(err);
  }
}

// POST /planos — criar plano com treinos template
async function criar(req, res, next) {
  try {
    const { nome, descricao, nivel, treinos, duracaoMeses, dataInicio } = req.body;
    // treinos: [{ tipo, nome, diasSemana, exercicios }]

    if (!treinos || !treinos.length) {
      return res.status(400).json({ message: 'Informe ao menos um treino no plano.' });
    }

    const plano = await PlanoTreino.create({
      nome,
      descricao: descricao || '',
      nivel: nivel || 'iniciante',
      duracaoMeses: duracaoMeses ?? null,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      personal: req.user.id,
    });

    // Cria os treinos-template vinculados ao plano
    const treinosCreated = await Promise.all(
      treinos.map(async (t, i) => {
        return Treino.create({
          nome: t.nome,
          tipo: t.tipo || String.fromCharCode(65 + i), // A, B, C...
          descricao: t.descricao || '',
          diasSemana: t.diasSemana || [],
          exercicios: t.exercicios || [],
          personal: req.user.id,
          aluno: null,
          plano: plano._id,
          isTemplate: true,
        });
      })
    );

    plano.treinos = treinosCreated.map((t, i) => ({ ordem: i, treino: t._id }));
    await plano.save();

    const planoPopulado = await PlanoTreino.findById(plano._id).populate({
      path: 'treinos.treino',
      select: 'nome tipo exercicios diasSemana',
      populate: { path: 'exercicios.exercicio', select: 'nome' },
    });

    res.status(201).json(planoPopulado);
  } catch (err) {
    next(err);
  }
}

// GET /planos/:id — detalhe de um plano
async function detalhe(req, res, next) {
  try {
    const plano = await PlanoTreino.findOne({ _id: req.params.id, personal: req.user.id }).populate({
      path: 'treinos.treino',
      populate: { path: 'exercicios.exercicio', select: 'nome musculosPrincipais' },
    });
    if (!plano) return res.status(404).json({ message: 'Plano não encontrado.' });
    res.json(plano);
  } catch (err) {
    next(err);
  }
}

// PATCH /planos/:id — editar plano (nome, descricao, nivel)
async function editar(req, res, next) {
  try {
    const plano = await PlanoTreino.findOne({ _id: req.params.id, personal: req.user.id });
    if (!plano) return res.status(404).json({ message: 'Plano não encontrado.' });

    const { nome, descricao, nivel, duracaoMeses, dataInicio } = req.body;
    if (nome !== undefined) plano.nome = nome;
    if (descricao !== undefined) plano.descricao = descricao;
    if (nivel !== undefined) plano.nivel = nivel;
    if (duracaoMeses !== undefined) plano.duracaoMeses = duracaoMeses;
    if (dataInicio !== undefined) plano.dataInicio = dataInicio ? new Date(dataInicio) : null;

    await plano.save();
    res.json(plano);
  } catch (err) {
    next(err);
  }
}

// DELETE /planos/:id — excluir plano
async function excluir(req, res, next) {
  try {
    const plano = await PlanoTreino.findOne({ _id: req.params.id, personal: req.user.id });
    if (!plano) return res.status(404).json({ message: 'Plano não encontrado.' });

    // Remove treinos-template do plano
    await Treino.deleteMany({ plano: plano._id, isTemplate: true });
    plano.ativo = false;
    await plano.save();

    res.json({ message: 'Plano excluído.' });
  } catch (err) {
    next(err);
  }
}

// POST /planos/:id/atribuir — atribuir plano a um aluno (clona os treinos)
async function atribuir(req, res, next) {
  try {
    const { alunoId } = req.body;

    const [plano, aluno] = await Promise.all([
      PlanoTreino.findOne({ _id: req.params.id, personal: req.user.id }).populate('treinos.treino'),
      User.findOne({ _id: alunoId, personalId: req.user.id, role: 'aluno' }),
    ]);

    if (!plano) return res.status(404).json({ message: 'Plano não encontrado.' });
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    // Clona cada treino-template para o aluno
    const treinosClonados = await Promise.all(
      plano.treinos.map(async ({ treino }) => {
        const t = treino;
        return Treino.create({
          nome: t.nome,
          tipo: t.tipo,
          descricao: t.descricao,
          diasSemana: t.diasSemana,
          exercicios: t.exercicios.map((ex) => ({
            exercicio: ex.exercicio,
            ordem: ex.ordem,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga,
            descanso: ex.descanso,
            observacoes: ex.observacoes,
          })),
          personal: req.user.id,
          aluno: alunoId,
          plano: plano._id,
          isTemplate: false,
          dataInicio: plano.dataInicio || new Date(),
          duracaoMeses: plano.duracaoMeses ?? null,
        });
      })
    );

    res.status(201).json({
      message: `${treinosClonados.length} treino(s) atribuídos a ${aluno.nome}.`,
      treinos: treinosClonados,
    });
  } catch (err) {
    next(err);
  }
}

// POST /planos/:id/duplicar — duplicar um plano
async function duplicar(req, res, next) {
  try {
    const planoOriginal = await PlanoTreino.findOne({
      _id: req.params.id,
      personal: req.user.id,
    }).populate('treinos.treino');

    if (!planoOriginal) return res.status(404).json({ message: 'Plano não encontrado.' });

    const novoPlano = await PlanoTreino.create({
      nome: `${planoOriginal.nome} (cópia)`,
      descricao: planoOriginal.descricao,
      nivel: planoOriginal.nivel,
      personal: req.user.id,
    });

    const treinosClonados = await Promise.all(
      planoOriginal.treinos.map(async ({ treino, ordem }) => {
        const t = treino;
        const novo = await Treino.create({
          nome: t.nome,
          tipo: t.tipo,
          descricao: t.descricao,
          diasSemana: t.diasSemana,
          exercicios: t.exercicios,
          personal: req.user.id,
          aluno: null,
          plano: novoPlano._id,
          isTemplate: true,
        });
        return { ordem, treino: novo._id };
      })
    );

    novoPlano.treinos = treinosClonados;
    await novoPlano.save();

    res.status(201).json(novoPlano);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, detalhe, editar, excluir, atribuir, duplicar };
