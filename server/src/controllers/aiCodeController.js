import { cohere } from '@ai-sdk/cohere';
import { generateText } from 'ai';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../middleware/logger.js';
import config from '../config/environment.js';

// Removed complex parsing functions - now using direct JSON from AI
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
  
  // Check if AI service is available
  if (!config.ai.cohereApiKey) {
    throw new ValidationError('AI service not configured');
  }
  
  try {
    const aiResponse = await generateText({
      model: cohere('command-r-plus'),
      prompt: `You are an expert ${language} code analyzer. Analyze the provided code and return a JSON response with the following structure:

{
  "errors": [
    {
      "title": "Brief error description",
      "line": "Line number or range",
      "code": "Problematic code snippet",
      "fixedCode": "Corrected code",
      "description": "Detailed explanation of the issue"
    }
  ],
  "suggestions": [
    {
      "title": "Enhancement suggestion title",
      "code": "Suggested code (2-10 lines)",
      "explanation": "Why this enhancement would be helpful"
    }
  ],
  "bestPractices": [
    {
      "title": "Best practice title",
      "code": "Example code demonstrating the practice",
      "explanation": "Detailed explanation of the best practice"
    }
  ]
}

Provide 1-3 errors (if any), exactly 3 suggestions, and exactly 2 best practices. Return ONLY valid JSON, no additional text.

Code to analyze:
${code}`
    });

    // Parse JSON response from AI
    let parsedResponse;
    try {
      // Clean the response text to extract JSON
      const jsonText = aiResponse.text.replace(/```json\n?|```\n?/g, '').trim();
      parsedResponse = JSON.parse(jsonText);
      
      // Validate the structure
      if (!parsedResponse.errors) parsedResponse.errors = [];
      if (!parsedResponse.suggestions) parsedResponse.suggestions = [];
      if (!parsedResponse.bestPractices) parsedResponse.bestPractices = [];
      
    } catch (parseError) {
      logger.error('Failed to parse AI JSON response', { error: parseError.message, rawText: aiResponse.text });
      // Fallback to empty arrays if JSON parsing fails
      parsedResponse = {
        errors: [],
        suggestions: [],
        bestPractices: []
      };
    }

    const responseData = {
      errors: parsedResponse.errors,
      suggestions: parsedResponse.suggestions,
      bestPractices: parsedResponse.bestPractices,
      metadata: {
        language,
        codeLength: code.length,
        processedAt: new Date().toISOString()
      }
    };
    
    logger.info('AI code analysis completed', { 
      language,
      errorsFound: responseData.errors.length,
      suggestionsGenerated: responseData.suggestions.length,
      practicesGenerated: responseData.bestPractices.length,
      aiResponse: {
        totalErrors: responseData.errors.length,
        totalSuggestions: responseData.suggestions.length,
        totalPractices: responseData.bestPractices.length,
        responseSize: JSON.stringify(responseData).length
      }
    });
    
    return successResponse(res, responseData, 'Code analysis completed successfully');
    
  } catch (error) {
    logger.error('AI code processing failed', { 
      language,
      error: error.message 
    });
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return errorResponse(res, 'AI service rate limit exceeded. Please try again later.', 429);
    }
    
    throw new Error('Failed to process code with AI: ' + error.message);
  }
});