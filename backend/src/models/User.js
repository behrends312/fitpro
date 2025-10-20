const { Schema, model } = require('mongoose');

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['aluno','personal','admin'], default: 'aluno' }
  },
  { timestamps: true }
);

module.exports = model('User', UserSchema);
