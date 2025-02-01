import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface Suggestion {
  title: string;
  code: string;
  explanation: string;
}

interface Error {
  title: string;
  description: string;
  suggestion: string;
}

interface AIResponse {
  analysis: {
    suggestions: Suggestion[];
    errors: Error[];
  };
  suggestion: {
    suggestion: string;
    explanation: string;
  };
  fixedCode: string;
  timestamp: string;
}

interface UseAISuggestionsProps {
  enabled: boolean;
}

export const useAISuggestions = ({ enabled }: UseAISuggestionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState<AIResponse | undefined>(undefined);  // Changed from null to undefined
  const [error, setError] = useState<AxiosError | null>(null);

  const fetchSuggestions = async (code: string, language: string) => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // console.log("sending the api request");
      const response = await axios.post<AIResponse>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/code`, { code, language });
      setAIResponse(response.data);
      console.log("got response from AI:", response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err);
        console.error('Error fetching AI suggestions:', err);
      }
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