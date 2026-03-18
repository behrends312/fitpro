const { Schema, model } = require('mongoose');

const PlanoTreinoSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: '' },
    nivel: {
      type: String,
      enum: ['iniciante', 'intermediario', 'avancado'],
      default: 'iniciante',
    },
    personal: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Treinos que compõem o plano (A, B, C...)
    // Referências a treinos-template: treinos sem aluno atribuído (templates)
    treinos: [
      {
        ordem: { type: Number, default: 0 },
        treino: { type: Schema.Types.ObjectId, ref: 'Treino', required: true },
      },
    ],

    duracaoMeses: { type: Number, default: null }, // null = sem expiração
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('PlanoTreino', PlanoTreinoSchema);
