const mongoose = require('mongoose');
const { NODE_ENV } = require('./env');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { dbName: 'fitpro' });
    console.log('[db] connected', NODE_ENV);
  } catch (err) {
    console.error('[db] connection error', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
