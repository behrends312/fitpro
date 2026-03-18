const { Schema, model } = require('mongoose');

const ExercicioTreinoSchema = new Schema(
  {
    exercicio: { type: Schema.Types.ObjectId, ref: 'Exercicio', required: true },
    ordem: { type: Number, default: 0 },
    series: { type: Number, default: 3 },
    reps: { type: String, default: '10' }, // ex: "10", "8-12", "falha"
    carga: { type: Number, default: 0 },   // kg
    descanso: { type: Number, default: 60 }, // segundos
    observacoes: { type: String, default: '' },

    // Agrupamento: bi-set, tri-set, drop-set, super-set
    grupoTipo: {
      type: String,
      enum: ['none', 'bi-set', 'tri-set', 'super-set', 'drop-set', 'giant-set'],
      default: 'none',
    },
    grupoId: { type: String, default: null }, // UUID compartilhado entre exercícios do mesmo grupo
    grupoOrdem: { type: Number, default: 0 }, // posição dentro do grupo (0, 1, 2...)
  },
  { _id: true }
);

const TreinoSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: '' },
    tipo: { type: String, default: 'A' }, // A, B, C ou nome livre

    // Relacionamentos
    // aluno é null quando o treino é template de um plano
    aluno: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    personal: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Se pertence a um plano (template)
    plano: { type: Schema.Types.ObjectId, ref: 'PlanoTreino', default: null },
    isTemplate: { type: Boolean, default: false },

    // Exercícios do treino
    exercicios: [ExercicioTreinoSchema],

    // Quando executar
    diasSemana: [{ type: String, enum: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] }],

    // Expiração (copiado do plano ao atribuir)
    dataInicio: { type: Date, default: null },
    duracaoMeses: { type: Number, default: null },

    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Treino', TreinoSchema);
