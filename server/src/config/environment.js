import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(8000),
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  
  // AI service configuration
  COHERE_API_KEY: z.string().min(1, 'Cohere API key is required').optional(),
  GOOGLE_AI_API_KEY: z.string().min(1, 'Google AI API key is required').optional(),
  
  // Security configuration
  BCRYPT_ROUNDS: z.coerce.number().min(8).max(15).default(12),
  
  
  // Allowed origins for CORS
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')).default('http://localhost:3000,http://localhost:3001,https://codefode-ai-code-editor.onrender.com'),
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
  
  // File upload limits
  MAX_FILE_SIZE: z.coerce.number().positive().default(10485760), // 10MB
  MAX_CODE_LENGTH: z.coerce.number().positive().default(100000), // Increased for larger code files
  
  // AI service timeouts
  AI_REQUEST_TIMEOUT: z.coerce.number().positive().default(120000), // 2 minutes
  
  // Socket.IO configuration
  SOCKET_PING_TIMEOUT: z.coerce.number().positive().default(60000),
  SOCKET_PING_INTERVAL: z.coerce.number().positive().default(25000)
});

// Validate and parse environment variables
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment configuration:');
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

// Export validated configuration
export const config = {
  // Server configuration
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test'
  },
  
  // Database configuration
  database: {
    mongoUri: env.MONGODB_URI
  },
  
  
  // Security configuration
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    allowedOrigins: env.ALLOWED_ORIGINS
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS
  },
  
  // File handling configuration
  files: {
    maxFileSize: env.MAX_FILE_SIZE,
    maxCodeLength: env.MAX_CODE_LENGTH
  },
  
  // AI configuration
  ai: {
    cohereApiKey: env.COHERE_API_KEY,
    googleApiKey: env.GOOGLE_AI_API_KEY,
    requestTimeout: env.AI_REQUEST_TIMEOUT
  },
  
  // Socket.IO configuration
  socket: {
    pingTimeout: env.SOCKET_PING_TIMEOUT,
    pingInterval: env.SOCKET_PING_INTERVAL
  }
};

// Validate required environment variables based on NODE_ENV
export const validateEnvironment = () => {
  const required = [];
  
  if (config.server.isProduction) {
    if (!config.ai.cohereApiKey && !config.ai.googleApiKey) {
      required.push('At least one AI API key (COHERE_API_KEY or GOOGLE_AI_API_KEY)');
    }
  }
  
  if (required.length > 0) {
    console.error('❌ Missing required environment variables for production:');
    required.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
  
};

export default config;