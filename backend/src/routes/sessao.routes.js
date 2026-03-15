const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const {
  iniciar, atualizar, concluir, historico, sessaoAtiva,
} = require('../controllers/sessao.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('aluno'));

router.get('/ativa', sessaoAtiva);
router.get('/historico', historico);
router.post('/', iniciar);
router.patch('/:id', atualizar);
router.post('/:id/concluir', concluir);

module.exports = router;
