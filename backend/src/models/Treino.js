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
  },
  { _id: true }
);

const TreinoSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: '' },
    tipo: { type: String, default: 'A' }, // A, B, C ou nome livre

    // Relacionamentos
    aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    personal: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Exercícios do treino
    exercicios: [ExercicioTreinoSchema],

    // Quando executar
    diasSemana: [{ type: String, enum: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] }],

    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Treino', TreinoSchema);
