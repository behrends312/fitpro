const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const { CORS_ORIGIN } = require('./config/env');

const app = express();

// Webhook do Stripe precisa do body RAW — deve vir ANTES do express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Middlewares globais
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: CORS_ORIGIN || '*',
  credentials: true,
}));

// Serve arquivos de upload (vídeos, imagens) como estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api', routes);

// Health check na raiz
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'fitpro-backend', version: '2.0.0' });
});

// Páginas de retorno do Stripe (simples, só para não dar 404)
app.get('/stripe/sucesso', (_req, res) => {
  res.send('<h2>✅ Pagamento confirmado! Pode fechar esta janela e voltar ao app.</h2>');
});
app.get('/stripe/cancelado', (_req, res) => {
  res.send('<h2>❌ Pagamento cancelado. Pode fechar esta janela e tentar novamente.</h2>');
});

// 404 e erros
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
