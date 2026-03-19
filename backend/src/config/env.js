require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/athlio',
  JWT_SECRET: process.env.JWT_SECRET || 'athlio-secret-change-in-production',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC || '',
  STRIPE_PRICE_INTERMEDIATE: process.env.STRIPE_PRICE_INTERMEDIATE || '',
  STRIPE_PRICE_ADVANCED: process.env.STRIPE_PRICE_ADVANCED || '',

  APP_URL: process.env.APP_URL || 'http://localhost:3001',

  // Cloudflare R2
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'fitpro',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',

  // Anthropic
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};