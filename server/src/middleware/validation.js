import { z } from 'zod';
import { ValidationError } from './errorHandler.js';

// Common validation schemas
export const roomIdSchema = z.string().min(1, 'Room ID is required').max(100, 'Room ID too long');

export const fileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  content: z.string().default(''),
  language: z.string().min(1, 'Language is required'),
  path: z.string().min(1, 'Path is required')
});

export const workspaceSchema = z.object({
  roomId: roomIdSchema,
  fileExplorerData: z.record(z.any()).optional(),
  openFiles: z.array(fileSchema).default([]),
  activeFile: fileSchema.nullable().optional(),
  filesContent: z.array(z.object({
    path: z.string().min(1),
    file: fileSchema
  })).default([])
});

export const codeExecutionSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  code: z.string().min(1, 'Code is required').max(10000, 'Code too long')
});

export const aiCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code too long'),
  language: z.string().min(1, 'Language is required')
});

export const chatMessageSchema = z.object({
  roomId: roomIdSchema,
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  username: z.string().min(1, 'Username is required'),
  timestamp: z.number().positive(),
  toSocketId: z.string().optional()
});

// Validation middleware factory
export const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(message);
    }
    throw error;
  }
};

// Sanitization helpers
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  return input;
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Sanitization middleware
export const sanitize = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
};