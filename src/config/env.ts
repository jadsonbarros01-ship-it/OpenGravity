import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_ALLOWED_USER_IDS: process.env.TELEGRAM_ALLOWED_USER_IDS || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
  DB_PATH: process.env.DB_PATH || './memory.db',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  WOO_SHOP_URL: process.env.WOO_SHOP_URL || '',
  WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY || '',
  WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET || '',
};

// Validate mandatory fields
if (!ENV.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN === 'SUSTITUYE_POR_EL_TUYO') {
  console.warn("WARNING: TELEGRAM_BOT_TOKEN is missing or invalid.");
}
if (!ENV.GROQ_API_KEY || ENV.GROQ_API_KEY === 'SUSTITUYE_POR_EL_TUYO') {
  console.warn("WARNING: GROQ_API_KEY is missing or invalid.");
}
