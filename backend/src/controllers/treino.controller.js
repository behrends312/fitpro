const Treino = require('../models/Treino');
const User = require('../models/User');

// GET /treinos — personal lista treinos seus, aluno lista os seus
async function listar(req, res, next) {
  try {
    const query =
      req.user.role === 'personal'
        ? { personal: req.user.id, ativo: true }
        : { aluno: req.user.id, ativo: true };

    const treinos = await Treino.find(query)
      .populate('aluno', 'nome email foto')
      .populate('personal', 'nome email foto')
      .populate('exercicios.exercicio', 'nome videoUrl thumbnailUrl musculosPrincipais equipamento')
      .sort({ createdAt: -1 });

    res.json(treinos);
  } catch (err) {
    next(err);
  }
}

// GET /treinos/aluno/:alunoId — personal lista treinos de um aluno específico
async function listarDoAluno(req, res, next) {
  try {
    const treinos = await Treino.find({
      personal: req.user.id,
      aluno: req.params.alunoId,
      ativo: true,
    })
      .populate('exercicios.exercicio', 'nome videoUrl thumbnailUrl musculosPrincipais')
      .sort({ createdAt: -1 });

    res.json(treinos);
  } catch (err) {
    next(err);
  }
}

// GET /treinos/:id
async function getById(req, res, next) {
  try {
    const query =
      req.user.role === 'personal'
        ? { _id: req.params.id, personal: req.user.id }
        : { _id: req.params.id, aluno: req.user.id };

    const treino = await Treino.findOne(query)
      .populate('aluno', 'nome email foto')
      .populate('personal', 'nome email foto')
      .populate('exercicios.exercicio');

    if (!treino) return res.status(404).json({ message: 'Treino não encontrado.' });
    res.json(treino);
  } catch (err) {
    next(err);
  }
}

// POST /treinos — personal cria treino para um aluno
async function criar(req, res, next) {
  try {
    const { nome, descricao, tipo, alunoId, exercicios, diasSemana } = req.body;

    // Verifica se o aluno pertence ao personal
    const aluno = await User.findOne({ _id: alunoId, personalId: req.user.id });
    if (!aluno) return res.status(403).json({ message: 'Aluno não encontrado ou não é seu aluno.' });

    const treino = await Treino.create({
      nome,
      descricao,
      tipo,
      aluno: alunoId,
      personal: req.user.id,
      exercicios: exercicios || [],
      diasSemana: diasSemana || [],
    });

    await treino.populate('exercicios.exercicio', 'nome videoUrl thumbnailUrl');
    res.status(201).json(treino);
  } catch (err) {
    next(err);
  }
}

// PATCH /treinos/:id — personal atualiza treino
async function atualizar(req, res, next) {
  try {
    const treino = await Treino.findOne({ _id: req.params.id, personal: req.user.id });
    if (!treino) return res.status(404).json({ message: 'Treino não encontrado ou sem permissão.' });

    const campos = ['nome', 'descricao', 'tipo', 'diasSemana', 'ativo'];
    campos.forEach((c) => {
      if (req.body[c] !== undefined) treino[c] = req.body[c];
    });
    if (req.body.exercicios !== undefined) treino.exercicios = req.body.exercicios;

    await treino.save();
    await treino.populate('exercicios.exercicio', 'nome videoUrl thumbnailUrl');
    res.json(treino);
  } catch (err) {
    next(err);
  }
}

// DELETE /treinos/:id
async function deletar(req, res, next) {
  try {
    const treino = await Treino.findOne({ _id: req.params.id, personal: req.user.id });
    if (!treino) return res.status(404).json({ message: 'Treino não encontrado ou sem permissão.' });
    treino.ativo = false;
    await treino.save();
    res.json({ message: 'Treino removido.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, listarDoAluno, getById, criar, atualizar, deletar };
