const { Schema, model } = require('mongoose');

const PlanoSchema = new Schema({
  tipo: { type: String, enum: ['trial', 'basic', 'intermediate', 'advanced'], default: 'trial' },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  status: { type: String, enum: ['ativo', 'inativo', 'cancelado', 'trial'], default: 'trial' },
  dataInicio: { type: Date, default: Date.now },
  dataExpiracao: { type: Date, default: null },
}, { _id: false });

const LimitesPlano = {
  trial: 1,
  basic: 10,
  intermediate: 50,
  advanced: Infinity,
};

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['aluno', 'personal', 'admin'], default: 'aluno' },

    // Dados pessoais
    nome: { type: String, trim: true, default: '' },
    telefone: { type: String, trim: true, default: '' },
    foto: { type: String, default: null }, // path local

    // Para personal: plano de assinatura e dados profissionais
    plano: { type: PlanoSchema, default: () => ({}) },
    especialidade: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },

    // Para aluno: referência ao personal
    personalId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Para aluno: objetivo, dados físicos
    objetivo: { type: String, default: '' },
    peso: { type: Number, default: null },
    altura: { type: Number, default: null },
    dataNascimento: { type: Date, default: null },

    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.virtual('limiteAlunos').get(function () {
  if (this.role !== 'personal') return 0;
  return LimitesPlano[this.plano?.tipo] ?? 1;
});

UserSchema.set('toJSON', { virtuals: true });

module.exports = model('User', UserSchema);
module.exports.LimitesPlano = LimitesPlano;
