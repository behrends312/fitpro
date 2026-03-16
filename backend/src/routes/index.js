const { Router } = require('express');
const { health } = require('../controllers/health.controller');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const exercicioRoutes = require('./exercicio.routes');
const treinoRoutes = require('./treino.routes');
const sessaoRoutes = require('./sessao.routes');
const progressoRoutes = require('./progresso.routes');
const adminRoutes = require('./admin.routes');
const stripeRoutes = require('./stripe.routes');
const iaRoutes = require('./ia.routes');

const router = Router();

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exercicios', exercicioRoutes);
router.use('/treinos', treinoRoutes);
router.use('/sessoes', sessaoRoutes);
router.use('/progresso', progressoRoutes);
router.use('/admin', adminRoutes);
router.use('/stripe', stripeRoutes);
router.use('/ia', iaRoutes);

module.exports = router;
