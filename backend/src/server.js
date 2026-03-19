const http = require('http');
const app = require('./app');
const { PORT, MONGO_URI } = require('./config/env');
const { connectDB } = require('./config/db');

const port = PORT || 3000;
const server = http.createServer(app);

// Escuta imediatamente — o Fly.io precisa ver a porta aberta antes do timeout
server.listen(port, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${port}`);
  // Conecta ao MongoDB após a porta estar aberta
  connectDB(MONGO_URI).catch((err) => {
    console.error('[db] failed to connect:', err.message);
  });
});
