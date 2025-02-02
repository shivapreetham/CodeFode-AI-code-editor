import express from 'express';
import { processCodeWithAI } from '../controllers/aiCodeController.js';

const router = express.Router();

router.post('/code', async (req, res) => {
  try {
    const { code, language } = req.body;
    console.log(req.body, "recieved the code")
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required'
      });
    }

    const result = await processCodeWithAI(code, language);
    res.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Failed to process code'
    });
  }
});

export default router;