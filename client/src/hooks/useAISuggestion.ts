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
  timestamp: string;
  inlineSuggestions?: string[]; // New field for inline suggestions
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
    console.log('🔥 fetchSuggestions called with:', { 
      codeLength: code?.length, 
      language, 
      enabled,
      codePreview: code?.substring(0, 50) + '...'
    });
    
    if (!enabled || !code.trim()) {
      console.log('❌ fetchSuggestions early return:', { enabled, codeTrimmed: code?.trim().length });
      return;
    }
    
    try {
      console.log('🚀 Starting AI code analysis...');
      
      setIsLoading(true);
      setError(null);

      const url = buildApiUrl('/api/ai/code');
      console.log('📡 AI API URL:', url);

      const response = await axios.post<AIResponse>(
        url, 
        { code, language },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      console.log('✅ AI analysis completed');
      setAIResponse(response.data);
    } catch (err) {
      console.error('❌ AI analysis error:', err);
      
      let errorMessage = 'Failed to analyze code';
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.status === 404) {
          errorMessage = 'AI service not available. Please check backend connection.';
        } else if (err.response?.status === 500) {
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