const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { uploadMisto } = require('../middlewares/upload');
const { listar, getById, criar, atualizar, deletar, importar, syncThumbnails } = require('../controllers/exercicio.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('personal', 'admin'));

router.get('/', listar);
router.post('/sync-thumbnails', syncThumbnails);
router.post('/importar', importar);
router.get('/:id', getById);
router.post('/', uploadMisto, criar);
router.patch('/:id', uploadMisto, atualizar);
router.delete('/:id', deletar);

module.exports = router;
