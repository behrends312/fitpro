const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/env');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'E-mail já registrado.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, role: role || 'aluno' });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, nome: user.nome, foto: user.foto, anamneseConcluida: user.anamneseConcluida }
    });
  } catch (err) {
    next(err);
  }
}

// 🔐 Novo método: login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, nome: user.nome, foto: user.foto, anamneseConcluida: user.anamneseConcluida }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
