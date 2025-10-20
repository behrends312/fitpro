const { Router } = require('express');
const { health } = require('../controllers/health.controller');
const authRoutes = require('./auth.routes');

const router = Router();

// Ex.: health check /api/health
router.get('/health', health);
router.use('/auth', authRoutes);

// Aqui depois vamos plugando outras rotas: /users, /auth, /workouts etc.
module.exports = router;
