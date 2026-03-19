/**
 * Baixa os GIFs do ExerciseDB e faz upload para o R2.
 * Uso: node scripts/upload-gifs-r2.js
 * Requer as variáveis de ambiente do .env (CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, etc.)
 */
require('dotenv').config();
const https = require('https');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const RAPIDAPI_KEY = '75cabdfe0amshf7024175261f832p14c587jsn12470bdfb71d';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Mapa: id ExerciseDB → nome do exercício
const EXERCICIOS = {
  '0025': 'Supino Reto',
  '0047': 'Supino Inclinado',
  '0033': 'Supino Declinado',
  '0289': 'Supino com Halteres',
  '0308': 'Crucifixo',
  '0492': 'Flexão de Braço',
  '1494': 'Pec Deck',
  '0375': 'Pullover',
  '0673': 'Puxada Frontal',
  '3117': 'Puxada Fechada',
  '0027': 'Remada Curvada',
  '0293': 'Remada Unilateral',
  '0180': 'Remada Baixa',
  '0651': 'Barra Fixa',
  '0032': 'Levantamento Terra',
  '0606': 'Remada com Barra T',
  '1350': 'Remada na Máquina',
  '0091': 'Desenvolvimento com Barra',
  '0178': 'Elevação Lateral',
  '0040': 'Elevação Frontal',
  '0406': 'Encolhimento de Ombros',
  '0154': 'Crucifixo Invertido',
  '0287': 'Desenvolvimento Arnold',
  '0031': 'Rosca Direta',
  '1651': 'Rosca Alternada',
  '0165': 'Rosca Martelo',
  '0089': 'Rosca Concentrada',
  '0868': 'Rosca no Cabo',
  '0059': 'Rosca Scott',
  '0241': 'Tríceps Pulley',
  '1322': 'Tríceps Corda',
  '0060': 'Tríceps Testa',
  '1755': 'Mergulho (Dips)',
  '1747': 'Tríceps Francês',
  '1728': 'Kickback',
  '0102': 'Agachamento Livre',
  '3142': 'Agachamento Sumô',
  '0739': 'Leg Press 45°',
  '0585': 'Cadeira Extensora',
  '0336': 'Avanço (Lunge)',
  '0046': 'Hack Squat',
  '0534': 'Agachamento Goblet',
  '0496': 'Mesa Flexora',
  '0599': 'Cadeira Flexora',
  '0085': 'Stiff',
  '3236': 'Elevação Pélvica',
  '0860': 'Glúteo no Cabo',
  '1427': 'Abdutora',
  '0097': 'Agachamento Búlgaro',
  '0175': 'Abdominal Crunch',
  '0464': 'Prancha',
  '0472': 'Elevação de Pernas',
  '0832': 'Abdominal na Polia',
  '0635': 'Abdominal Oblíquo',
  '0630': 'Mountain Climber',
  '0014': 'Russian Twist',
  '0276': 'Dead Bug',
  '0417': 'Panturrilha em Pé',
  '0088': 'Panturrilha Sentado',
  '0738': 'Panturrilha no Leg Press',
};

function downloadGif(exerciseId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'exercisedb.p.rapidapi.com',
      path: `/exercises/exercise/${exerciseId}`,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const ex = JSON.parse(data);
          // Tenta gifUrl primeiro, depois monta URL alternativa
          const gifUrl = ex.gifUrl || `https://v2.exercisedb.io/image/${exerciseId}.gif`;
          // Agora baixa o GIF em binário
          downloadBinary(gifUrl).then(resolve).catch(reject);
        } catch {
          reject(new Error('parse error'));
        }
      });
    }).on('error', reject);
  });
}

function downloadBinary(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
        'Referer': 'https://rapidapi.com',
      },
    };
    https.get(opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBinary(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function jaExisteNoR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const resultado = {};
  const ids = Object.keys(EXERCICIOS);

  console.log(`Processando ${ids.length} GIFs...\n`);

  for (const id of ids) {
    const nome = EXERCICIOS[id];
    const key = `gifs/exercicios/${id}.gif`;
    process.stdout.write(`  [${id}] ${nome}... `);

    // Pula duplicatas (mesmo id usado por 2 exercícios)
    if (resultado[id]) {
      console.log('(reutilizado)');
      continue;
    }

    // Verifica se já está no R2
    if (await jaExisteNoR2(key)) {
      const url = `${PUBLIC_URL}/${key}`;
      resultado[id] = url;
      console.log('já existe ✓');
      continue;
    }

    try {
      const buffer = await downloadGif(id);
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/gif',
        CacheControl: 'public, max-age=31536000',
      }));
      const url = `${PUBLIC_URL}/${key}`;
      resultado[id] = url;
      console.log('✓ uploaded');
    } catch (e) {
      console.log(`✗ erro: ${e.message}`);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n\n=== URLs para exerciciosPredefinidos.ts ===\n');
  for (const [id, url] of Object.entries(resultado)) {
    console.log(`'${id}': '${url}',`);
  }
}

main();
