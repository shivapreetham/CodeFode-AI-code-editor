import { GoogleGenAI } from '@google/genai';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../middleware/logger.js';
import config from '../config/environment.js';

// Initialize Gemini AI client
const initGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || config.ai?.googleApiKey;
  if (!apiKey) {
    throw new ValidationError('Gemini API key not configured. Set GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable.');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper function to get line numbers for code
const getCodeLines = (code) => {
  return code.split('\n');
};

// Advanced AI code analysis with line-specific corrections
export const processCodeWithAI = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  
  // Validate inputs
  if (!code || !language) {
    throw new ValidationError('Code and language are required');
  }
  
  if (code.length > config.files.maxCodeLength) {
    throw new ValidationError(`Code length exceeds maximum allowed (${config.files.maxCodeLength} characters)`);
  }
  
  logger.info('AI code processing request', { 
    language,
    codeLength: code.length 
  });
  
  try {
    const ai = initGeminiClient();
    const codeLines = getCodeLines(code);
    
    // Create numbered code for AI analysis
    const numberedCode = codeLines.map((line, index) => `${index + 1}: ${line}`).join('\n');
    
    const prompt = `You are an expert ${language} code analyzer and debugger. Analyze the provided code and return a JSON response with line-specific corrections and improvements.

IMPORTANT: When identifying issues or improvements, provide EXACT line numbers and ranges. Focus on:
1. Syntax errors, logical errors, and bugs
2. Performance improvements
3. Code quality enhancements
4. Best practices

Return ONLY valid JSON in this exact structure:

{
  "lineCorrections": [
    {
      "title": "Brief issue description",
      "startLine": 5,
      "endLine": 7,
      "severity": "error|warning|info",
      "originalCode": "exact code from those lines",
      "correctedCode": "fixed version of those exact lines",
      "explanation": "Why this change is needed and what it fixes"
    }
  ],
  "suggestions": [
    {
      "title": "Enhancement suggestion",
      "targetLines": [10, 11, 12],
      "code": "Suggested replacement code",
      "explanation": "Why this enhancement improves the code"
    }
  ],
  "bestPractices": [
    {
      "title": "Best practice recommendation",
      "appliesTo": "function|variable|structure|general",
      "code": "Example code demonstrating the practice",
      "explanation": "Detailed explanation of the best practice"
    }
  ],
  "codeQuality": {
    "score": 85,
    "issues": ["performance", "readability", "security"],
    "suggestions": ["Add error handling", "Use const instead of let"]
  }
}

RULES:
- startLine and endLine are 1-based line numbers
- originalCode must match EXACTLY what's on those lines
- correctedCode should be the improved version for those exact lines
- Provide 0-5 line corrections based on actual issues found
- Provide 2-4 suggestions for improvements
- Provide 1-3 best practices
- Be precise with line numbers - they must be accurate

Code to analyze (with line numbers):
${numberedCode}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Parse JSON response from Gemini
    let parsedResponse;
    try {
      const jsonText = response.text.replace(/```json\n?|```\n?/g, '').trim();
      parsedResponse = JSON.parse(jsonText);
      
      // Validate and sanitize the structure
      if (!parsedResponse.lineCorrections) parsedResponse.lineCorrections = [];
      if (!parsedResponse.suggestions) parsedResponse.suggestions = [];
      if (!parsedResponse.bestPractices) parsedResponse.bestPractices = [];
      if (!parsedResponse.codeQuality) {
        parsedResponse.codeQuality = {
          score: 70,
          issues: [],
          suggestions: []
        };
      }
      
      // Validate line numbers are within bounds
      parsedResponse.lineCorrections = parsedResponse.lineCorrections.filter(correction => {
        const validStart = correction.startLine >= 1 && correction.startLine <= codeLines.length;
        const validEnd = correction.endLine >= correction.startLine && correction.endLine <= codeLines.length;
        return validStart && validEnd;
      });
      
    } catch (parseError) {
      logger.error('Failed to parse Gemini JSON response', { 
        error: parseError.message, 
        rawText: response.text.substring(0, 500) 
      });
      
      // Fallback to empty response if JSON parsing fails
      parsedResponse = {
        lineCorrections: [],
        suggestions: [],
        bestPractices: [],
        codeQuality: {
          score: 70,
          issues: ['parsing_error'],
          suggestions: ['AI response could not be parsed properly']
        }
      };
    }

    const responseData = {
      lineCorrections: parsedResponse.lineCorrections,
      suggestions: parsedResponse.suggestions,
      bestPractices: parsedResponse.bestPractices,
      codeQuality: parsedResponse.codeQuality,
      metadata: {
        language,
        codeLength: code.length,
        totalLines: codeLines.length,
        processedAt: new Date().toISOString(),
        aiModel: 'gemini-2.5-flash'
      }
    };
    
    logger.info('Gemini AI code analysis completed', { 
      language,
      lineCorrections: responseData.lineCorrections.length,
      suggestions: responseData.suggestions.length,
      bestPractices: responseData.bestPractices.length,
      qualityScore: responseData.codeQuality.score,
      totalLines: codeLines.length
    });
    
    return successResponse(res, responseData, 'Code analysis completed successfully');
    
  } catch (error) {
    logger.error('Gemini AI code processing failed', { 
      language,
      error: error.message 
    });
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return errorResponse(res, 'AI service rate limit exceeded. Please try again later.', 429);
    }
    
    if (error.message.includes('API key')) {
      return errorResponse(res, 'AI service not properly configured.', 503);
    }
    
    throw new Error('Failed to process code with Gemini AI: ' + error.message);
  }
});

// AI Chat for general questions, algorithms, explanations
export const aiChat = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  
  // Validate inputs
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Message is required and must be a string');
  }
  
  if (message.length > 2000) {
    throw new ValidationError('Message length exceeds maximum allowed (2000 characters)');
  }
  
  logger.info('AI chat request', { 
    messageLength: message.length,
    hasContext: !!context
  });
  
  try {
    const ai = initGeminiClient();
    
    const systemPrompt = `You are an expert programming assistant. Help users with:
- Explaining algorithms and data structures
- Writing code snippets and functions
- Debugging and code review
- Best practices and design patterns
- Programming concepts and theory
- Code optimization techniques

Provide clear, concise, and practical responses. When showing code, use proper syntax highlighting and include explanations.

${context ? `\nUser's current context: ${context}` : ''}

User question: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });

    const responseData = {
      message: response.text,
      timestamp: new Date().toISOString(),
      context: context || null,
      metadata: {
        responseLength: response.text.length,
        hasContext: !!context,
        aiModel: 'gemini-2.5-flash'
      }
    };
    
    logger.info('AI chat completed', { 
      messageLength: message.length,
      responseLength: response.text.length,
      hasContext: !!context
    });
    
    return successResponse(res, responseData, 'AI chat response generated successfully');
    
  } catch (error) {
    logger.error('AI chat failed', { 
      messageLength: message.length,
      error: error.message 
    });
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return errorResponse(res, 'AI service rate limit exceeded. Please try again later.', 429);
    }
    
    if (error.message.includes('API key')) {
      return errorResponse(res, 'AI service not properly configured.', 503);
    }
    
    throw new Error('Failed to process AI chat: ' + error.message);
  }
});