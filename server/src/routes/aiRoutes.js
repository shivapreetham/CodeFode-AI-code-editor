import express from 'express';
import { processCodeWithAI, aiChat } from '../controllers/aiCodeController.js';
import { validate, aiCodeSchema } from "../middleware/validation.js";
import { aiResultCache } from "../middleware/cache.js";
import { codeExecutionLimiter } from "../middleware/security.js";
import { z } from 'zod';

const router = express.Router();

// AI Chat validation schema
const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  context: z.string().optional()
});

// POST /api/ai/code (with validation, caching, and rate limiting)
router.post('/code', 
  codeExecutionLimiter,
  validate(aiCodeSchema),
  aiResultCache,
  processCodeWithAI
);

// POST /api/ai/chat (for general questions, algorithms, explanations)
router.post('/chat',
  codeExecutionLimiter,
  validate(aiChatSchema),
  aiChat
);

export default router;