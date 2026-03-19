/**
 * Busca GIFs animados do ExerciseDB (RapidAPI v2.2) para todos os exercícios predefinidos.
 * Uso: node scripts/fetch-exercise-gifs.js SUA_RAPIDAPI_KEY
 */

const https = require('https');

const RAPIDAPI_KEY = process.argv[2];
if (!RAPIDAPI_KEY) {
  console.error('Uso: node scripts/fetch-exercise-gifs.js SUA_RAPIDAPI_KEY');
  process.exit(1);
}

const EXERCICIOS = [
  { nome: 'Supino Reto', busca: 'barbell bench press' },
  { nome: 'Supino Inclinado', busca: 'incline barbell bench press' },
  { nome: 'Supino Declinado', busca: 'decline barbell bench press' },
  { nome: 'Supino com Halteres', busca: 'dumbbell bench press' },
  { nome: 'Crucifixo', busca: 'dumbbell fly' },
  { nome: 'Crossover', busca: 'cable crossover' },
  { nome: 'Flexão de Braço', busca: 'push up' },
  { nome: 'Pec Deck', busca: 'pec deck' },
  { nome: 'Pullover', busca: 'dumbbell pullover' },
  { nome: 'Puxada Frontal', busca: 'lat pulldown' },
  { nome: 'Puxada Fechada', busca: 'close grip lat pulldown' },
  { nome: 'Remada Curvada', busca: 'bent over barbell row' },
  { nome: 'Remada Unilateral', busca: 'one arm dumbbell row' },
  { nome: 'Remada Baixa', busca: 'seated cable row' },
  { nome: 'Barra Fixa', busca: 'pull up' },
  { nome: 'Levantamento Terra', busca: 'barbell deadlift' },
  { nome: 'Remada com Barra T', busca: 't bar row' },
  { nome: 'Remada na Máquina', busca: 'machine row' },
  { nome: 'Desenvolvimento com Barra', busca: 'barbell overhead press' },
  { nome: 'Desenvolvimento com Halteres', busca: 'dumbbell shoulder press' },
  { nome: 'Elevação Lateral', busca: 'lateral raise' },
  { nome: 'Elevação Frontal', busca: 'front raise' },
  { nome: 'Encolhimento de Ombros', busca: 'dumbbell shrug' },
  { nome: 'Crucifixo Invertido', busca: 'reverse fly' },
  { nome: 'Desenvolvimento Arnold', busca: 'arnold press' },
  { nome: 'Elevação Lateral no Cabo', busca: 'cable lateral raise' },
  { nome: 'Rosca Direta', busca: 'barbell curl' },
  { nome: 'Rosca Alternada', busca: 'dumbbell alternate bicep curl' },
  { nome: 'Rosca Martelo', busca: 'hammer curl' },
  { nome: 'Rosca Concentrada', busca: 'concentration curl' },
  { nome: 'Rosca no Cabo', busca: 'cable curl' },
  { nome: 'Rosca Scott', busca: 'preacher curl' },
  { nome: 'Rosca 21', busca: 'barbell curl' },
  { nome: 'Tríceps Pulley', busca: 'triceps pushdown' },
  { nome: 'Tríceps Corda', busca: 'rope pushdown' },
  { nome: 'Tríceps Testa', busca: 'skull crusher' },
  { nome: 'Mergulho (Dips)', busca: 'tricep dip' },
  { nome: 'Tríceps Francês', busca: 'ez bar french press' },
  { nome: 'Kickback', busca: 'tricep kickback' },
  { nome: 'Tríceps na Máquina', busca: 'triceps pushdown' },
  { nome: 'Agachamento Livre', busca: 'barbell squat' },
  { nome: 'Agachamento Sumô', busca: 'sumo squat' },
  { nome: 'Leg Press 45°', busca: 'leg press' },
  { nome: 'Cadeira Extensora', busca: 'leg extension' },
  { nome: 'Avanço (Lunge)', busca: 'dumbbell lunge' },
  { nome: 'Hack Squat', busca: 'hack squat' },
  { nome: 'Agachamento Goblet', busca: 'goblet squat' },
  { nome: 'Mesa Flexora', busca: 'lying leg curl' },
  { nome: 'Cadeira Flexora', busca: 'seated leg curl' },
  { nome: 'Stiff', busca: 'romanian deadlift' },
  { nome: 'Elevação Pélvica', busca: 'barbell hip thrust' },
  { nome: 'Glúteo no Cabo', busca: 'cable glute kickback' },
  { nome: 'Abdutora', busca: 'hip abductor' },
  { nome: 'Agachamento Búlgaro', busca: 'bulgarian split squat' },
  { nome: 'Levantamento Terra Romeno', busca: 'romanian deadlift' },
  { nome: 'Abdominal Crunch', busca: 'crunch' },
  { nome: 'Prancha', busca: 'plank' },
  { nome: 'Elevação de Pernas', busca: 'hanging leg raise' },
  { nome: 'Abdominal na Polia', busca: 'cable crunch' },
  { nome: 'Abdominal Oblíquo', busca: 'oblique crunch' },
  { nome: 'Mountain Climber', busca: 'mountain climber' },
  { nome: 'Russian Twist', busca: 'russian twist' },
  { nome: 'Dead Bug', busca: 'dead bug' },
  { nome: 'Panturrilha em Pé', busca: 'standing calf raise' },
  { nome: 'Panturrilha Sentado', busca: 'seated calf raise' },
  { nome: 'Panturrilha Livre', busca: 'calf raise' },
  { nome: 'Panturrilha no Leg Press', busca: 'calf press' },
];

function request(path) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      hostname: 'exercisedb.p.rapidapi.com',
      path,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.end();
  });
}

async function buscarGif(termo) {
  // Busca exercício pelo nome para obter o ID
  const res = await request(`/exercises/name/${encodeURIComponent(termo)}?limit=1&offset=0`);
  if (res.status !== 200) return null;

  try {
    const json = JSON.parse(res.body);
    const list = Array.isArray(json) ? json : [];
    if (list.length === 0) return null;

    const ex = list[0];

    // v2.2: gifUrl pode ainda existir
    if (ex.gifUrl) return ex.gifUrl;

    // v2.2: monta URL do Image Service com o ID do exercício
    if (ex.id) return `https://v2.exercisedb.io/image/${ex.id}.gif`;
  } catch {}

  return null;
}

async function main() {
  // Testa conexão primeiro
  console.log('Testando conexão com ExerciseDB...');
  const teste = await request('/status');
  console.log(`Status: ${teste.status} — ${teste.body.slice(0, 100)}\n`);

  if (teste.status !== 200) {
    console.error('Erro de conexão. Verifique a chave e a assinatura.');
    process.exit(1);
  }

  console.log(`Buscando GIFs para ${EXERCICIOS.length} exercícios...\n`);
  const resultado = {};

  for (const ex of EXERCICIOS) {
    process.stdout.write(`  ${ex.nome}... `);
    const gifUrl = await buscarGif(ex.busca);
    resultado[ex.nome] = gifUrl;
    console.log(gifUrl ? '✓' : '✗ não encontrado');
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n\n=== RESULTADO ===\n');
  for (const [nome, url] of Object.entries(resultado)) {
    if (url) console.log(`'${nome}': '${url}',`);
    else console.log(`// '${nome}': sem GIF`);
  }

  const encontrados = Object.values(resultado).filter(Boolean).length;
  console.log(`\n${encontrados}/${EXERCICIOS.length} GIFs encontrados.`);
}

main();
