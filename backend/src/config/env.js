require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/fitpro',
  JWT_SECRET: process.env.JWT_SECRET || 'fitpro-secret-change-in-production',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC || '',
  STRIPE_PRICE_INTERMEDIATE: process.env.STRIPE_PRICE_INTERMEDIATE || '',
  STRIPE_PRICE_ADVANCED: process.env.STRIPE_PRICE_ADVANCED || '',

  APP_URL: process.env.APP_URL || 'http://localhost:3001',
};