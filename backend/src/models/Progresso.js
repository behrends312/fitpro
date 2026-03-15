const { Schema, model } = require('mongoose');

// Snapshot de progresso por exercício por sessão
const ProgressoSchema = new Schema(
  {
    aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exercicio: { type: Schema.Types.ObjectId, ref: 'Exercicio', required: true },
    sessao: { type: Schema.Types.ObjectId, ref: 'TreinoSessao', default: null },

    data: { type: Date, default: Date.now },

    // Melhores valores da sessão
    cargaMaxima: { type: Number, default: 0 },
    repsMaximas: { type: Number, default: 0 },
    totalSeries: { type: Number, default: 0 },
    volumeTotal: { type: Number, default: 0 }, // sum(carga * reps) de todas as séries

    // Contexto
    observacoes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Índice para busca rápida de histórico por aluno + exercício
ProgressoSchema.index({ aluno: 1, exercicio: 1, data: -1 });

module.exports = model('Progresso', ProgressoSchema);
