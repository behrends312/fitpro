const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const {
  dashboard, listarPersonais, getPersonal, listarAlunos,
  atualizarPersonal, desativarPersonal, pagamentos,
} = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/personais', listarPersonais);
router.get('/personais/:id', getPersonal);
router.patch('/personais/:id', atualizarPersonal);
router.delete('/personais/:id', desativarPersonal);
router.get('/alunos', listarAlunos);
router.get('/pagamentos', pagamentos);

module.exports = router;
