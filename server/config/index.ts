import dotenv from 'dotenv';
import { z } from 'zod';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Define the configuration schema with validation
const configSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number().default(5000),
  HOST: z.string().default('0.0.0.0'),

  // Database Configuration
  DATABASE_URL: z.string().optional(),
  
  // API Keys
  FLIGHTAWARE_API_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AVIATIONSTACK_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  AVWX_API_KEY: z.string().optional(),
  FAA_NOTAM_API_KEY: z.string().optional(),
  OPENSKY_USERNAME: z.string().optional(),
  OPENSKY_PASSWORD: z.string().optional(),

  // Security Configuration
  SESSION_SECRET: z.string().refine(
    (value) => process.env.NODE_ENV !== 'production' || value !== 'your-development-secret-key',
    { message: 'SESSION_SECRET must be explicitly set in production.' }
  ).default(process.env.NODE_ENV === 'production' ? undefined : 'your-development-secret-key'),
  JWT_SECRET: z.string().refine(
    (value) => process.env.NODE_ENV !== 'production' || value !== 'your-development-jwt-secret',
    { message: 'JWT_SECRET must be explicitly set in production environments.' }
  ).default(
    process.env.NODE_ENV === 'production'
      ? undefined
      : crypto.randomBytes(32).toString('hex')
  ),
  // External Service URLs
  VISA_SERVICE_URL: z.string().url().default('http://localhost:8080'),
  AVIATION_NEWS_SERVICE_URL: z.string().url().default('http://localhost:8081'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.number().default(100),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Cache Configuration
  CACHE_TTL_SECONDS: z.number().default(300), // 5 minutes
  
  // ML Model Configuration
  ML_MODEL_PATH: z.string().default('./models'),
  ML_PREDICTION_TIMEOUT_MS: z.number().default(30000), // 30 seconds
});

// Parse and validate environment variables
const rawConfig = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ? parseInt(process.env.PORT) : undefined,
  HOST: process.env.HOST,
  DATABASE_URL: process.env.DATABASE_URL,
  FLIGHTAWARE_API_KEY: process.env.FLIGHTAWARE_API_KEY,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AVIATIONSTACK_API_KEY: process.env.AVIATIONSTACK_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  AVWX_API_KEY: process.env.AVWX_API_KEY,
  FAA_NOTAM_API_KEY: process.env.FAA_NOTAM_API_KEY,
  OPENSKY_USERNAME: process.env.OPENSKY_USERNAME,
  OPENSKY_PASSWORD: process.env.OPENSKY_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  VISA_SERVICE_URL: process.env.VISA_SERVICE_URL,
  AVIATION_NEWS_SERVICE_URL: process.env.AVIATION_NEWS_SERVICE_URL,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : undefined,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : undefined,
  LOG_LEVEL: process.env.LOG_LEVEL,
  CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS) : undefined,
  ML_MODEL_PATH: process.env.ML_MODEL_PATH,
  ML_PREDICTION_TIMEOUT_MS: process.env.ML_PREDICTION_TIMEOUT_MS ? parseInt(process.env.ML_PREDICTION_TIMEOUT_MS) : undefined,
};

// Validate configuration
const result = configSchema.safeParse(rawConfig);

if (!result.success) {
  console.error('❌ Configuration validation failed:');
  console.error(result.error.format());
  process.exit(1);
}

export const config = result.data;

// Environment-specific configurations
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Utility function to check if API key is available
export const hasApiKey = (keyName: keyof typeof config): boolean => {
  const key = config[keyName];
  return typeof key === 'string' && key.length > 0;
};

// Secure logging utility that masks sensitive information
export const logConfig = () => {
  const safeConfig = {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    HOST: config.HOST,
    DATABASE_URL: config.DATABASE_URL ? '***configured***' : 'not configured',
    FLIGHTAWARE_API_KEY: hasApiKey('FLIGHTAWARE_API_KEY') ? '***configured***' : 'not configured',
    RAPIDAPI_KEY: hasApiKey('RAPIDAPI_KEY') ? '***configured***' : 'not configured',
    OPENAI_API_KEY: hasApiKey('OPENAI_API_KEY') ? '***configured***' : 'not configured',
    AVIATIONSTACK_API_KEY: hasApiKey('AVIATIONSTACK_API_KEY') ? '***configured***' : 'not configured',
    NEWS_API_KEY: hasApiKey('NEWS_API_KEY') ? '***configured***' : 'not configured',
    AVWX_API_KEY: hasApiKey('AVWX_API_KEY') ? '***configured***' : 'not configured',
    FAA_NOTAM_API_KEY: hasApiKey('FAA_NOTAM_API_KEY') ? '***configured***' : 'not configured',
    OPENSKY_USERNAME: hasApiKey('OPENSKY_USERNAME') ? '***configured***' : 'not configured',
    VISA_SERVICE_URL: config.VISA_SERVICE_URL,
    AVIATION_NEWS_SERVICE_URL: config.AVIATION_NEWS_SERVICE_URL,
    RATE_LIMIT_WINDOW_MS: config.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: config.RATE_LIMIT_MAX_REQUESTS,
    LOG_LEVEL: config.LOG_LEVEL,
    CACHE_TTL_SECONDS: config.CACHE_TTL_SECONDS,
    ML_MODEL_PATH: config.ML_MODEL_PATH,
    ML_PREDICTION_TIMEOUT_MS: config.ML_PREDICTION_TIMEOUT_MS,
  };
  
  console.log('🔧 Configuration loaded:', JSON.stringify(safeConfig, null, 2));
};

export default config;
