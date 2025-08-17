import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Trash2, User, Bot, Copy, Check } from 'lucide-react';
import { useAIChat, AIChatMessage } from '@/hooks/useAIChat';
import CodeBlock from './codeBlock';

interface AiChatPanelProps {
  currentCode?: string;
  currentLanguage?: string;
  onInsertCode?: (code: string) => void;
}

const AiChatPanel: React.FC<AiChatPanelProps> = ({
  currentCode,
  currentLanguage,
  onInsertCode
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const context = currentCode ? `Current code (${currentLanguage}):\n${currentCode}` : undefined;
    await sendMessage(inputMessage, context);
    setInputMessage('');
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const extractCodeFromMessage = (message: string) => {
    // Simple regex to extract code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = message.match(codeBlockRegex);
    if (matches) {
      return matches.map(match => 
        match.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
      );
    }
    return [];
  };

  const MessageBubble: React.FC<{ message: AIChatMessage }> = ({ message }) => {
    const codeBlocks = extractCodeFromMessage(message.message);
    const textWithoutCode = message.message.replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');
    const parts = textWithoutCode.split('[CODE_BLOCK]');
    
    return (
      <div className={`chat ${message.isUser ? 'chat-end' : 'chat-start'}`}>
        <div className="chat-image avatar">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.isUser ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'
          }`}>
            {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
        </div>
        
        <div className="chat-header">
          <span className="text-sm opacity-70">
            {message.isUser ? 'You' : 'AI Assistant'}
          </span>
          <time className="text-xs opacity-50 ml-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        </div>
        
        <div className={`chat-bubble max-w-md ${
          message.isUser 
            ? 'chat-bubble-primary' 
            : message.message.includes('Error:') 
              ? 'chat-bubble-error' 
              : 'chat-bubble-secondary'
        }`}>
          <div className="space-y-2">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                {part.trim() && (
                  <div className="whitespace-pre-wrap text-sm">
                    {part.trim()}
                  </div>
                )}
                {codeBlocks[index] && (
                  <div className="relative">
                    <CodeBlock code={codeBlocks[index]} />
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => copyToClipboard(codeBlocks[index], `${message.id}-${index}`)}
                        className="btn btn-xs btn-ghost"
                        title="Copy code"
                      >
                        {copiedMessageId === `${message.id}-${index}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {onInsertCode && (
                        <button
                          onClick={() => onInsertCode(codeBlocks[index])}
                          className="btn btn-xs btn-primary"
                          title="Insert code"
                        >
                          Insert
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="btn btn-ghost btn-sm"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Ask me anything about programming!</p>
            <p className="text-sm mt-2">
              • Explain algorithms<br/>
              • Write code snippets<br/>
              • Debug issues<br/>
              • Best practices
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-secondary">
              <div className="flex items-center gap-2">
                <span className="loading loading-dots loading-sm"></span>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about algorithms, request code examples, or get programming help... (Ctrl+Enter to send)"
              className="textarea textarea-bordered w-full resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn btn-primary self-end"
            title="Send message (Ctrl+Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {error && (
          <div className="alert alert-error mt-2">
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <p className="text-xs text-base-content/50 mt-2">
          Press Ctrl+Enter to send • I can see your current code for context
        </p>
      </div>
    </div>
  );
};

export default AiChatPanel;