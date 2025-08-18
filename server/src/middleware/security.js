import { rateLimit } from 'express-rate-limit';
import config from '../config/environment.js';

// Rate limiting configurations
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for sensitive endpoints
  message: {
    success: false,
    error: {
      message: 'Too many requests to this endpoint, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const codeExecutionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 code executions per minute
  message: {
    success: false,
    error: {
      message: 'Too many code execution requests, please wait before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' ws: wss:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'"
  );
  
  next();
};

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin in development (Render webhooks, etc.)
    if (!origin && config.server.isDevelopment) return callback(null, true);
    
    const allowedOrigins = config.security.allowedOrigins;
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Request size limiting
export const requestSizeLimit = '10mb';

// Helmet-like security middleware (basic implementation)
export const basicSecurity = (req, res, next) => {
  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  securityHeaders(req, res, next);
};