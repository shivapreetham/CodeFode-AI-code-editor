import React from 'react';
import { Sparkles , Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

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

interface AISuggestionsSidebarProps {
  isOpen: boolean;
  aiResponse?: AIResponse;
  isLoading: boolean;
}

const AISuggestionsSidebar = ({ isOpen, aiResponse, isLoading }: AISuggestionsSidebarProps) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 h-screen bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-yellow-400">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">AI Suggestions</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        ) : aiResponse ? (
          <>
            {/* Errors Section */}
            {aiResponse.analysis.errors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-200">Potential Issues</h3>
                {aiResponse.analysis.errors.map((error, idx) => (
                  <div key={idx} className="p-3 bg-red-900/20 border border-red-900 rounded-md">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">{error.title}</span>
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">{error.description}</div>
                    <div className="mt-2 text-sm text-emerald-400">Suggestion: {error.suggestion}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions Section */}
            {aiResponse.analysis.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-200">Improvements</h3>
                {aiResponse.analysis.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-3 bg-blue-900/20 border border-blue-900 rounded-md">
                    <div className="flex items-center gap-2 text-blue-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">{suggestion.title}</span>
                    </div>
                    <div className="mt-2">
                      <pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto">
                        <code>{suggestion.code}</code>
                      </pre>
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">{suggestion.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Next Code Suggestion */}
            {aiResponse.suggestion && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-200">Next Steps</h3>
                <div className="p-3 bg-emerald-900/20 border border-emerald-900 rounded-md">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Suggested Addition</span>
                  </div>
                  <div className="mt-2">
                    <pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto">
                      <code>{aiResponse.suggestion.suggestion}</code>
                    </pre>
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">{aiResponse.suggestion.explanation}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-zinc-500 text-sm text-center">
            Start coding to get AI suggestions
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsSidebar;
