const { Router } = require('express');
const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const {
  listarPlanos, criarCheckout, webhook, cancelarAssinatura, minhaAssinatura,
} = require('../controllers/stripe.controller');

const router = Router();

// Webhook precisa do body raw (não JSON parseado)
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Rotas autenticadas
router.get('/planos', listarPlanos);
router.use(authenticate);
router.get('/assinatura', authorize('personal'), minhaAssinatura);
router.post('/checkout', authorize('personal'), criarCheckout);
router.post('/cancelar', authorize('personal'), cancelarAssinatura);

module.exports = router;
