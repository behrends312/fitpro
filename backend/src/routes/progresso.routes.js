const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { evolucaoExercicio, resumo, historico } = require('../controllers/progresso.controller');

const router = Router();

router.use(authenticate);

router.get('/resumo', resumo);
router.get('/historico', historico);
router.get('/exercicio/:exercicioId', evolucaoExercicio);

module.exports = router;
