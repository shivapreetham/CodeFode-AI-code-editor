import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

export interface Error {
  title: string;
  line: string;
  code: string;
  fixedCode: string;
  description: string;
}

export interface Suggestion {
  title: string;
  code: string;
  explanation: string;
}

export interface Practice {
  title: string;
  code: string;
  explanation: string;
}

export interface AIResponse {
  errors: Error[];
  suggestions: Suggestion[];
  bestPractices: Practice[];
  metadata?: {
    language: string;
    codeLength: number;
    processedAt: string;
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
          timeout: 30000
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
      
      // Simple validation with fallbacks
      const validatedResponse: AIResponse = {
        errors: Array.isArray(aiData.errors) ? aiData.errors : [],
        suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : [],
        bestPractices: Array.isArray(aiData.bestPractices) ? aiData.bestPractices : [],
        metadata: aiData.metadata
      };
      
      // Log AI analysis results
      console.info('[AI] Analysis completed successfully', {
        errors: validatedResponse.errors.length,
        suggestions: validatedResponse.suggestions.length,
        bestPractices: validatedResponse.bestPractices.length,
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