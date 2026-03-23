const TreinoSessao = require('../models/TreinoSessao');
const Progresso = require('../models/Progresso');
const Treino = require('../models/Treino');
const User = require('../models/User');
const { processarGamificacao } = require('../utils/gamificacao');

// POST /sessoes — aluno inicia uma sessão de treino
async function iniciar(req, res, next) {
  try {
    const { treinoId } = req.body;

    const treino = await Treino.findOne({ _id: treinoId, aluno: req.user.id, ativo: true });
    if (!treino) return res.status(404).json({ message: 'Treino não encontrado.' });

    // Cancela sessão em andamento anterior se existir
    await TreinoSessao.updateMany(
      { aluno: req.user.id, status: 'em_andamento' },
      { status: 'cancelada', dataFim: new Date() }
    );

    // Monta estrutura inicial de exercícios executados
    const exerciciosExecutados = treino.exercicios.map((ex) => ({
      exercicio: ex.exercicio,
      series: Array.from({ length: ex.series }, (_, i) => ({
        numero: i + 1,
        repsExecutadas: 0,
        cargaUsada: ex.carga || 0,
        completada: false,
        tempoDescansoSegundos: ex.descanso || 60,
      })),
    }));

    const sessao = await TreinoSessao.create({
      treino: treinoId,
      aluno: req.user.id,
      exerciciosExecutados,
    });

    await sessao.populate('treino', 'nome tipo');
    await sessao.populate('exerciciosExecutados.exercicio', 'nome musculosPrincipais videoUrl thumbnailUrl');
    res.status(201).json(sessao);
  } catch (err) {
    next(err);
  }
}

// PATCH /sessoes/:id — aluno atualiza progresso durante o treino
async function atualizar(req, res, next) {
  try {
    const sessao = await TreinoSessao.findOne({
      _id: req.params.id,
      aluno: req.user.id,
      status: 'em_andamento',
    });
    if (!sessao) return res.status(404).json({ message: 'Sessão não encontrada ou já encerrada.' });

    if (req.body.exerciciosExecutados) {
      sessao.exerciciosExecutados = req.body.exerciciosExecutados;
    }
    if (req.body.notasAluno !== undefined) sessao.notasAluno = req.body.notasAluno;

    await sessao.save();
    res.json(sessao);
  } catch (err) {
    next(err);
  }
}

// POST /sessoes/:id/concluir — aluno finaliza o treino
async function concluir(req, res, next) {
  try {
    const sessao = await TreinoSessao.findOne({
      _id: req.params.id,
      aluno: req.user.id,
      status: 'em_andamento',
    });
    if (!sessao) return res.status(404).json({ message: 'Sessão não encontrada ou já encerrada.' });

    sessao.dataFim = new Date();
    sessao.duracaoSegundos = Math.floor((sessao.dataFim - sessao.dataInicio) / 1000);
    sessao.status = 'concluida';
    if (req.body.notasAluno) sessao.notasAluno = req.body.notasAluno;
    if (req.body.exerciciosExecutados) sessao.exerciciosExecutados = req.body.exerciciosExecutados;

    await sessao.save();

    // Gera registros de progresso para cada exercício
    const progressoPromises = sessao.exerciciosExecutados.map(async (ex) => {
      const seriesCompletas = ex.series.filter((s) => s.completada);
      if (seriesCompletas.length === 0) return;

      const cargaMaxima = Math.max(...seriesCompletas.map((s) => s.cargaUsada));
      const repsMaximas = Math.max(...seriesCompletas.map((s) => s.repsExecutadas));
      const volumeTotal = seriesCompletas.reduce((acc, s) => acc + s.cargaUsada * s.repsExecutadas, 0);

      return Progresso.create({
        aluno: req.user.id,
        exercicio: ex.exercicio,
        sessao: sessao._id,
        data: sessao.dataFim,
        cargaMaxima,
        repsMaximas,
        totalSeries: seriesCompletas.length,
        volumeTotal,
      });
    });

    await Promise.all(progressoPromises);

    // Gamificação
    const user = await User.findById(req.user.id);
    const gami = processarGamificacao(user, sessao);

    user.xp = gami.xp;
    user.nivel = gami.nivel;
    user.streak = gami.streak;
    user.melhorStreak = gami.melhorStreak;
    user.ultimoTreino = gami.ultimoTreino;
    user.totalTreinos = gami.totalTreinos;
    if (gami.badgesNovos.length > 0) {
      user.badges.push(...gami.badgesNovos);
    }
    await user.save();

    res.json({ sessao, gamificacao: gami.resultado });
  } catch (err) {
    next(err);
  }
}

// GET /sessoes/:id — detalhe de uma sessão
async function detalhe(req, res, next) {
  try {
    const sessao = await TreinoSessao.findOne({ _id: req.params.id, aluno: req.user.id })
      .populate('treino', 'nome tipo')
      .populate('exerciciosExecutados.exercicio', 'nome musculosPrincipais');
    if (!sessao) return res.status(404).json({ message: 'Sessão não encontrada.' });
    res.json(sessao);
  } catch (err) {
    next(err);
  }
}

// GET /sessoes — histórico de sessões do aluno
async function historico(req, res, next) {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessoes = await TreinoSessao.find({ aluno: req.user.id, status: 'concluida' })
      .populate('treino', 'nome tipo')
      .sort({ dataFim: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TreinoSessao.countDocuments({ aluno: req.user.id, status: 'concluida' });

    res.json({ sessoes, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /sessoes/ativa — sessão em andamento (ignora sessões com mais de 24h)
async function sessaoAtiva(req, res, next) {
  try {
    const limite = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessao = await TreinoSessao.findOne({
      aluno: req.user.id,
      status: 'em_andamento',
      dataInicio: { $gte: limite },
    })
      .populate('treino', 'nome tipo')
      .populate('exerciciosExecutados.exercicio', 'nome videoUrl thumbnailUrl');
    res.json(sessao || null);
  } catch (err) {
    next(err);
  }
}

module.exports = { iniciar, atualizar, concluir, historico, sessaoAtiva, detalhe };
