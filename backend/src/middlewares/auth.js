const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Verifica o token JWT no header Authorization.
 * Injeta req.user = { id, role } para uso nos controllers.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

module.exports = { authenticate };
