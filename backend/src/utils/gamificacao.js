/**
 * Utilitário de gamificação
 * - XP por treino concluído
 * - Níveis com thresholds progressivos
 * - Streak de dias consecutivos
 * - Badges por marcos atingidos
 */

// XP necessário para cada nível (índice = nível - 1)
const XP_POR_NIVEL = [0, 150, 350, 700, 1200, 2000, 3000, 4500, 6500, 9000];

function calcularNivel(xpTotal) {
  let nivel = 1;
  for (let i = XP_POR_NIVEL.length - 1; i >= 0; i--) {
    if (xpTotal >= XP_POR_NIVEL[i]) {
      nivel = i + 1;
      break;
    }
  }
  return Math.min(nivel, 10);
}

function xpParaProximoNivel(nivel) {
  if (nivel >= 10) return null;
  return XP_POR_NIVEL[nivel]; // índice nivel = threshold do próximo nível
}

function calcularXP(sessao) {
  let xp = 50; // base

  // Bônus de duração: +1 XP por minuto, máx 30
  if (sessao.duracaoSegundos) {
    const minutos = Math.floor(sessao.duracaoSegundos / 60);
    xp += Math.min(30, minutos);
  }

  // Bônus se todas as séries foram completadas
  const todasCompletas = sessao.exerciciosExecutados?.every((ex) =>
    ex.series?.every((s) => s.completada)
  );
  if (todasCompletas) xp += 20;

  return xp;
}

const BADGES_CONFIG = [
  {
    id: 'primeiro_treino',
    nome: 'Primeiro Passo',
    descricao: 'Completou seu primeiro treino!',
    icone: '🎯',
    check: ({ totalTreinos }) => totalTreinos === 1,
  },
  {
    id: 'treinos_10',
    nome: 'Dedicado',
    descricao: '10 treinos concluídos',
    icone: '💪',
    check: ({ totalTreinos }) => totalTreinos === 10,
  },
  {
    id: 'treinos_50',
    nome: 'Veterano',
    descricao: '50 treinos concluídos',
    icone: '🏋️',
    check: ({ totalTreinos }) => totalTreinos === 50,
  },
  {
    id: 'treinos_100',
    nome: 'Centurião',
    descricao: '100 treinos concluídos',
    icone: '🏆',
    check: ({ totalTreinos }) => totalTreinos === 100,
  },
  {
    id: 'streak_7',
    nome: 'Semana Perfeita',
    descricao: '7 dias seguidos treinando',
    icone: '🔥',
    check: ({ streak }) => streak === 7,
  },
  {
    id: 'streak_30',
    nome: 'Mês de Ferro',
    descricao: '30 dias seguidos treinando',
    icone: '⚡',
    check: ({ streak }) => streak === 30,
  },
  {
    id: 'nivel_5',
    nome: 'Elite',
    descricao: 'Atingiu o nível 5',
    icone: '⭐',
    check: ({ nivel }) => nivel === 5,
  },
];

function verificarBadges(user, badgesJaConquistados) {
  const idsJaConquistados = new Set(badgesJaConquistados.map((b) => b.id));
  const novos = [];

  for (const badge of BADGES_CONFIG) {
    if (idsJaConquistados.has(badge.id)) continue;
    if (badge.check(user)) {
      novos.push({
        id: badge.id,
        nome: badge.nome,
        descricao: badge.descricao,
        icone: badge.icone,
        conquistadoEm: new Date(),
      });
    }
  }

  return novos;
}

function calcularStreak(ultimoTreino) {
  if (!ultimoTreino) return 1; // primeiro treino

  const agora = new Date();
  const ultimo = new Date(ultimoTreino);

  // Diferença em dias (ignorando horário)
  const diffMs = agora.setHours(0, 0, 0, 0) - ultimo.setHours(0, 0, 0, 0);
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return null; // já treinou hoje, não incrementa
  if (diffDias === 1) return 'incrementar'; // dia seguinte
  return 'resetar'; // quebrou a sequência
}

/**
 * Processa gamificação após sessão concluída.
 * Retorna o objeto com campos atualizados e badges novos.
 */
function processarGamificacao(user, sessao) {
  const xpGanho = calcularXP(sessao);
  const novoXP = (user.xp || 0) + xpGanho;
  const novoTotalTreinos = (user.totalTreinos || 0) + 1;

  // Streak
  let novoStreak = user.streak || 0;
  const streakAcao = calcularStreak(user.ultimoTreino);
  if (streakAcao === null) {
    // Já treinou hoje — não muda nada no streak
  } else if (streakAcao === 'incrementar') {
    novoStreak += 1;
  } else {
    novoStreak = 1; // reset
  }

  const novoMelhorStreak = Math.max(user.melhorStreak || 0, novoStreak);
  const novoNivel = calcularNivel(novoXP);

  // Verifica badges com os novos valores
  const novosValores = {
    totalTreinos: novoTotalTreinos,
    streak: novoStreak,
    nivel: novoNivel,
  };
  const badgesNovos = verificarBadges(novosValores, user.badges || []);

  return {
    xp: novoXP,
    nivel: novoNivel,
    streak: novoStreak,
    melhorStreak: novoMelhorStreak,
    ultimoTreino: new Date(),
    totalTreinos: novoTotalTreinos,
    badgesNovos,
    // Para resposta ao cliente
    resultado: {
      xpGanho,
      xpTotal: novoXP,
      nivel: novoNivel,
      xpProximoNivel: xpParaProximoNivel(novoNivel),
      streak: novoStreak,
      badgesNovos,
    },
  };
}

module.exports = { processarGamificacao, calcularNivel, xpParaProximoNivel, XP_POR_NIVEL };
