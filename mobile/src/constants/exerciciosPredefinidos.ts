const E = (id: string) => `https://v2.exercisedb.io/image/${id}.gif`;

export interface ExercicioPredefinido {
  nome: string;
  musculosPrincipais: string[];
  equipamento: string;
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  gifUrl?: string;
}

export interface GrupoMuscular {
  nome: string;
  exercicios: ExercicioPredefinido[];
}

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  {
    nome: 'Peito',
    exercicios: [
      { nome: 'Supino Reto', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0025') },
      { nome: 'Supino Inclinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0047') },
      { nome: 'Supino Declinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0033') },
      { nome: 'Supino com Halteres', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0289') },
      { nome: 'Crucifixo', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0308') },
      { nome: 'Crossover', musculosPrincipais: ['Peito'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Flexão de Braço', musculosPrincipais: ['Peito'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0492') },
      { nome: 'Pec Deck', musculosPrincipais: ['Peito'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('1494') },
      { nome: 'Pullover', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0375') },
    ],
  },
  {
    nome: 'Costas',
    exercicios: [
      { nome: 'Puxada Frontal', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0673') },
      { nome: 'Puxada Fechada', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('3117') },
      { nome: 'Remada Curvada', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0027') },
      { nome: 'Remada Unilateral', musculosPrincipais: ['Costas'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0293') },
      { nome: 'Remada Baixa', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0180') },
      { nome: 'Barra Fixa', musculosPrincipais: ['Costas'], equipamento: 'peso_corporal', dificuldade: 'avancado', gifUrl: E('0651') },
      { nome: 'Levantamento Terra', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'avancado', gifUrl: E('0032') },
      { nome: 'Remada com Barra T', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0606') },
      { nome: 'Remada na Máquina', musculosPrincipais: ['Costas'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('1350') },
    ],
  },
  {
    nome: 'Ombros',
    exercicios: [
      { nome: 'Desenvolvimento com Barra', musculosPrincipais: ['Ombros'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0091') },
      { nome: 'Desenvolvimento com Halteres', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Elevação Lateral', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0178') },
      { nome: 'Elevação Frontal', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0040') },
      { nome: 'Encolhimento de Ombros', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0406') },
      { nome: 'Crucifixo Invertido', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0154') },
      { nome: 'Desenvolvimento Arnold', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'intermediario', gifUrl: E('0287') },
      { nome: 'Elevação Lateral no Cabo', musculosPrincipais: ['Ombros'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0178') },
    ],
  },
  {
    nome: 'Bíceps',
    exercicios: [
      { nome: 'Rosca Direta', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('0031') },
      { nome: 'Rosca Alternada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('1651') },
      { nome: 'Rosca Martelo', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0165') },
      { nome: 'Rosca Concentrada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0089') },
      { nome: 'Rosca no Cabo', musculosPrincipais: ['Bíceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0868') },
      { nome: 'Rosca Scott', musculosPrincipais: ['Bíceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0059') },
      { nome: 'Rosca 21', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0031') },
    ],
  },
  {
    nome: 'Tríceps',
    exercicios: [
      { nome: 'Tríceps Pulley', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0241') },
      { nome: 'Tríceps Corda', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('1322') },
      { nome: 'Tríceps Testa', musculosPrincipais: ['Tríceps'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('0060') },
      { nome: 'Mergulho (Dips)', musculosPrincipais: ['Tríceps'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('1755') },
      { nome: 'Tríceps Francês', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('1747') },
      { nome: 'Kickback', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('1728') },
      { nome: 'Tríceps na Máquina', musculosPrincipais: ['Tríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0241') },
    ],
  },
  {
    nome: 'Quadríceps',
    exercicios: [
      { nome: 'Agachamento Livre', musculosPrincipais: ['Quadríceps'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0102') },
      { nome: 'Agachamento Sumô', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('3142') },
      { nome: 'Leg Press 45°', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0739') },
      { nome: 'Cadeira Extensora', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0585') },
      { nome: 'Avanço (Lunge)', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('0336') },
      { nome: 'Hack Squat', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'intermediario', gifUrl: E('0046') },
      { nome: 'Agachamento Goblet', musculosPrincipais: ['Quadríceps'], equipamento: 'kettlebell', dificuldade: 'iniciante', gifUrl: E('0534') },
    ],
  },
  {
    nome: 'Posterior / Glúteos',
    exercicios: [
      { nome: 'Mesa Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0496') },
      { nome: 'Cadeira Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0599') },
      { nome: 'Stiff', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0085') },
      { nome: 'Elevação Pélvica', musculosPrincipais: ['Glúteos'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('3236') },
      { nome: 'Glúteo no Cabo', musculosPrincipais: ['Glúteos'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0860') },
      { nome: 'Abdutora', musculosPrincipais: ['Glúteos'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('1427') },
      { nome: 'Agachamento Búlgaro', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'halteres', dificuldade: 'intermediario', gifUrl: E('0097') },
      { nome: 'Levantamento Terra Romeno', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('0085') },
    ],
  },
  {
    nome: 'Abdômen',
    exercicios: [
      { nome: 'Abdominal Crunch', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0175') },
      { nome: 'Prancha', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0464') },
      { nome: 'Elevação de Pernas', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('0472') },
      { nome: 'Abdominal na Polia', musculosPrincipais: ['Abdômen'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('0832') },
      { nome: 'Abdominal Oblíquo', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0635') },
      { nome: 'Mountain Climber', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('0630') },
      { nome: 'Russian Twist', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0014') },
      { nome: 'Dead Bug', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0276') },
    ],
  },
  {
    nome: 'Panturrilha',
    exercicios: [
      { nome: 'Panturrilha em Pé', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0417') },
      { nome: 'Panturrilha Sentado', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0088') },
      { nome: 'Panturrilha Livre', musculosPrincipais: ['Panturrilha'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('0088') },
      { nome: 'Panturrilha no Leg Press', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('0738') },
    ],
  },
];
