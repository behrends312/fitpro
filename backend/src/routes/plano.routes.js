const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const {
  listar, criar, detalhe, editar, excluir, atribuir, duplicar,
} = require('../controllers/plano.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('personal'));

router.get('/', listar);
router.post('/', criar);
router.get('/:id', detalhe);
router.patch('/:id', editar);
router.delete('/:id', excluir);
router.post('/:id/atribuir', atribuir);
router.post('/:id/duplicar', duplicar);

module.exports = router;
