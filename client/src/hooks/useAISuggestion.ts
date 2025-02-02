import { useState } from 'react';
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
}

interface UseAISuggestionsProps {
  enabled: boolean;
}

export const useAISuggestions = ({ enabled }: UseAISuggestionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState<AIResponse | undefined>();
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (code: string, language: string) => {
    if (!enabled || !code.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post<AIResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/code`, 
        { code, language },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        }
      );

      setAIResponse(response.data);
      console.log(response.data)
    } catch (err) {
      let errorMessage = 'Failed to analyze code';
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setError(errorMessage);
      setAIResponse(undefined);
      
    } finally {
      setIsLoading(false);
    }
  };
  return {
    isLoading,
    aiResponse,
    error,
    fetchSuggestions
  };
};