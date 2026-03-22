const User = require('../models/User');
const Treino = require('../models/Treino');
const PlanoTreino = require('../models/PlanoTreino');
const Progresso = require('../models/Progresso');
const TreinoSessao = require('../models/TreinoSessao');
const bcrypt = require('bcryptjs');

// GET /users/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('personalId', 'nome email');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// PATCH /users/me
async function updateMe(req, res, next) {
  try {
    const { nome, telefone, objetivo, peso, altura, dataNascimento, especialidade, bio, senha } = req.body;
    const update = {};

    if (nome !== undefined) update.nome = nome;
    if (telefone !== undefined) update.telefone = telefone;
    if (objetivo !== undefined) update.objetivo = objetivo;
    if (peso !== undefined) update.peso = peso;
    if (altura !== undefined) update.altura = altura;
    if (dataNascimento !== undefined) update.dataNascimento = dataNascimento;
    if (especialidade !== undefined) update.especialidade = especialidade;
    if (bio !== undefined) update.bio = bio;

    if (req.file) {
      update.foto = `/uploads/images/${req.file.filename}`;
    }

    if (senha) {
      update.password = await bcrypt.hash(senha, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// GET /users/alunos — personal lista seus alunos
async function listarMeusAlunos(req, res, next) {
  try {
    const alunos = await User.find({ personalId: req.user.id, role: 'aluno' })
      .select('-password')
      .sort({ nome: 1 });
    res.json(alunos);
  } catch (err) {
    next(err);
  }
}

// GET /users/alunos/:id — personal vê detalhes de um aluno
async function getAluno(req, res, next) {
  try {
    const aluno = await User.findOne({ _id: req.params.id, personalId: req.user.id, role: 'aluno' })
      .select('-password');
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });
    res.json(aluno);
  } catch (err) {
    next(err);
  }
}

// POST /users/alunos — personal cria/vincula aluno
async function criarAluno(req, res, next) {
  try {
    const personal = await User.findById(req.user.id);
    const totalAlunos = await User.countDocuments({ personalId: req.user.id, role: 'aluno' });

    const limite = personal.limiteAlunos;
    if (totalAlunos >= limite) {
      return res.status(403).json({
        message: `Seu plano ${personal.plano.tipo} permite até ${limite} aluno(s). Faça upgrade para continuar.`,
      });
    }

    const { email, nome, telefone, objetivo, peso, altura, dataNascimento, senha } = req.body;

    // Verifica se e-mail já existe
    const existe = await User.findOne({ email: email.toLowerCase() });
    if (existe) {
      // Se já existe e não tem personal, vincula
      if (!existe.personalId) {
        existe.personalId = req.user.id;
        await existe.save();
        return res.status(200).json({ message: 'Aluno existente vinculado.', aluno: existe });
      }
      return res.status(409).json({ message: 'E-mail já cadastrado em outra conta.' });
    }

    const hash = await bcrypt.hash(senha || '123456', 10);
    const aluno = await User.create({
      email,
      password: hash,
      role: 'aluno',
      nome: nome || '',
      telefone: telefone || '',
      objetivo: objetivo || '',
      peso: peso || null,
      altura: altura || null,
      dataNascimento: dataNascimento || null,
      personalId: req.user.id,
    });

    const { password: _, ...alunoData } = aluno.toObject();
    res.status(201).json(alunoData);
  } catch (err) {
    next(err);
  }
}

// PATCH /users/alunos/:id — personal edita dados do aluno
async function editarAluno(req, res, next) {
  try {
    const aluno = await User.findOne({ _id: req.params.id, personalId: req.user.id, role: 'aluno' });
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    const { nome, telefone, objetivo, peso, altura } = req.body;
    if (nome !== undefined) aluno.nome = nome;
    if (telefone !== undefined) aluno.telefone = telefone;
    if (objetivo !== undefined) aluno.objetivo = objetivo;
    if (peso !== undefined) aluno.peso = peso || null;
    if (altura !== undefined) aluno.altura = altura || null;

    await aluno.save();
    const { password: _, ...data } = aluno.toObject();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /users/alunos/:id — personal deleta aluno e todos os dados vinculados
async function removerAluno(req, res, next) {
  try {
    const aluno = await User.findOne({ _id: req.params.id, personalId: req.user.id, role: 'aluno' });
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    const alunoId = aluno._id;

    // Deleta todos os dados do aluno em paralelo
    await Promise.all([
      Treino.deleteMany({ aluno: alunoId }),
      TreinoSessao.deleteMany({ aluno: alunoId }),
      Progresso.deleteMany({ aluno: alunoId }),
      User.deleteOne({ _id: alunoId }),
    ]);

    res.json({ message: 'Aluno e todos os seus dados foram removidos.' });
  } catch (err) {
    next(err);
  }
}

// PATCH /users/me/anamnese — aluno salva sua anamnese
async function salvarAnamnese(req, res, next) {
  try {
    const campos = [
      'tempoTreinando', 'frequenciaSemanal',
      'temLesaoAtual', 'lesaoAtual', 'temLesaoPassada', 'lesaoPassada',
      'doencasCronicas', 'problemasCardiacos', 'usaMedicamentos', 'medicamentos',
      'temLimitacaoFisica', 'limitacaoFisica', 'temDeficiencia', 'deficiencia',
      'nivelAtividade', 'profissaoSedentaria', 'fumante', 'consumoAlcool', 'observacoes',
    ];
    const update = {};
    campos.forEach((c) => { if (req.body[c] !== undefined) update[`anamnese.${c}`] = req.body[c]; });
    update.anamneseConcluida = true;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// GET /users/alunos/:id/anamnese — personal consulta anamnese do aluno
async function getAnamneseAluno(req, res, next) {
  try {
    const aluno = await User.findOne({ _id: req.params.id, personalId: req.user.id, role: 'aluno' })
      .select('nome email anamnese anamneseConcluida peso altura dataNascimento objetivo');
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });
    res.json(aluno);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, listarMeusAlunos, getAluno, criarAluno, editarAluno, removerAluno, salvarAnamnese, getAnamneseAluno };
