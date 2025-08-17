import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

export interface AIChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  context?: string;
}

export interface AIChatResponse {
  message: string;
  timestamp: string;
  context: string | null;
  metadata: {
    responseLength: number;
    hasContext: boolean;
    aiModel: string;
  };
}

interface ServerResponse {
  success: boolean;
  message?: string;
  data?: AIChatResponse;
}

interface UseAIChatProps {
  enabled?: boolean;
}

// Helper to build absolute URLs
const buildApiUrl = (endpoint: string): string => {
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || '';
  if (BASE_URL) {
    return `${BASE_URL}${endpoint}`;
  }
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

export const useAIChat = ({ enabled = true }: UseAIChatProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context?: string) => {
    if (!enabled || !message.trim()) return;
    
    const userMessageId = `user-${Date.now()}`;
    const userMessage: AIChatMessage = {
      id: userMessageId,
      message: message.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      context
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    
    try {
      setIsLoading(true);
      setError(null);

      const url = buildApiUrl('/api/ai/chat');
      console.info('[AI Chat] Starting request', { 
        messageLength: message.length, 
        hasContext: !!context,
        timestamp: new Date().toISOString() 
      });
      
      const response = await axios.post<ServerResponse | AIChatResponse>(
        url, 
        { message: message.trim(), context },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      
      console.info('[AI Chat] Response received', { 
        status: response.status,
        hasData: !!response.data,
        timestamp: new Date().toISOString()
      });
      
      // Handle wrapped response format from backend
      let chatData: AIChatResponse;
      if ('success' in response.data && response.data.data) {
        chatData = response.data.data;
      } else {
        chatData = response.data as AIChatResponse;
      }
      
      const aiMessage: AIChatMessage = {
        id: `ai-${Date.now()}`,
        message: chatData.message,
        isUser: false,
        timestamp: chatData.timestamp,
        context: chatData.context || undefined
      };

      setMessages(prev => [...prev, aiMessage]);
      
      console.info('[AI Chat] Message processed successfully', {
        messageLength: message.length,
        responseLength: chatData.message.length,
        hasContext: !!context,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: unknown) {
      const error = err as any;
      
      console.error('[AI Chat] Request failed', {
        error: error?.message || 'Unknown error',
        code: error?.code,
        status: error?.response?.status,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'Failed to get AI response';
      
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
      
      // Add error message to chat
      const errorMessageObj: AIChatMessage = {
        id: `error-${Date.now()}`,
        message: `Error: ${errorMessage}`,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
      
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    removeMessage
  };
};