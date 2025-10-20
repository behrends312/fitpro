const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const { CORS_ORIGIN } = require('./config/env');

const app = express();

// Middlewares globais
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN || '*',
  credentials: true
}));

// Rotas
app.use('/api', routes);

// Health check simples na raiz
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'fitpro-backend' });
});

// 404 e erros
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
