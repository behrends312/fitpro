const Progresso = require('../models/Progresso');
const TreinoSessao = require('../models/TreinoSessao');

// GET /progresso/exercicio/:exercicioId — evolução de carga de um exercício
async function evolucaoExercicio(req, res, next) {
  try {
    const alunoId = req.user.role === 'personal' ? req.query.alunoId : req.user.id;

    const registros = await Progresso.find({
      aluno: alunoId,
      exercicio: req.params.exercicioId,
    })
      .sort({ data: 1 })
      .limit(30)
      .select('data cargaMaxima repsMaximas volumeTotal totalSeries');

    res.json(registros);
  } catch (err) {
    next(err);
  }
}

// GET /progresso/resumo — resumo geral do aluno (PRs, total de treinos, etc.)
async function resumo(req, res, next) {
  try {
    const alunoId = req.user.role === 'personal' ? req.query.alunoId : req.user.id;

    const [totalSessoes, ultimasSessoes, prs] = await Promise.all([
      TreinoSessao.countDocuments({ aluno: alunoId, status: 'concluida' }),

      TreinoSessao.find({ aluno: alunoId, status: 'concluida' })
        .sort({ dataFim: -1 })
        .limit(5)
        .populate('treino', 'nome tipo')
        .select('dataFim duracaoSegundos treino'),

      // Melhor carga por exercício (personal records)
      Progresso.aggregate([
        { $match: { aluno: require('mongoose').Types.ObjectId.createFromHexString(alunoId) } },
        { $sort: { data: -1 } },
        {
          $group: {
            _id: '$exercicio',
            cargaMaxima: { $max: '$cargaMaxima' },
            volumeTotal: { $max: '$volumeTotal' },
            ultimaData: { $first: '$data' },
          },
        },
        {
          $lookup: {
            from: 'exercicios',
            localField: '_id',
            foreignField: '_id',
            as: 'exercicio',
          },
        },
        { $unwind: '$exercicio' },
        { $project: { 'exercicio.nome': 1, cargaMaxima: 1, volumeTotal: 1, ultimaData: 1 } },
        { $limit: 10 },
      ]),
    ]);

    // Treinos por semana (últimas 4 semanas)
    const quatroSemanasAtras = new Date();
    quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);

    const treinosPorDia = await TreinoSessao.aggregate([
      {
        $match: {
          aluno: require('mongoose').Types.ObjectId.createFromHexString(alunoId),
          status: 'concluida',
          dataFim: { $gte: quatroSemanasAtras },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dataFim' } },
          count: { $sum: 1 },
          duracaoTotal: { $sum: '$duracaoSegundos' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalSessoes, ultimasSessoes, prs, treinosPorDia });
  } catch (err) {
    next(err);
  }
}

// GET /progresso/historico — todos os registros do aluno
async function historico(req, res, next) {
  try {
    const alunoId = req.user.role === 'personal' ? req.query.alunoId : req.user.id;
    const { exercicioId } = req.query;

    const query = { aluno: alunoId };
    if (exercicioId) query.exercicio = exercicioId;

    const registros = await Progresso.find(query)
      .populate('exercicio', 'nome musculosPrincipais')
      .sort({ data: -1 })
      .limit(100);

    res.json(registros);
  } catch (err) {
    next(err);
  }
}

module.exports = { evolucaoExercicio, resumo, historico };
