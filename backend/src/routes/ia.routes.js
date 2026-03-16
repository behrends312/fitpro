const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { gerarTreino } = require('../controllers/ia.controller');

const router = Router();

router.use(authenticate);
router.post('/gerar-treino', authorize('personal'), gerarTreino);

module.exports = router;
