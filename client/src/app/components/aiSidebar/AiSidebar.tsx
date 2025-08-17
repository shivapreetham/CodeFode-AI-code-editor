import React, { useState } from 'react';
import { Sparkles, Bug, Lightbulb, Code, ChevronDown, ChevronUp, CheckCircle, Plus, MessageSquare, FileText } from 'lucide-react';
import CodeBlock from './codeBlock';
import AiChatPanel from './AiChatPanel';

interface LineCorrection {
  title: string;
  startLine: number;
  endLine: number;
  severity: 'error' | 'warning' | 'info';
  originalCode: string;
  correctedCode: string;
  explanation: string;
}

interface Suggestion {
  title: string;
  targetLines?: number[];
  code: string;
  explanation: string;
}

interface Practice {
  title: string;
  appliesTo: 'function' | 'variable' | 'structure' | 'general';
  code: string;
  explanation: string;
}

interface CodeQuality {
  score: number;
  issues: string[];
  suggestions: string[];
}

interface AIResponse {
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

interface AISuggestionsSidebarProps {
  isOpen: boolean;
  aiResponse?: AIResponse;
  isLoading: boolean;
  error?: string | null;
  onManualTrigger?: () => void;
  onInsertCode?: (code: string) => void;
  onInsertLineCorrection?: (correction: LineCorrection) => void;
  isDebouncing?: boolean;
  currentCode?: string;
  currentLanguage?: string;
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
  lineCorrections: boolean;
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
  onInsertLineCorrection,
  isDebouncing,
  currentCode,
  currentLanguage
}) => {
  if (aiResponse) {
    console.log('🎆 AI Results:', {
      lineCorrections: aiResponse.lineCorrections?.length || 0,
      suggestions: aiResponse.suggestions?.length || 0,
      practices: aiResponse.bestPractices?.length || 0,
      qualityScore: aiResponse.codeQuality?.score || 0
    });
  }
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    lineCorrections: true,
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
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        {activeTab === 'analysis' && onManualTrigger && (
          <button
            onClick={onManualTrigger}
            disabled={isLoading}
            className={`btn btn-primary btn-sm ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Now'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-4">
        <button
          className={`tab ${activeTab === 'analysis' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Code Analysis
        </button>
        <button
          className={`tab ${activeTab === 'chat' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          AI Chat
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-w-full">
        {activeTab === 'chat' ? (
          <AiChatPanel
            currentCode={currentCode}
            currentLanguage={currentLanguage}
            onInsertCode={onInsertCode}
          />
        ) : (
          // Code Analysis Tab
          <>
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
            {/* Code Quality Score */}
            {aiResponse.codeQuality && (
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Code Quality Score</span>
                  <span className={`text-lg font-bold ${
                    aiResponse.codeQuality.score >= 80 ? 'text-success' : 
                    aiResponse.codeQuality.score >= 60 ? 'text-warning' : 'text-error'
                  }`}>
                    {aiResponse.codeQuality.score}/100
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      aiResponse.codeQuality.score >= 80 ? 'bg-success' : 
                      aiResponse.codeQuality.score >= 60 ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${aiResponse.codeQuality.score}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Line-Specific Corrections */}
            {aiResponse.lineCorrections && aiResponse.lineCorrections.length > 0 && (
              <Section
                title={`Line Corrections (${aiResponse.lineCorrections.length})`}
                icon={Bug}
                type="error"
                isExpanded={expandedSections.lineCorrections}
                onToggle={() => toggleSection('lineCorrections')}
              >
                {aiResponse.lineCorrections.map((correction, idx) => (
                  <div key={idx} className="space-y-3 border border-base-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        correction.severity === 'error' ? 'text-error' :
                        correction.severity === 'warning' ? 'text-warning' : 'text-info'
                      }`}>
                        {correction.title}
                      </h4>
                      <span className={`badge ${
                        correction.severity === 'error' ? 'badge-error' :
                        correction.severity === 'warning' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {correction.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-base-content/70">
                      Lines {correction.startLine}-{correction.endLine}
                    </p>
                    
                    <p className="text-sm">{correction.explanation}</p>
                    
                    {/* Original Code */}
                    <div className="space-y-1">
                      <p className="text-xs text-error font-medium">Original:</p>
                      <div className="bg-error/10 p-2 rounded border border-error/30">
                        <pre className="text-sm text-error font-mono whitespace-pre-wrap">
                          {correction.originalCode}
                        </pre>
                      </div>
                    </div>
                    
                    {/* Corrected Code */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-success font-medium">Corrected:</p>
                        {onInsertLineCorrection && (
                          <button
                            onClick={() => onInsertLineCorrection(correction)}
                            className="btn btn-success btn-xs"
                            title="Apply this correction to specific lines"
                          >
                            <Plus className="w-3 h-3" />
                            Fix Lines {correction.startLine}-{correction.endLine}
                          </button>
                        )}
                      </div>
                      <div className="bg-success/10 p-2 rounded border border-success/30">
                        <pre className="text-sm text-success font-mono whitespace-pre-wrap">
                          {correction.correctedCode}
                        </pre>
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
                  <div key={idx} className="space-y-2 border border-base-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-info font-medium">{suggestion.title}</h4>
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
                    
                    {suggestion.targetLines && suggestion.targetLines.length > 0 && (
                      <p className="text-sm text-base-content/70">
                        Recommended for lines: {suggestion.targetLines.join(', ')}
                      </p>
                    )}
                    
                    <CodeBlock code={suggestion.code} />
                    <p className="text-sm text-base-content/80">{suggestion.explanation}</p>
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
        </>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsSidebar;