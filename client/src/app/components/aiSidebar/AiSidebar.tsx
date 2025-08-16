import React, { useState } from 'react';
import { Sparkles, Bug, Lightbulb, Code, ChevronDown, ChevronUp, CheckCircle, Plus } from 'lucide-react';
import CodeBlock from './codeBlock';

interface Error {
  title: string;
  line: string;
  code: string;
  fixedCode: string;
  description: string;
}

interface Suggestion {
  title: string;
  code: string;
  explanation: string;
}

interface Practice {
  title: string;
  code: string;
  explanation: string;
}

interface AIResponse {
  errors: Error[];
  suggestions: Suggestion[];
  bestPractices: Practice[];
  metadata?: {
    language: string;
    codeLength: number;
    processedAt: string;
  };
}

interface AISuggestionsSidebarProps {
  isOpen: boolean;
  aiResponse?: AIResponse;
  isLoading: boolean;
  error?: string | null;
  onManualTrigger?: () => void;
  onInsertCode?: (code: string) => void;
  isDebouncing?: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  type: 'error' | 'suggestion' | 'practice';
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ExpandedSections {
  errors: boolean;
  suggestions: boolean;
  practices: boolean;
}

const AISuggestionsSidebar: React.FC<AISuggestionsSidebarProps> = ({ 
  isOpen, 
  aiResponse, 
  isLoading,
  error,
  onManualTrigger,
  onInsertCode,
  isDebouncing
}) => {
  if (aiResponse) {
    console.log('🎆 AI Results:', {
      errors: aiResponse.errors?.length || 0,
      suggestions: aiResponse.suggestions?.length || 0,
      practices: aiResponse.bestPractices?.length || 0
    });
  }
  
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    errors: true,
    suggestions: true,
    practices: true
  });

  const toggleSection = (section: keyof ExpandedSections): void => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  const Section: React.FC<SectionProps> = ({ 
    title, 
    icon: Icon, 
    type, 
    children, 
    isExpanded, 
    onToggle 
  }) => (
    <div className="collapse collapse-arrow bg-base-200 mb-4">
      <input type="checkbox" checked={isExpanded} onChange={onToggle} />
      <div className={`collapse-title text-xl font-medium flex items-center gap-2
        ${type === 'error' ? 'border-l-4 border-error' : ''}
        ${type === 'suggestion' ? 'border-l-4 border-info' : ''}
        ${type === 'practice' ? 'border-l-4 border-success' : ''}`}
      >
        <Icon className={`w-5 h-5 
          ${type === 'error' ? 'text-error' : ''}
          ${type === 'suggestion' ? 'text-info' : ''}
          ${type === 'practice' ? 'text-success' : ''}`} 
        />
        <span>{title}</span>
      </div>
      <div className="collapse-content">
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="panel-content">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">AI Code Analysis</h2>
        </div>
        {onManualTrigger && (
          <button
            onClick={onManualTrigger}
            disabled={isLoading}
            className={`btn btn-primary btn-sm ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Now'}
          </button>
        )}
      </div>

      <div className="max-w-full">
        {error ? (
          <div className="alert alert-error">
            <Bug className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p>Analyzing your code...</p>
          </div>
        ) : isDebouncing ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <span className="loading loading-spinner loading-lg text-secondary"></span>
            <p>Preparing analysis...</p>
          </div>
        ) : aiResponse ? (
          <div className="space-y-6">
            {aiResponse.errors && aiResponse.errors.length > 0 && (
              <Section
                title={`Issues Found (${aiResponse.errors.length})`}
                icon={Bug}
                type="error"
                isExpanded={expandedSections.errors}
                onToggle={() => toggleSection('errors')}
              >
                {aiResponse.errors.map((error, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-red-400 font-medium">{error.title}</h4>
                    <p className="text-sm text-zinc-400">Line: {error.line}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-300">{error.description}</p>
                      <div className="bg-red-900/20 p-2 rounded border border-red-500/30">
                        <p className="text-sm text-red-400 font-mono">{error.code}</p>
                      </div>
                      <div className="bg-green-900/20 p-2 rounded border border-green-500/30 relative">
                        <p className="text-sm text-green-400 font-mono">{error.fixedCode}</p>
                        {onInsertCode && (
                          <button
                            onClick={() => onInsertCode(error.fixedCode)}
                            className="btn btn-success btn-xs absolute top-2 right-2"
                            title="Insert this code"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
              <Section
                title={`Suggestions (${aiResponse.suggestions.length})`}
                icon={Lightbulb}
                type="suggestion"
                isExpanded={expandedSections.suggestions}
                onToggle={() => toggleSection('suggestions')}
              >
                {aiResponse.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-blue-400 font-medium">{suggestion.title}</h4>
                      {onInsertCode && suggestion.code && (
                        <button
                          onClick={() => onInsertCode(suggestion.code)}
                          className="btn btn-info btn-xs"
                          title="Insert this code"
                        >
                          <Plus className="w-3 h-3" />
                          Insert
                        </button>
                      )}
                    </div>
                    <CodeBlock code={suggestion.code} />
                    <p className="text-sm text-zinc-300">{suggestion.explanation}</p>
                  </div>
                ))}
              </Section>
            )}

            {aiResponse.bestPractices && aiResponse.bestPractices.length > 0 && (
              <Section
                title={`Best Practices (${aiResponse.bestPractices.length})`}
                icon={CheckCircle}
                type="practice"
                isExpanded={expandedSections.practices}
                onToggle={() => toggleSection('practices')}
              >
                {aiResponse.bestPractices.map((practice, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-green-400 font-medium">{practice.title}</h4>
                      {onInsertCode && practice.code && (
                        <button
                          onClick={() => onInsertCode(practice.code)}
                          className="btn btn-success btn-xs"
                          title="Insert this code"
                        >
                          <Plus className="w-3 h-3" />
                          Insert
                        </button>
                      )}
                    </div>
                    <CodeBlock code={practice.code} />
                    <p className="text-sm text-zinc-300">{practice.explanation}</p>
                  </div>
                ))}
              </Section>
            )}
            
            {/* Show a message if no valid data was found */}
            {(!aiResponse.errors || aiResponse.errors.length === 0) &&
             (!aiResponse.suggestions || aiResponse.suggestions.length === 0) &&
             (!aiResponse.bestPractices || aiResponse.bestPractices.length === 0) && (
              <div className="flex flex-col items-center justify-center p-8 space-y-3 text-yellow-400">
                <Bug className="w-8 h-8" />
                <p className="text-center">Analysis completed but no actionable insights found.</p>
                <p className="text-sm text-zinc-400 text-center">Try analyzing a different file or adding more code.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-green-400">
            <Code className="w-8 h-8 text-green-400" />
            <p>Start coding to get AI-powered suggestions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsSidebar;