const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// ── Cloudflare R2 client ─────────────────────────────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'fitpro';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // ex: https://pub-xxx.r2.dev

/**
 * Faz upload de um buffer para o R2 e retorna a URL pública.
 * @param {Buffer} buffer
 * @param {string} key  - ex: "videos/1234.mp4"
 * @param {string} contentType
 */
async function uploadToR2(buffer, key, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Remove um objeto do R2 a partir da sua URL pública.
 */
async function deleteFromR2(url) {
  if (!url || !PUBLIC_URL) return;
  const key = url.replace(`${PUBLIC_URL}/`, '');
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ── Multer (memória — o controller faz o upload para o R2) ───────────────────
const MIME_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MIME_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const videoFilter = (_req, file, cb) => {
  if (MIME_VIDEO.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Formato de vídeo não suportado. Use MP4, MOV, AVI ou WebM.'), false);
};

const imageFilter = (_req, file, cb) => {
  if (MIME_IMAGE.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.'), false);
};

const mediaFilter = (_req, file, cb) => {
  if ([...MIME_VIDEO, ...MIME_IMAGE].includes(file.mimetype)) return cb(null, true);
  cb(new Error('Formato não suportado.'), false);
};

const memory = multer.memoryStorage();

const uploadVideo = multer({ storage: memory, fileFilter: videoFilter, limits: { fileSize: 500 * 1024 * 1024 } });
const uploadImage = multer({ storage: memory, fileFilter: imageFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Upload misto: campo "video" (MP4/GIF) e "thumbnail" (imagem)
const uploadMisto = multer({
  storage: memory,
  fileFilter: mediaFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

/**
 * Gera key única para o R2.
 * @param {'videos'|'images'} folder
 * @param {string} originalname
 */
function gerarKey(folder, originalname) {
  const ext = path.extname(originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${folder}/${unique}${ext}`;
}

module.exports = { uploadVideo, uploadImage, uploadMisto, uploadToR2, deleteFromR2, gerarKey };
