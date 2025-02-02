import React, { useState } from 'react';
import { Sparkles, Bug, Lightbulb, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface Error {
  title: string;
  description: string;
  suggestion: string;
}

interface Suggestion {
  title: string;
  code: string;
  explanation: string;
}

interface AIResponse {
  analysis: {
    errors: Error[];
    suggestions: Suggestion[];
  };
  suggestion: {
    suggestion: string;
    explanation: string;
  } | null;
  timestamp: string;
}

interface AISuggestionsSidebarProps {
  isOpen: boolean;
  aiResponse?: AIResponse;
  isLoading: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  type: 'error' | 'suggestion' | 'improvement';
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

interface CodeBlockProps {
  code: string;
}

interface ExpandedSections {
  errors: boolean;
  suggestions: boolean;
  improvements: boolean;
}

const AISuggestionsSidebar: React.FC<AISuggestionsSidebarProps> = ({ 
  isOpen, 
  aiResponse, 
  isLoading 
}) => {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    errors: true,
    suggestions: true,
    improvements: true
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
    <div className="mb-4 bg-zinc-800/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full p-3 flex items-center justify-between text-left
          ${type === 'error' ? 'bg-red-900/20' : ''}
          ${type === 'suggestion' ? 'bg-blue-900/20' : ''}
          ${type === 'improvement' ? 'bg-emerald-900/20' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 
            ${type === 'error' ? 'text-red-400' : ''}
            ${type === 'suggestion' ? 'text-blue-400' : ''}
            ${type === 'improvement' ? 'text-emerald-400' : ''}`} 
          />
          <span className="font-medium text-zinc-100">{title}</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => (
    <div className="relative group">
      <pre className="text-sm bg-black/50 p-3 rounded-md overflow-x-auto">
        <code className="text-zinc-200">{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="w-96 h-screen bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">AI Code Analysis</h2>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400">Analyzing your code...</p>
          </div>
        ) : aiResponse ? (
          <div className="space-y-6">
            {aiResponse.analysis.errors.length > 0 && (
              <Section
                title={`Issues Found (${aiResponse.analysis.errors.length})`}
                icon={Bug}
                type="error"
                isExpanded={expandedSections.errors}
                onToggle={() => toggleSection('errors')}
              >
                {aiResponse.analysis.errors.map((error, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-red-400 font-medium">{error.title}</h4>
                    <p className="text-sm text-zinc-300">{error.description}</p>
                    <div className="text-sm text-emerald-400">{error.suggestion}</div>
                  </div>
                ))}
              </Section>
            )}

            {aiResponse.analysis.suggestions.length > 0 && (
              <Section
                title={`Suggestions (${aiResponse.analysis.suggestions.length})`}
                icon={Lightbulb}
                type="suggestion"
                isExpanded={expandedSections.suggestions}
                onToggle={() => toggleSection('suggestions')}
              >
                {aiResponse.analysis.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-blue-400 font-medium">{suggestion.title}</h4>
                    <CodeBlock code={suggestion.code} />
                    <p className="text-sm text-zinc-300">{suggestion.explanation}</p>
                  </div>
                ))}
              </Section>
            )}

            {aiResponse.suggestion && (
              <Section
                title="Recommended Improvement"
                icon={Code}
                type="improvement"
                isExpanded={expandedSections.improvements}
                onToggle={() => toggleSection('improvements')}
              >
                <div className="space-y-2">
                  <CodeBlock code={aiResponse.suggestion.suggestion} />
                  <p className="text-sm text-zinc-300">{aiResponse.suggestion.explanation}</p>
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-zinc-400">
            <Code className="w-8 h-8" />
            <p>Start coding to get AI-powered suggestions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsSidebar;