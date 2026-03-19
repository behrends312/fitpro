/**
 * Baixa imagens de exercícios do free-exercise-db (GitHub) e faz upload para R2.
 * Depois atualiza o MongoDB (campo thumbnailUrl de cada Exercicio).
 *
 * Uso: node scripts/sync-exercise-images.js
 */
require('dotenv').config();
const https = require('https');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// ── R2 ───────────────────────────────────────────────────────────────────────
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

// ── Mapeamento PT-BR → free-exercise-db ID ──────────────────────────────────
const MAPPING = {
  // Peito
  'Supino Reto': 'Barbell_Bench_Press_-_Medium_Grip',
  'Supino Inclinado': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Supino Declinado': 'Decline_Barbell_Bench_Press',
  'Supino com Halteres': 'Dumbbell_Bench_Press',
  'Crucifixo': 'Dumbbell_Flyes',
  'Crossover': 'Cable_Crossover',
  'Flexão de Braço': 'Pushups',
  'Pec Deck': 'Butterfly',
  'Pullover': 'Bent-Arm_Dumbbell_Pullover',

  // Costas
  'Puxada Frontal': 'Wide-Grip_Lat_Pulldown',
  'Puxada Fechada': 'Close-Grip_Front_Lat_Pulldown',
  'Remada Curvada': 'Bent_Over_Barbell_Row',
  'Remada Unilateral': 'One-Arm_Dumbbell_Row',
  'Remada Baixa': 'Seated_Cable_Rows',
  'Barra Fixa': 'Pullups',
  'Levantamento Terra': 'Barbell_Deadlift',
  'Remada com Barra T': 'Bent_Over_Two-Arm_Long_Bar_Row',
  'Remada na Máquina': 'Seated_Cable_Rows',

  // Ombros
  'Desenvolvimento com Barra': 'Barbell_Shoulder_Press',
  'Desenvolvimento com Halteres': 'Standing_Dumbbell_Press',
  'Elevação Lateral': 'Side_Lateral_Raise',
  'Elevação Frontal': 'Front_Dumbbell_Raise',
  'Encolhimento de Ombros': 'Barbell_Shrug',
  'Crucifixo Invertido': 'Reverse_Flyes',
  'Desenvolvimento Arnold': 'Arnold_Dumbbell_Press',
  'Elevação Lateral no Cabo': 'Cable_Rear_Delt_Raise',

  // Bíceps
  'Rosca Direta': 'Barbell_Curl',
  'Rosca Alternada': 'Dumbbell_Alternate_Bicep_Curl',
  'Rosca Martelo': 'Alternate_Hammer_Curl',
  'Rosca Concentrada': 'Concentration_Curls',
  'Rosca no Cabo': 'Overhead_Cable_Curl',
  'Rosca Scott': 'Preacher_Curl',
  'Rosca 21': 'Barbell_Curl',

  // Tríceps
  'Tríceps Pulley': 'Triceps_Pushdown',
  'Tríceps Corda': 'Triceps_Pushdown_-_Rope_Attachment',
  'Tríceps Testa': 'EZ-Bar_Skullcrusher',
  'Mergulho (Dips)': 'Dips_-_Triceps_Version',
  'Tríceps Francês': 'Standing_Dumbbell_Triceps_Extension',
  'Kickback': 'Tricep_Dumbbell_Kickback',
  'Tríceps na Máquina': 'Triceps_Pushdown',

  // Quadríceps
  'Agachamento Livre': 'Barbell_Squat',
  'Agachamento Sumô': 'Sumo_Deadlift',
  'Leg Press 45°': 'Leg_Press',
  'Cadeira Extensora': 'Leg_Extensions',
  'Avanço (Lunge)': 'Dumbbell_Lunges',
  'Hack Squat': 'Barbell_Hack_Squat',
  'Agachamento Goblet': 'Goblet_Squat',

  // Posterior / Glúteos
  'Mesa Flexora': 'Lying_Leg_Curls',
  'Cadeira Flexora': 'Seated_Leg_Curl',
  'Stiff': 'Stiff-Legged_Barbell_Deadlift',
  'Elevação Pélvica': 'Barbell_Hip_Thrust',
  'Glúteo no Cabo': 'Glute_Kickback',
  'Abdutora': 'Thigh_Abductor',
  'Agachamento Búlgaro': 'Single_Leg_Squat',
  'Levantamento Terra Romeno': 'Romanian_Deadlift_With_Dumbbells',

  // Abdômen
  'Abdominal Crunch': 'Crunches',
  'Prancha': 'Front_Plank',
  'Elevação de Pernas': 'Flat_Bench_Lying_Leg_Raise',
  'Abdominal na Polia': 'Cable_Crunch',
  'Abdominal Oblíquo': 'Cross-Body_Crunch',
  'Mountain Climber': 'Mountain_Climbers',
  'Russian Twist': 'Russian_Twist',
  'Dead Bug': 'Dead_Bug',

  // Panturrilha
  'Panturrilha em Pé': 'Standing_Calf_Raises',
  'Panturrilha Sentado': 'Seated_Calf_Raise',
  'Panturrilha Livre': 'Standing_Calf_Raises',
  'Panturrilha no Leg Press': 'Calf_Press_On_The_Leg_Press_Machine',
};

// IDs alternativos para tentar se o principal falhar
const FALLBACKS = {
  'Crossover': ['Bodyweight_Flyes'],
  'Pec Deck': ['Machine_Bench_Press'],
  'Pullover': ['Bent-Arm_Barbell_Pullover', 'Dumbbell_Pullover'],
  'Puxada Fechada': ['Underhand_Cable_Pulldowns', 'V-Bar_Pulldown'],
  'Remada na Máquina': ['Machine_Bench_Press'],
  'Desenvolvimento com Halteres': ['Dumbbell_Shoulder_Press', 'Seated_Dumbbell_Press'],
  'Elevação Lateral no Cabo': ['Bent_Over_Low-Pulley_Side_Lateral'],
  'Rosca Alternada': ['Alternate_Incline_Dumbbell_Curl'],
  'Rosca no Cabo': ['Cable_Hammer_Curls_-_Rope_Attachment'],
  'Rosca Scott': ['Preacher_Curl', 'Machine_Preacher_Curls'],
  'Tríceps Testa': ['Lying_Triceps_Press', 'Decline_EZ_Bar_Triceps_Extension'],
  'Tríceps Francês': ['Seated_Triceps_Press', 'Overhead_Triceps_Extension'],
  'Agachamento Sumô': ['Bodyweight_Squat', 'Barbell_Full_Squat'],
  'Agachamento Goblet': ['Bodyweight_Squat', 'Dumbbell_Squat'],
  'Glúteo no Cabo': ['Hip_Extension_with_Bands'],
  'Agachamento Búlgaro': ['Dumbbell_Lunges'],
  'Levantamento Terra Romeno': ['Stiff-Legged_Barbell_Deadlift'],
  'Prancha': ['Plank', 'Bodyweight_Flyes'],
  'Dead Bug': ['Alternate_Heel_Touchers'],
  'Mountain Climber': ['Air_Bike'],
};

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// ── Funções ──────────────────────────────────────────────────────────────────
function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
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

async function uploadR2(key, buffer, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));
  return `${PUBLIC_URL}/${key}`;
}

async function tryDownloadExercise(exerciseId) {
  // Tenta baixar 0.jpg e 1.jpg
  const url0 = `${BASE_URL}/${exerciseId}/0.jpg`;
  const url1 = `${BASE_URL}/${exerciseId}/1.jpg`;

  const img0 = await download(url0);
  let img1 = null;
  try { img1 = await download(url1); } catch {}

  return { img0, img1 };
}

async function processExercise(nomePt, exerciseId, fallbacks) {
  const idsToTry = [exerciseId, ...(fallbacks || [])];

  for (const id of idsToTry) {
    try {
      const key0 = `exercises/${id}/0.jpg`;
      const key1 = `exercises/${id}/1.jpg`;

      // Verifica se já existe no R2
      if (await jaExisteNoR2(key0)) {
        return { url0: `${PUBLIC_URL}/${key0}`, url1: `${PUBLIC_URL}/${key1}`, id };
      }

      const { img0, img1 } = await tryDownloadExercise(id);

      const url0 = await uploadR2(key0, img0, 'image/jpeg');
      let url1 = null;
      if (img1) {
        url1 = await uploadR2(key1, img1, 'image/jpeg');
      }

      return { url0, url1, id };
    } catch {
      // Tenta próximo fallback
      continue;
    }
  }
  return null;
}

async function main() {
  const fs = require('fs');
  const entries = Object.entries(MAPPING);
  console.log(`Processando ${entries.length} exercícios (upload R2 apenas)...\n`);

  const resultados = {};
  let ok = 0;
  let falha = 0;

  for (const [nomePt, exerciseId] of entries) {
    process.stdout.write(`  ${nomePt} → ${exerciseId}... `);

    try {
      const result = await processExercise(nomePt, exerciseId, FALLBACKS[nomePt]);

      if (!result) {
        console.log('✗ sem imagem');
        falha++;
        continue;
      }

      resultados[nomePt] = result.url0;
      ok++;
      console.log(`✓ [${result.id}]`);
    } catch (err) {
      console.log(`✗ erro: ${err.message}`);
      falha++;
    }

    // Rate limit: 200ms entre requests
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n═══ Resultado: ${ok} OK, ${falha} falhas ═══\n`);

  // Salva mapeamento para uso posterior
  fs.writeFileSync(
    __dirname + '/exercise-image-map.json',
    JSON.stringify(resultados, null, 2)
  );
  console.log('Mapeamento salvo em scripts/exercise-image-map.json');
  console.log('\nFinalizado.');
}

main().catch((err) => { console.error(err); process.exit(1); });
