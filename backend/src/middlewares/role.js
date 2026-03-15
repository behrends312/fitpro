/**
 * Middleware de controle de acesso por role.
 * Uso: authorize('admin'), authorize('personal', 'admin'), etc.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    next();
  };
}

module.exports = { authorize };
