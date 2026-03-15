const User = require('../models/User');
const TreinoSessao = require('../models/TreinoSessao');
const Treino = require('../models/Treino');

// GET /admin/dashboard — visão geral da plataforma
async function dashboard(req, res, next) {
  try {
    const [totalPersonais, totalAlunos, totalSessoes, personaisAtivos] = await Promise.all([
      User.countDocuments({ role: 'personal' }),
      User.countDocuments({ role: 'aluno' }),
      TreinoSessao.countDocuments({ status: 'concluida' }),
      User.countDocuments({ role: 'personal', ativo: true }),
    ]);

    // Personais por plano
    const porPlano = await User.aggregate([
      { $match: { role: 'personal' } },
      { $group: { _id: '$plano.tipo', count: { $sum: 1 } } },
    ]);

    // Novos personais últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const novosPersonais = await User.countDocuments({
      role: 'personal',
      createdAt: { $gte: trintaDiasAtras },
    });

    res.json({
      totais: { totalPersonais, totalAlunos, totalSessoes, personaisAtivos },
      porPlano,
      novosPersonais,
    });
  } catch (err) {
    next(err);
  }
}

// GET /admin/personais — lista todos os personais com detalhes
async function listarPersonais(req, res, next) {
  try {
    const { busca, plano, ativo } = req.query;
    const query = { role: 'personal' };

    if (busca) query.$or = [{ nome: { $regex: busca, $options: 'i' } }, { email: { $regex: busca, $options: 'i' } }];
    if (plano) query['plano.tipo'] = plano;
    if (ativo !== undefined) query.ativo = ativo === 'true';

    const personais = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Conta alunos por personal
    const personaisComAlunos = await Promise.all(
      personais.map(async (p) => {
        const totalAlunos = await User.countDocuments({ personalId: p._id, role: 'aluno' });
        return { ...p.toJSON(), totalAlunos };
      })
    );

    res.json(personaisComAlunos);
  } catch (err) {
    next(err);
  }
}

// GET /admin/personais/:id — detalhes de um personal
async function getPersonal(req, res, next) {
  try {
    const personal = await User.findOne({ _id: req.params.id, role: 'personal' }).select('-password');
    if (!personal) return res.status(404).json({ message: 'Personal não encontrado.' });

    const alunos = await User.find({ personalId: req.params.id, role: 'aluno' }).select('-password');
    const totalTreinos = await Treino.countDocuments({ personal: req.params.id });

    res.json({ personal, alunos, totalTreinos });
  } catch (err) {
    next(err);
  }
}

// GET /admin/alunos — lista todos os alunos
async function listarAlunos(req, res, next) {
  try {
    const alunos = await User.find({ role: 'aluno' })
      .select('-password')
      .populate('personalId', 'nome email')
      .sort({ createdAt: -1 });

    res.json(alunos);
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/personais/:id — admin atualiza dados de um personal (plano, ativo, etc.)
async function atualizarPersonal(req, res, next) {
  try {
    const { ativo, plano } = req.body;
    const update = {};

    if (ativo !== undefined) update.ativo = ativo;
    if (plano) update.plano = plano;

    const personal = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'personal' },
      update,
      { new: true }
    ).select('-password');

    if (!personal) return res.status(404).json({ message: 'Personal não encontrado.' });
    res.json(personal);
  } catch (err) {
    next(err);
  }
}

// DELETE /admin/personais/:id — admin desativa personal
async function desativarPersonal(req, res, next) {
  try {
    const personal = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'personal' },
      { ativo: false },
      { new: true }
    ).select('-password');

    if (!personal) return res.status(404).json({ message: 'Personal não encontrado.' });
    res.json({ message: 'Personal desativado.', personal });
  } catch (err) {
    next(err);
  }
}

// GET /admin/pagamentos — visão de assinaturas/pagamentos
async function pagamentos(req, res, next) {
  try {
    const personaisComPlano = await User.find({
      role: 'personal',
      'plano.tipo': { $ne: 'trial' },
    })
      .select('nome email plano createdAt')
      .sort({ 'plano.dataInicio': -1 });

    const receita = {
      basic: 1,
      intermediate: 2,
      advanced: 3,
    };

    const resumo = personaisComPlano.map((p) => ({
      _id: p._id,
      nome: p.nome,
      email: p.email,
      plano: p.plano,
      valorMensal: receita[p.plano.tipo] || 0,
    }));

    const totalReceita = resumo.reduce((acc, p) => acc + p.valorMensal, 0);

    res.json({ personais: resumo, totalReceita });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, listarPersonais, getPersonal, listarAlunos, atualizarPersonal, desativarPersonal, pagamentos };
