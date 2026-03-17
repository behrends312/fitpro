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

// GET /progresso/musculos — volume por grupo muscular (visão diária/semanal/mensal)
async function musculosTreinados(req, res, next) {
  try {
    const alunoId = req.user.role === 'personal' ? req.query.alunoId : req.user.id;
    const { periodo = 'semana' } = req.query; // dia, semana, mes

    const agora = new Date();
    let dataInicio;
    if (periodo === 'dia') {
      dataInicio = new Date(agora); dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'mes') {
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    } else {
      // semana — últimos 7 dias
      dataInicio = new Date(agora);
      dataInicio.setDate(agora.getDate() - 6);
      dataInicio.setHours(0, 0, 0, 0);
    }

    const registros = await Progresso.find({
      aluno: require('mongoose').Types.ObjectId.createFromHexString(alunoId),
      data: { $gte: dataInicio },
    }).populate('exercicio', 'musculosPrincipais');

    // Agrega volume total por grupo muscular
    const volumePorMusculo = {};
    for (const r of registros) {
      const musculos = r.exercicio?.musculosPrincipais || [];
      for (const m of musculos) {
        volumePorMusculo[m] = (volumePorMusculo[m] || 0) + r.totalSeries;
      }
    }

    // Retorna como array ordenado por volume
    const resultado = Object.entries(volumePorMusculo)
      .map(([musculo, series]) => ({ musculo, series }))
      .sort((a, b) => b.series - a.series);

    res.json({ periodo, dataInicio, resultado });
  } catch (err) {
    next(err);
  }
}

module.exports = { evolucaoExercicio, resumo, historico, musculosTreinados };
