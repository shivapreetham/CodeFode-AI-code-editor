import { cohere } from '@ai-sdk/cohere';
import { generateText } from 'ai';

const parseAnalysisResponse = (analysis) => {
  const suggestions = [];
  const errors = [];
  
  const sections = analysis.split('\n\n');
  let currentSection = '';
  
  for (const section of sections) {
    if (section.startsWith('SUGGESTIONS:')) {
      currentSection = 'suggestions';
      continue;
    } else if (section.startsWith('ERRORS:')) {
      currentSection = 'errors';
      continue;
    }

    const lines = section.split('\n');
    if (currentSection === 'suggestions') {
      const suggestion = {};
      for (const line of lines) {
        if (line.startsWith('- Title:')) {
          suggestion.title = line.replace('- Title:', '').trim();
        } else if (line.startsWith('- Code:')) {
          suggestion.code = line.replace('- Code:', '').trim();
        } else if (line.startsWith('- Explanation:')) {
          suggestion.explanation = line.replace('- Explanation:', '').trim();
        }
      }
      if (suggestion.title && suggestion.code) {
        suggestions.push(suggestion);
      }
    } else if (currentSection === 'errors') {
      const error = {};
      for (const line of lines) {
        if (line.startsWith('- Title:')) {
          error.title = line.replace('- Title:', '').trim();
        } else if (line.startsWith('- Description:')) {
          error.description = line.replace('- Description:', '').trim();
        } else if (line.startsWith('- Suggestion:')) {
          error.suggestion = line.replace('- Suggestion:', '').trim();
        }
      }
      if (error.title && error.description) {
        errors.push(error);
      }
    }
  }

  return { suggestions, errors };
};

const parseSuggestionResponse = (text) => {
  const lines = text.split('\n');
  let suggestion = '';
  let explanation = '';

  for (const line of lines) {
    if (line.startsWith('SUGGESTION:')) {
      suggestion = line.replace('SUGGESTION:', '').trim();
    } else if (line.startsWith('EXPLANATION:')) {
      explanation = line.replace('EXPLANATION:', '').trim();
    }
  }

  return { suggestion, explanation };
};

export const processCodeWithAI = async (code, language) => {
  try {
    const [analysisResponse, suggestionResponse, fixResponse] = await Promise.all([
      // Analysis request
      generateText({
        model: cohere('command-r-plus'),
        prompt: `You are an expert code reviewer and AI programming assistant. Analyze the following ${language} code and provide:
        1. Potential improvements
        2. Any errors or issues
        3. Best practices that could be applied
        
        Format your response as follows:
        SUGGESTIONS:
        - Title: [improvement title]
        - Code: [code snippet]
        - Explanation: [explanation]

        ERRORS:
        - Title: [error title]
        - Description: [error description]
        - Suggestion: [fix suggestion]
        
        Code to analyze:
        ${code}`
      }),

      // Suggestion request
      generateText({
        model: cohere('command-r-plus'),
        prompt: `You are an expert ${language} programmer. Based on the following code context, suggest the next logical piece of code that would be helpful. 
        Provide your response in this format:
        SUGGESTION: [your code suggestion]
        EXPLANATION: [brief explanation]
        
        Code context:
        ${code}`
      }),

      // Fix request
      generateText({
        model: cohere('command-r-plus'),
        prompt: `As an expert ${language} developer, provide a complete, improved version of this code.
        Fix all issues, apply best practices, and optimize performance.
        Return ONLY the complete, fixed code without any explanations.
        Ensure the fixed code is complete and can work as a drop-in replacement.
        
        Original code:
        ${code}`
      })
    ]);

    console.log(analysisResponse.text, suggestionResponse.text, fixResponse.text);
    return {
      analysis: parseAnalysisResponse(analysisResponse.text),
      suggestion: parseSuggestionResponse(suggestionResponse.text),
      fixedCode: fixResponse.text.trim(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in AI code processing:', error);
    throw new Error('Failed to process code with AI');
  }
};