const mongoose = require('mongoose');
const { NODE_ENV } = require('./env');

// Mapa nome PT-BR → URL R2 (gerado por scripts/sync-exercise-images.js)
const R2 = 'https://pub-ddbbb132e2704727b752f37facf77e3f.r2.dev/exercises';
const THUMBNAIL_MAP = {
  'Supino Reto': `${R2}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  'Supino Inclinado': `${R2}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
  'Supino Declinado': `${R2}/Decline_Barbell_Bench_Press/0.jpg`,
  'Supino com Halteres': `${R2}/Dumbbell_Bench_Press/0.jpg`,
  'Crucifixo': `${R2}/Dumbbell_Flyes/0.jpg`,
  'Crossover': `${R2}/Cable_Crossover/0.jpg`,
  'Flexão de Braço': `${R2}/Pushups/0.jpg`,
  'Pec Deck': `${R2}/Butterfly/0.jpg`,
  'Pullover': `${R2}/Bent-Arm_Dumbbell_Pullover/0.jpg`,
  'Puxada Frontal': `${R2}/Wide-Grip_Lat_Pulldown/0.jpg`,
  'Puxada Fechada': `${R2}/Close-Grip_Front_Lat_Pulldown/0.jpg`,
  'Remada Curvada': `${R2}/Bent_Over_Barbell_Row/0.jpg`,
  'Remada Unilateral': `${R2}/One-Arm_Dumbbell_Row/0.jpg`,
  'Remada Baixa': `${R2}/Seated_Cable_Rows/0.jpg`,
  'Barra Fixa': `${R2}/Pullups/0.jpg`,
  'Levantamento Terra': `${R2}/Barbell_Deadlift/0.jpg`,
  'Remada com Barra T': `${R2}/Bent_Over_Two-Arm_Long_Bar_Row/0.jpg`,
  'Remada na Máquina': `${R2}/Seated_Cable_Rows/0.jpg`,
  'Desenvolvimento com Barra': `${R2}/Barbell_Shoulder_Press/0.jpg`,
  'Desenvolvimento com Halteres': `${R2}/Standing_Dumbbell_Press/0.jpg`,
  'Elevação Lateral': `${R2}/Side_Lateral_Raise/0.jpg`,
  'Elevação Frontal': `${R2}/Front_Dumbbell_Raise/0.jpg`,
  'Encolhimento de Ombros': `${R2}/Barbell_Shrug/0.jpg`,
  'Crucifixo Invertido': `${R2}/Reverse_Flyes/0.jpg`,
  'Desenvolvimento Arnold': `${R2}/Arnold_Dumbbell_Press/0.jpg`,
  'Elevação Lateral no Cabo': `${R2}/Bent_Over_Low-Pulley_Side_Lateral/0.jpg`,
  'Rosca Direta': `${R2}/Barbell_Curl/0.jpg`,
  'Rosca Alternada': `${R2}/Dumbbell_Alternate_Bicep_Curl/0.jpg`,
  'Rosca Martelo': `${R2}/Alternate_Hammer_Curl/0.jpg`,
  'Rosca Concentrada': `${R2}/Concentration_Curls/0.jpg`,
  'Rosca no Cabo': `${R2}/Overhead_Cable_Curl/0.jpg`,
  'Rosca Scott': `${R2}/Preacher_Curl/0.jpg`,
  'Rosca 21': `${R2}/Barbell_Curl/0.jpg`,
  'Tríceps Pulley': `${R2}/Triceps_Pushdown/0.jpg`,
  'Tríceps Corda': `${R2}/Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
  'Tríceps Testa': `${R2}/EZ-Bar_Skullcrusher/0.jpg`,
  'Mergulho (Dips)': `${R2}/Dips_-_Triceps_Version/0.jpg`,
  'Tríceps Francês': `${R2}/Standing_Dumbbell_Triceps_Extension/0.jpg`,
  'Kickback': `${R2}/Tricep_Dumbbell_Kickback/0.jpg`,
  'Tríceps na Máquina': `${R2}/Triceps_Pushdown/0.jpg`,
  'Agachamento Livre': `${R2}/Barbell_Squat/0.jpg`,
  'Agachamento Sumô': `${R2}/Sumo_Deadlift/0.jpg`,
  'Leg Press 45°': `${R2}/Leg_Press/0.jpg`,
  'Cadeira Extensora': `${R2}/Leg_Extensions/0.jpg`,
  'Avanço (Lunge)': `${R2}/Dumbbell_Lunges/0.jpg`,
  'Hack Squat': `${R2}/Barbell_Hack_Squat/0.jpg`,
  'Agachamento Goblet': `${R2}/Goblet_Squat/0.jpg`,
  'Mesa Flexora': `${R2}/Lying_Leg_Curls/0.jpg`,
  'Cadeira Flexora': `${R2}/Seated_Leg_Curl/0.jpg`,
  'Stiff': `${R2}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
  'Elevação Pélvica': `${R2}/Barbell_Hip_Thrust/0.jpg`,
  'Glúteo no Cabo': `${R2}/Glute_Kickback/0.jpg`,
  'Abdutora': `${R2}/Thigh_Abductor/0.jpg`,
  'Agachamento Búlgaro': `${R2}/Dumbbell_Lunges/0.jpg`,
  'Levantamento Terra Romeno': `${R2}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
  'Abdominal Crunch': `${R2}/Crunches/0.jpg`,
  'Prancha': `${R2}/Plank/0.jpg`,
  'Elevação de Pernas': `${R2}/Flat_Bench_Lying_Leg_Raise/0.jpg`,
  'Abdominal na Polia': `${R2}/Cable_Crunch/0.jpg`,
  'Abdominal Oblíquo': `${R2}/Cross-Body_Crunch/0.jpg`,
  'Mountain Climber': `${R2}/Mountain_Climbers/0.jpg`,
  'Russian Twist': `${R2}/Russian_Twist/0.jpg`,
  'Dead Bug': `${R2}/Dead_Bug/0.jpg`,
  'Panturrilha em Pé': `${R2}/Standing_Calf_Raises/0.jpg`,
  'Panturrilha Sentado': `${R2}/Seated_Calf_Raise/0.jpg`,
  'Panturrilha Livre': `${R2}/Standing_Calf_Raises/0.jpg`,
  'Panturrilha no Leg Press': `${R2}/Calf_Press_On_The_Leg_Press_Machine/0.jpg`,
};

async function seedThumbnails() {
  try {
    const Exercicio = mongoose.model('Exercicio');
    const ops = Object.entries(THUMBNAIL_MAP).map(([nome, url]) => ({
      updateMany: {
        filter: { nome: { $regex: new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), }, thumbnailUrl: { $in: [null, ''] } },
        update: { $set: { thumbnailUrl: url } },
      },
    }));
    const result = await Exercicio.bulkWrite(ops, { ordered: false });
    if (result.modifiedCount > 0) {
      console.log(`[db] thumbnails: ${result.modifiedCount} exercício(s) atualizados`);
    }
  } catch (err) {
    console.error('[db] seedThumbnails error:', err.message);
  }
}

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { dbName: 'athlio' });
    console.log('[db] connected', NODE_ENV);
    seedThumbnails(); // fire-and-forget: atualiza thumbnails sem bloquear startup
  } catch (err) {
    console.error('[db] connection error', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
