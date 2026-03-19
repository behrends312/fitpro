const R2 = 'https://pub-ddbbb132e2704727b752f37facf77e3f.r2.dev/exercises';
const E = (id: string) => `${R2}/${id}/0.jpg`;

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
      { nome: 'Supino Reto', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Barbell_Bench_Press_-_Medium_Grip') },
      { nome: 'Supino Inclinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Barbell_Incline_Bench_Press_-_Medium_Grip') },
      { nome: 'Supino Declinado', musculosPrincipais: ['Peito'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Decline_Barbell_Bench_Press') },
      { nome: 'Supino com Halteres', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Dumbbell_Bench_Press') },
      { nome: 'Crucifixo', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Dumbbell_Flyes') },
      { nome: 'Crossover', musculosPrincipais: ['Peito'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Cable_Crossover') },
      { nome: 'Flexão de Braço', musculosPrincipais: ['Peito'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Pushups') },
      { nome: 'Pec Deck', musculosPrincipais: ['Peito'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Butterfly') },
      { nome: 'Pullover', musculosPrincipais: ['Peito'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Bent-Arm_Dumbbell_Pullover') },
    ],
  },
  {
    nome: 'Costas',
    exercicios: [
      { nome: 'Puxada Frontal', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Wide-Grip_Lat_Pulldown') },
      { nome: 'Puxada Fechada', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Close-Grip_Front_Lat_Pulldown') },
      { nome: 'Remada Curvada', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Bent_Over_Barbell_Row') },
      { nome: 'Remada Unilateral', musculosPrincipais: ['Costas'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('One-Arm_Dumbbell_Row') },
      { nome: 'Remada Baixa', musculosPrincipais: ['Costas'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Seated_Cable_Rows') },
      { nome: 'Barra Fixa', musculosPrincipais: ['Costas'], equipamento: 'peso_corporal', dificuldade: 'avancado', gifUrl: E('Pullups') },
      { nome: 'Levantamento Terra', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'avancado', gifUrl: E('Barbell_Deadlift') },
      { nome: 'Remada com Barra T', musculosPrincipais: ['Costas'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Bent_Over_Two-Arm_Long_Bar_Row') },
      { nome: 'Remada na Máquina', musculosPrincipais: ['Costas'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Seated_Cable_Rows') },
    ],
  },
  {
    nome: 'Ombros',
    exercicios: [
      { nome: 'Desenvolvimento com Barra', musculosPrincipais: ['Ombros'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Barbell_Shoulder_Press') },
      { nome: 'Desenvolvimento com Halteres', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Standing_Dumbbell_Press') },
      { nome: 'Elevação Lateral', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Side_Lateral_Raise') },
      { nome: 'Elevação Frontal', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Front_Dumbbell_Raise') },
      { nome: 'Encolhimento de Ombros', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Barbell_Shrug') },
      { nome: 'Crucifixo Invertido', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Reverse_Flyes') },
      { nome: 'Desenvolvimento Arnold', musculosPrincipais: ['Ombros'], equipamento: 'halteres', dificuldade: 'intermediario', gifUrl: E('Arnold_Dumbbell_Press') },
      { nome: 'Elevação Lateral no Cabo', musculosPrincipais: ['Ombros'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Bent_Over_Low-Pulley_Side_Lateral') },
    ],
  },
  {
    nome: 'Bíceps',
    exercicios: [
      { nome: 'Rosca Direta', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('Barbell_Curl') },
      { nome: 'Rosca Alternada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Dumbbell_Alternate_Bicep_Curl') },
      { nome: 'Rosca Martelo', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Alternate_Hammer_Curl') },
      { nome: 'Rosca Concentrada', musculosPrincipais: ['Bíceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Concentration_Curls') },
      { nome: 'Rosca no Cabo', musculosPrincipais: ['Bíceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Overhead_Cable_Curl') },
      { nome: 'Rosca Scott', musculosPrincipais: ['Bíceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Preacher_Curl') },
      { nome: 'Rosca 21', musculosPrincipais: ['Bíceps'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Barbell_Curl') },
    ],
  },
  {
    nome: 'Tríceps',
    exercicios: [
      { nome: 'Tríceps Pulley', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Triceps_Pushdown') },
      { nome: 'Tríceps Corda', musculosPrincipais: ['Tríceps'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Triceps_Pushdown_-_Rope_Attachment') },
      { nome: 'Tríceps Testa', musculosPrincipais: ['Tríceps'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('EZ-Bar_Skullcrusher') },
      { nome: 'Mergulho (Dips)', musculosPrincipais: ['Tríceps'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('Dips_-_Triceps_Version') },
      { nome: 'Tríceps Francês', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Standing_Dumbbell_Triceps_Extension') },
      { nome: 'Kickback', musculosPrincipais: ['Tríceps'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Tricep_Dumbbell_Kickback') },
      { nome: 'Tríceps na Máquina', musculosPrincipais: ['Tríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Triceps_Pushdown') },
    ],
  },
  {
    nome: 'Quadríceps',
    exercicios: [
      { nome: 'Agachamento Livre', musculosPrincipais: ['Quadríceps'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Barbell_Squat') },
      { nome: 'Agachamento Sumô', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Sumo_Deadlift') },
      { nome: 'Leg Press 45°', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Leg_Press') },
      { nome: 'Cadeira Extensora', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Leg_Extensions') },
      { nome: 'Avanço (Lunge)', musculosPrincipais: ['Quadríceps', 'Glúteos'], equipamento: 'halteres', dificuldade: 'iniciante', gifUrl: E('Dumbbell_Lunges') },
      { nome: 'Hack Squat', musculosPrincipais: ['Quadríceps'], equipamento: 'maquina', dificuldade: 'intermediario', gifUrl: E('Barbell_Hack_Squat') },
      { nome: 'Agachamento Goblet', musculosPrincipais: ['Quadríceps'], equipamento: 'kettlebell', dificuldade: 'iniciante', gifUrl: E('Goblet_Squat') },
    ],
  },
  {
    nome: 'Posterior / Glúteos',
    exercicios: [
      { nome: 'Mesa Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Lying_Leg_Curls') },
      { nome: 'Cadeira Flexora', musculosPrincipais: ['Posterior'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Seated_Leg_Curl') },
      { nome: 'Stiff', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Stiff-Legged_Barbell_Deadlift') },
      { nome: 'Elevação Pélvica', musculosPrincipais: ['Glúteos'], equipamento: 'barra', dificuldade: 'iniciante', gifUrl: E('Barbell_Hip_Thrust') },
      { nome: 'Glúteo no Cabo', musculosPrincipais: ['Glúteos'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Glute_Kickback') },
      { nome: 'Abdutora', musculosPrincipais: ['Glúteos'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Thigh_Abductor') },
      { nome: 'Agachamento Búlgaro', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'halteres', dificuldade: 'intermediario', gifUrl: E('Dumbbell_Lunges') },
      { nome: 'Levantamento Terra Romeno', musculosPrincipais: ['Posterior', 'Glúteos'], equipamento: 'barra', dificuldade: 'intermediario', gifUrl: E('Stiff-Legged_Barbell_Deadlift') },
    ],
  },
  {
    nome: 'Abdômen',
    exercicios: [
      { nome: 'Abdominal Crunch', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Crunches') },
      { nome: 'Prancha', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Plank') },
      { nome: 'Elevação de Pernas', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('Flat_Bench_Lying_Leg_Raise') },
      { nome: 'Abdominal na Polia', musculosPrincipais: ['Abdômen'], equipamento: 'cabo', dificuldade: 'iniciante', gifUrl: E('Cable_Crunch') },
      { nome: 'Abdominal Oblíquo', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Cross-Body_Crunch') },
      { nome: 'Mountain Climber', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'intermediario', gifUrl: E('Mountain_Climbers') },
      { nome: 'Russian Twist', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Russian_Twist') },
      { nome: 'Dead Bug', musculosPrincipais: ['Abdômen'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Dead_Bug') },
    ],
  },
  {
    nome: 'Panturrilha',
    exercicios: [
      { nome: 'Panturrilha em Pé', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Standing_Calf_Raises') },
      { nome: 'Panturrilha Sentado', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Seated_Calf_Raise') },
      { nome: 'Panturrilha Livre', musculosPrincipais: ['Panturrilha'], equipamento: 'peso_corporal', dificuldade: 'iniciante', gifUrl: E('Standing_Calf_Raises') },
      { nome: 'Panturrilha no Leg Press', musculosPrincipais: ['Panturrilha'], equipamento: 'maquina', dificuldade: 'iniciante', gifUrl: E('Calf_Press_On_The_Leg_Press_Machine') },
    ],
  },
];
