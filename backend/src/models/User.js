const { Schema, model } = require('mongoose');

const AnamneseSchema = new Schema({
  // Histórico de treino
  tempoTreinando: { type: String, default: '' }, // 'nunca','menos6','6a12','1a3anos','mais3anos'
  frequenciaSemanal: { type: Number, default: null },

  // Lesões
  temLesaoAtual: { type: Boolean, default: false },
  lesaoAtual: { type: String, default: '' },
  temLesaoPassada: { type: Boolean, default: false },
  lesaoPassada: { type: String, default: '' },

  // Saúde
  doencasCronicas: { type: String, default: '' },
  problemasCardiacos: { type: Boolean, default: false },
  usaMedicamentos: { type: Boolean, default: false },
  medicamentos: { type: String, default: '' },

  // Limitações físicas
  temLimitacaoFisica: { type: Boolean, default: false },
  limitacaoFisica: { type: String, default: '' },
  temDeficiencia: { type: Boolean, default: false },
  deficiencia: { type: String, default: '' },

  // Estilo de vida
  nivelAtividade: { type: String, default: '' }, // 'sedentario','leve','moderado','ativo','muito_ativo'
  profissaoSedentaria: { type: Boolean, default: null },
  fumante: { type: Boolean, default: false },
  consumoAlcool: { type: String, default: '' }, // 'nunca','social','frequente'

  observacoes: { type: String, default: '' },
}, { _id: false });

const PlanoSchema = new Schema({
  tipo: { type: String, enum: ['trial', 'basic', 'intermediate', 'advanced'], default: 'trial' },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  status: { type: String, enum: ['ativo', 'inativo', 'cancelado', 'trial'], default: 'trial' },
  dataInicio: { type: Date, default: Date.now },
  dataExpiracao: { type: Date, default: null },
}, { _id: false });

const BadgeSchema = new Schema({
  id: { type: String, required: true },
  nome: { type: String, required: true },
  descricao: { type: String, default: '' },
  icone: { type: String, default: '🏅' },
  conquistadoEm: { type: Date, default: Date.now },
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

    // Anamnese
    anamneseConcluida: { type: Boolean, default: false },
    anamnese: { type: AnamneseSchema, default: () => ({}) },

    // Gamificação (apenas para alunos)
    xp: { type: Number, default: 0 },
    nivel: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    melhorStreak: { type: Number, default: 0 },
    ultimoTreino: { type: Date, default: null },
    totalTreinos: { type: Number, default: 0 },
    badges: { type: [BadgeSchema], default: [] },
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
