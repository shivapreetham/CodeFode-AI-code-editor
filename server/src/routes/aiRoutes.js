import express from 'express';
import { processCodeWithAI } from '../controllers/aiCodeController.js';
import { validate, aiCodeSchema } from "../middleware/validation.js";
import { aiResultCache } from "../middleware/cache.js";
import { codeExecutionLimiter } from "../middleware/security.js";

const router = express.Router();

// POST /api/ai/code (with validation, caching, and rate limiting)
router.post('/code', 
  codeExecutionLimiter,
  validate(aiCodeSchema),
  aiResultCache,
  processCodeWithAI
);

export default router;