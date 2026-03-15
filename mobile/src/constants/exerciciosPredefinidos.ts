export interface ExercicioPredefinido {
  nome: string;
  musculosPrincipais: string[];
  equipamento: string;
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
}

export interface GrupoMuscular {
  nome: string;
  exercicios: ExercicioPredefinido[];
}

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  {
    nome: 'Peito',
    exercicios: [
      { nome: 'Supino Reto', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Supino Inclinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Supino Declinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Supino com Halteres', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Crucifixo', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Crossover', musculosPrincipais: ['Peito'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Flexão de Braço', musculosPrincipais: ['Peito'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Pec Deck', musculosPrincipais: ['Peito'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Pullover', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante' },
    ],
  },
  {
    nome: 'Costas',
    exercicios: [
      { nome: 'Puxada Frontal', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Puxada Fechada', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Remada Curvada', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Remada Unilateral', musculosPrincipais: ['Costas'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Remada Baixa', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Barra Fixa', musculosPrincipais: ['Costas'], equipamento: 'peso_corporal', dificuldade: 'avancado' },
      { nome: 'Levantamento Terra', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'avancado' },
      { nome: 'Remada com Barra T', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Remada na Máquina', musculosPrincipais: ['Costas'], equipamento: 'maquina', dificuldade: 'iniciante' },
    ],
  },
  {
    nome: 'Ombros',
    exercicios: [
      { nome: 'Desenvolvimento com Barra', musculosPrincipais: ['Ombros'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Desenvolvimento com Halteres', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Elevação Lateral', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Elevação Frontal', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Encolhimento de Ombros', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Crucifixo Invertido', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Desenvolvimento Arnold', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'intermediario' },
      { nome: 'Elevação Lateral no Cabo', musculosPrincipais: ['Ombros'], equipamento: 'cabo', dificuldade: 'iniciante' },
    ],
  },
  {
    nome: 'Bíceps',
    exercicios: [
      { nome: 'Rosca Direta', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'iniciante' },
      { nome: 'Rosca Alternada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Rosca Martelo', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Rosca Concentrada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Rosca no Cabo', musculosPrincipais: ['Bíceps'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Rosca Scott', musculosPrincipais: ['Bíceps'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Rosca 21', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'intermediario' },
    ],
  },
  {
    nome: 'Tríceps',
    exercicios: [
      { nome: 'Tríceps Pulley', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Tríceps Corda', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Tríceps Testa', musculosPrincipais: ['Tríceps'], equipamento: 'barra', dificuldade: 'iniciante' },
      { nome: 'Mergulho (Dips)', musculosPrincipais: ['Tríceps'], equipamento: 'peso_corporal', dificuldade: 'intermediario' },
      { nome: 'Tríceps Francês', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Kickback', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Tríceps na Máquina', musculosPrincipais: ['Tríceps'], equipamento: 'maquina', dificuldade: 'iniciante' },
    ],
  },
  {
    nome: 'Quadríceps',
    exercicios: [
      { nome: 'Agachamento Livre', musculosPrincipais: ['Quadríceps'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Agachamento Sumô', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Leg Press 45°', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Cadeira Extensora', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Avanço (Lunge)', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante' },
      { nome: 'Hack Squat', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'intermediario' },
      { nome: 'Agachamento Goblet', musculosPrincipais: ['Quadríceps'], equipamento: 'kettlebell', dificuldade: 'iniciante' },
    ],
  },
  {
    nome: 'Posterior / Glúteos',
    exercicios: [
      { nome: 'Mesa Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Cadeira Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Stiff', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario' },
      { nome: 'Elevação Pélvica', musculosPrincipais: ['Glúteos'], equipamento: 'barra', dificuldade: 'iniciante' },
      { nome: 'Glúteo no Cabo', musculosPrincipais: ['Glúteos'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Abdutora', musculosPrincipais: ['Glúteos'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Agachamento Búlgaro', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'halteres', dificuldade: 'intermediario' },
      { nome: 'Levantamento Terra Romeno', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario' },
    ],
  },
  {
    nome: 'Abdômen',
    exercicios: [
      { nome: 'Abdominal Crunch', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Prancha', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Elevação de Pernas', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario' },
      { nome: 'Abdominal na Polia', musculosPrincipais: ['Abdômen'], equipamento: 'cabo', dificuldade: 'iniciante' },
      { nome: 'Abdominal Oblíquo', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Mountain Climber', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario' },
      { nome: 'Russian Twist', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Dead Bug', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediante' },
    ],
  },
  {
    nome: 'Panturrilha',
    exercicios: [
      { nome: 'Panturrilha em Pé', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Panturrilha Sentado', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante' },
      { nome: 'Panturrilha Livre', musculosPrincipais: ['Panturrilha'], equipamento: 'peso_corporal', dificuldade: 'iniciante' },
      { nome: 'Panturrilha no Leg Press', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante' },
    ],
  },
];
