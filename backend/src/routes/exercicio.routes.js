const { Router } = require('express');
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { uploadVideo, uploadImage } = require('../middlewares/upload');
const {
  listar, getById, criar, atualizar, deletar, importar,
} = require('../controllers/exercicio.controller');

const router = Router();

// Upload misto (vídeo + thumbnail)
const uploadMisto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = file.fieldname === 'video'
        ? require('path').join(__dirname, '../../uploads/videos')
        : require('path').join(__dirname, '../../uploads/images');
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${require('path').extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

router.use(authenticate);
router.use(authorize('personal', 'admin'));

router.get('/', listar);
router.post('/importar', importar);
router.get('/:id', getById);
router.post('/', uploadMisto, criar);
router.patch('/:id', uploadMisto, atualizar);
router.delete('/:id', deletar);

module.exports = router;
