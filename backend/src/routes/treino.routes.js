const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const {
  listar, listarDoAluno, getById, criar, atualizar, deletar,
} = require('../controllers/treino.controller');

const router = Router();

router.use(authenticate);

router.get('/', listar);
router.get('/aluno/:alunoId', authorize('personal', 'admin'), listarDoAluno);
router.get('/:id', getById);
router.post('/', authorize('personal'), criar);
router.patch('/:id', authorize('personal'), atualizar);
router.delete('/:id', authorize('personal'), deletar);

module.exports = router;
