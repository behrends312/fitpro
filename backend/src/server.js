const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');
const { MONGO_URI } = require('./config/env');

const port = PORT || 3001;
const server = http.createServer(app);

connectDB(MONGO_URI).then(() => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`[server] listening on http://0.0.0.0:${port}`);
  });
});
