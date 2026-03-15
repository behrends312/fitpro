const { Schema, model } = require('mongoose');

// Cada série executada
const SerieSchema = new Schema(
  {
    numero: { type: Number, required: true },
    repsExecutadas: { type: Number, default: 0 },
    cargaUsada: { type: Number, default: 0 },
    completada: { type: Boolean, default: false },
    tempoDescansoSegundos: { type: Number, default: 0 },
  },
  { _id: false }
);

// Cada exercício executado na sessão
const ExercicioSessaoSchema = new Schema(
  {
    exercicio: { type: Schema.Types.ObjectId, ref: 'Exercicio', required: true },
    series: [SerieSchema],
    observacoes: { type: String, default: '' },
  },
  { _id: true }
);

const TreinoSessaoSchema = new Schema(
  {
    treino: { type: Schema.Types.ObjectId, ref: 'Treino', required: true },
    aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    dataInicio: { type: Date, default: Date.now },
    dataFim: { type: Date, default: null },
    duracaoSegundos: { type: Number, default: 0 },

    exerciciosExecutados: [ExercicioSessaoSchema],

    notasAluno: { type: String, default: '' },
    status: {
      type: String,
      enum: ['em_andamento', 'concluida', 'cancelada'],
      default: 'em_andamento',
    },
  },
  { timestamps: true }
);

module.exports = model('TreinoSessao', TreinoSessaoSchema);
