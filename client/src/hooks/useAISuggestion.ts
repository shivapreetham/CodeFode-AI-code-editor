import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

export interface LineCorrection {
  title: string;
  startLine: number;
  endLine: number;
  severity: 'error' | 'warning' | 'info';
  originalCode: string;
  correctedCode: string;
  explanation: string;
}

export interface Suggestion {
  title: string;
  targetLines?: number[];
  code: string;
  explanation: string;
}

export interface Practice {
  title: string;
  appliesTo: 'function' | 'variable' | 'structure' | 'general';
  code: string;
  explanation: string;
}

export interface CodeQuality {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface AIResponse {
  lineCorrections: LineCorrection[];
  suggestions: Suggestion[];
  bestPractices: Practice[];
  codeQuality: CodeQuality;
  metadata?: {
    language: string;
    codeLength: number;
    totalLines: number;
    processedAt: string;
    aiModel: string;
  };
}

// Server response wrapper
interface ServerResponse {
  success: boolean;
  message?: string;
  data?: AIResponse;
}

interface UseAISuggestionsProps {
  enabled?: boolean;
}

// Helper to build absolute URLs (same as workspaceApi)
const buildApiUrl = (endpoint: string): string => {
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || '';
  if (BASE_URL) {
    return `${BASE_URL}${endpoint}`;
  }
  // Fallback to absolute path - leading slash forces absolute URL
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

export const useAISuggestions = ({ enabled = true }: UseAISuggestionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState<AIResponse | undefined>();
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (code: string, language: string) => {
    if (!enabled || !code.trim()) return;
    
    let response;
    try {
      setIsLoading(true);
      setError(null);

      const url = buildApiUrl('/api/ai/code');
      // Log AI request for debugging
      console.info('[AI] Starting code analysis', { language, codeLength: code.length, timestamp: new Date().toISOString() });
      
      response = await axios.post<ServerResponse | AIResponse>(
        url, 
        { code, language },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000 // Increased to 2 minutes for larger code files
        }
      );
      
      // Log server response for debugging
      console.info('[AI] Server response received', { 
        status: response.status,
        hasData: !!response.data,
        timestamp: new Date().toISOString()
      });
      
      // Handle wrapped response format from backend
      let aiData: AIResponse;
      if ('success' in response.data && response.data.data) {
        aiData = response.data.data;
      } else {
        aiData = response.data as AIResponse;
      }
      
      // Enhanced validation with fallbacks for new structure
      const validatedResponse: AIResponse = {
        lineCorrections: Array.isArray(aiData.lineCorrections) ? aiData.lineCorrections : [],
        suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : [],
        bestPractices: Array.isArray(aiData.bestPractices) ? aiData.bestPractices : [],
        codeQuality: aiData.codeQuality || {
          score: 70,
          issues: [],
          suggestions: []
        },
        metadata: aiData.metadata
      };
      
      // Log AI analysis results
      console.info('[AI] Analysis completed successfully', {
        lineCorrections: validatedResponse.lineCorrections.length,
        suggestions: validatedResponse.suggestions.length,
        bestPractices: validatedResponse.bestPractices.length,
        qualityScore: validatedResponse.codeQuality.score,
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString()
      });
      
      setAIResponse(validatedResponse);
    } catch (err: unknown) {
      // Type guard for error handling
      const error = err as any;
      
      // Log AI error for debugging
      console.error('[AI] Analysis failed', {
        error: error?.message || 'Unknown error',
        code: error?.code,
        status: error?.response?.status,
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'Failed to analyze code';
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 404) {
          errorMessage = 'AI service not available. Please check backend connection.';
        } else if (error.response?.status === 500) {
          errorMessage = 'AI service error. Please try again.';
        }
      }
      
      setError(errorMessage);
      setAIResponse(undefined);
      
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  return {
    isLoading,
    aiResponse,
    error,
    fetchSuggestions
  };
};