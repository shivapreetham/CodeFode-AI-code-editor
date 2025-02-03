import { cohere } from '@ai-sdk/cohere';
import { generateText } from 'ai';

const parseErrorResponse = (text) => {
  const errors = [];
  const errorBlocks = text.split(/(?=ERROR:)/).filter(block => block.trim());
  for (const block of errorBlocks) {
    const error = {};
    const lines = block.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('TITLE:')) {
        error.title = line.substring(6).trim();
      } else if (line.startsWith('LINE:')) {
        error.line = line.substring(5).trim();
      } else if (line.startsWith('CODE:')) {
        error.code = line.substring(5).trim();
        while (i + 1 < lines.length && 
               !lines[i + 1].trim().startsWith('FIXED_CODE:') && 
               !lines[i + 1].trim().startsWith('DESCRIPTION:')) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('```')) {
            error.code += '\n' + nextLine;
          }
          i++;
        }
      } else if (line.startsWith('FIXED_CODE:')) {
        error.fixedCode = line.substring(10).trim();
        while (i + 1 < lines.length && 
               !lines[i + 1].trim().startsWith('DESCRIPTION:')) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('```')) {
            error.fixedCode += '\n' + nextLine;
          }
          i++;
        }
      } else if (line.startsWith('DESCRIPTION:')) {
        error.description = line.substring(12).trim();
        while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('ERROR:')) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('```')) {
            error.description += ' ' + nextLine;
          }
          i++;
        }
      }
    }
    if (error.title && error.line && error.code && error.fixedCode && error.description) {
      error.code = error.code.replace(/```[a-z]*\n?/g, '').trim();
      error.fixedCode = error.fixedCode.replace(/```[a-z]*\n?/g, '').trim();
      errors.push(error);
    }
  }
  
  return errors;
};
const parseSuggestions = (text) => {
  const suggestions = [];
  const suggestionBlocks = text.split(/\n(?:##\s*)?SUGGESTION:/).filter(block => block.trim());
  for (const block of suggestionBlocks) {
    const lines = block.split('\n');
    const suggestion = {};
    let inCodeBlock = false;
    let currentField = '';
    
    for (const line of lines) {
      const cleanLine = line.replace(/^###?\s*/, '');
      if (cleanLine.startsWith('TITLE:')) {
        suggestion.title = cleanLine.replace('TITLE:', '').trim();
      } else if (cleanLine.startsWith('CODE:')) {
        currentField = 'code';
        suggestion.code = '';
        inCodeBlock = false;
      } else if (cleanLine.startsWith('EXPLANATION:')) {
        currentField = 'explanation';
        suggestion.explanation = cleanLine.replace('EXPLANATION:', '').trim();
      } else if (cleanLine.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock && currentField === 'code') {
        suggestion.code = (suggestion.code + '\n' + cleanLine).trim();
      } else if (currentField === 'explanation' && !cleanLine.trim().startsWith('```')) {
        suggestion.explanation = (suggestion.explanation + ' ' + cleanLine.trim()).trim();
      }
    }
    if (suggestion.title && suggestion.code && suggestion.explanation) {
      suggestion.code = suggestion.code.replace(/```[a-z]*\n?/g, '').trim();
      suggestions.push(suggestion);
    }
  }
  return suggestions;
};
const parsePractices = (text) => {
  const practices = [];
  const practiceBlocks = text.split(/\n(?:##\s*)?(?:PRACTICE|Practice)\s*\d*:?/).filter(block => block.trim());
  
  for (const block of practiceBlocks) {
    const lines = block.split('\n');
    const practice = {};
    let inCodeBlock = false;
    let currentField = '';
    
    for (const line of lines) {
      const cleanLine = line.replace(/^###?\s*/, '');
      if (cleanLine.startsWith('TITLE:') || cleanLine.startsWith('Title:')) {
        practice.title = cleanLine.replace(/(?:TITLE|Title):/, '').trim();
      } else if (cleanLine.startsWith('CODE:') || cleanLine.startsWith('Code:')) {
        currentField = 'code';
        practice.code = '';
        inCodeBlock = false;
      } else if (cleanLine.startsWith('EXPLANATION:') || cleanLine.startsWith('Explanation:')) {
        currentField = 'explanation';
        practice.explanation = cleanLine.replace(/(?:EXPLANATION|Explanation):/, '').trim();
      } else if (cleanLine.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock && currentField === 'code') {
        practice.code = (practice.code + '\n' + cleanLine).trim();
      } else if (currentField === 'explanation' && !cleanLine.trim().startsWith('```')) {
        practice.explanation = (practice.explanation + ' ' + cleanLine.trim()).trim();
      }
    }
    
    if (!practice.title) {
      const titleMatch = block.match(/(?:##|###)\s*([^:\n]+?)(?:\n|$)/);
      if (titleMatch) practice.title = titleMatch[1].trim();
    }
    if (practice.title && practice.code && practice.explanation) {
      practice.code = practice.code.replace(/```[a-z]*\n?/g, '').trim();
      practices.push(practice);
    }
  }
  return practices;
};

const parseDocumentation = (text) => {
  const documentation = {
    overview: '',
    functions: [],
    notes: ''
  };

  // Remove markdown headers and clean up text
  const cleanedText = text
    .replace(/##\s*SECTION:/g, 'SECTION:')
    .replace(/\*\*/g, '')
    .trim();

  // Split into sections
  const sections = cleanedText.split('SECTION:').filter(section => section.trim());

  sections.forEach(section => {
    // Parse Overview
    if (section.includes('OVERVIEW:')) {
      documentation.overview = section
        .split('OVERVIEW:')[1]
        .split('SECTION:')[0]
        .trim();
    }

    // Parse Function
    if (section.includes('FUNCTION:')) {
      const functionParts = section.split(/\n/);
      const functionEntry = {
        name: '',
        description: '',
        params: [],
        returns: ''
      };

      functionParts.forEach((line, index) => {
        if (line.startsWith('FUNCTION:')) {
          functionEntry.name = line.replace('FUNCTION:', '').trim();
        }

        if (line.startsWith('DESCRIPTION:')) {
          functionEntry.description = line.replace('DESCRIPTION:', '').trim();
        }

        if (line.includes('PARAMS:')) {
          const paramStart = functionParts.findIndex(l => l.includes('PARAMS:'));
          let paramIndex = paramStart + 1;
          while (
            paramIndex < functionParts.length && 
            functionParts[paramIndex].startsWith('- ')
          ) {
            functionEntry.params.push(
              functionParts[paramIndex].replace('- ', '').trim()
            );
            paramIndex++;
          }
        }

        if (line.startsWith('RETURNS:')) {
          functionEntry.returns = line.replace('RETURNS:', '').trim();
        }
      });

      documentation.functions.push(functionEntry);
    }

    // Parse Notes
    if (section.includes('NOTES:')) {
      documentation.notes = section
        .split('NOTES:')[1]
        .split('##')[0]
        .trim();
    }
  });

  return documentation; // Add this return statement
};
export const processCodeWithAI = async (code, language) => {
  try {
    const [errorResponse, suggestionResponse, practiceResponse, documentationResponse] = await Promise.all([
      generateText({
        model: cohere('command-r-plus'),
        prompt: `As an expert ${language} code reviewer, analyze this code and identify all errors.
        For each error, provide:
        ERROR:
        TITLE: [Brief error title]
        LINE: [Line number or range]
        CODE: [Problematic code]
        FIXED_CODE: [Corrected code]
        DESCRIPTION: [Detailed explanation]

        Analyze this code:
        ${code}`
      }),

      generateText({
        model: cohere('command-r-plus'),
        prompt: `As an expert ${language} programmer, provide exactly 3 suggestions for additional code that would enhance this codebase.
        Each suggestion should be 2-10 lines of code.
        Format each suggestion as:
        SUGGESTION:
        TITLE: [Brief title]
        CODE: [Your suggested code]
        EXPLANATION: [Why this would be helpful]

        Code context:
        ${code}`
      }),

      generateText({
        model: cohere('command-r-plus'),
        prompt: `As an expert ${language} developer, suggest exactly 2 best practices that could improve this code.
        Each practice should include 2-20 lines of example code.
        Format as:
        PRACTICE:
        TITLE: [Practice title]
        CODE: [Example code]
        EXPLANATION: [Detailed explanation]

        Analyze this code:
        ${code}`
      }),

      generateText({
        model: cohere('command-r-plus'),
        prompt: `As an expert ${language} technical writer, provide comprehensive documentation for this code.
        Format as:
        SECTION: OVERVIEW
        OVERVIEW: [High-level description of the codebase]
        
        SECTION: FUNCTION
        FUNCTION: [Function name]
        [Function description]
        PARAMS:
        - [Parameter name]: [Parameter description]
        RETURNS: [Return value description]
        
        SECTION: NOTES
        NOTES: [Additional implementation details, usage notes, or important considerations]
    
        Code to document:
        ${code}`
      })
    ]);


    const response = {
      errors: parseErrorResponse(errorResponse.text),
      suggestions: parseSuggestions(suggestionResponse.text),
      bestPractices: parsePractices(practiceResponse.text),
      documentation : parseDocumentation(documentationResponse.text),
      timestamp: new Date().toISOString()
    };
    
    return response;
  } catch (error) {
    console.error('Error in AI code processing:', error);
    throw new Error('Failed to process code with AI');
  }
};