const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { uploadImage } = require('../middlewares/upload');
const {
  getMe, updateMe, listarMeusAlunos, getAluno, criarAluno, editarAluno, removerAluno,
} = require('../controllers/user.controller');

const router = Router();

router.use(authenticate);

// Perfil próprio
router.get('/me', getMe);
router.patch('/me', uploadImage.single('foto'), updateMe);

// Gestão de alunos (personal only)
router.get('/alunos', authorize('personal', 'admin'), listarMeusAlunos);
router.get('/alunos/:id', authorize('personal', 'admin'), getAluno);
router.post('/alunos', authorize('personal'), criarAluno);
router.patch('/alunos/:id', authorize('personal'), editarAluno);
router.delete('/alunos/:id', authorize('personal'), removerAluno);

module.exports = router;
