const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { gerarTreino, chat, salvarPlanoChat } = require('../controllers/ia.controller');

const router = Router();

router.use(authenticate);

// Chat conversacional — acessível para personal e aluno
router.post('/chat', chat);

// Salvar plano gerado pelo chat — apenas personal
router.post('/salvar-plano', authorize('personal'), salvarPlanoChat);

// Endpoint legado (form-based) — apenas personal
router.post('/gerar-treino', authorize('personal'), gerarTreino);

module.exports = router;
