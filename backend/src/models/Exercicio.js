const { Schema, model } = require('mongoose');

const ExercicioSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: '' },
    instrucoes: { type: String, default: '' },

    // Grupos musculares
    musculosPrincipais: [{ type: String }],
    musculosSecundarios: [{ type: String }],

    // Equipamento
    equipamento: {
      type: String,
      enum: ['barra', 'halteres', 'maquina', 'cabo', 'peso_corporal', 'elastico', 'kettlebell', 'outro'],
      default: 'outro',
    },
    dificuldade: {
      type: String,
      enum: ['iniciante', 'intermediario', 'avancado'],
      default: 'intermediario',
    },

    // Mídia (arquivo local)
    videoPath: { type: String, default: null },   // path relativo: uploads/videos/xyz.mp4
    videoUrl: { type: String, default: null },     // URL pública: /uploads/videos/xyz.mp4
    thumbnailPath: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },

    // Criado por qual personal (null = exercício da plataforma)
    criadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publica: { type: Boolean, default: false }, // visível para todos os personais?

    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Exercicio', ExercicioSchema);
