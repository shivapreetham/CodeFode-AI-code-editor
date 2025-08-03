import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { IFile } from '@/interfaces/IFile';
import { Sparkles, FileText, Eye, MessageSquare, Lightbulb } from 'lucide-react';

interface CodeEditorProps {
  activeFile: IFile;
  isOutputExpand: boolean;
  isCollapsed: boolean;
  theme: string;
  fontSize: number;
  filesContentMap: Map<string, IFile>;
  onEditorChange: (content: string | undefined) => void;
  onEditorDidMount: (editor: any, monaco: any) => void;
  aiSuggestions?: string[];
  onVisualizeCode?: () => void;
  onToggleNotes?: () => void;
  showNotes?: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  isOutputExpand,
  isCollapsed,
  theme,
  fontSize,
  filesContentMap,
  onEditorChange,
  onEditorDidMount,
  aiSuggestions = [],
  onVisualizeCode,
  onToggleNotes,
  showNotes = false,
  notes = '',
  onNotesChange
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [showInlineNotes, setShowInlineNotes] = useState(false);

  const editorHeight = isOutputExpand ? '60vh' : '85vh';

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    onEditorDidMount(editor, monaco);
  };

  // Check if we have a valid active file
  if (!activeFile?.name || activeFile.name === "") {
    return (
      <div className="text-xl text-gray-400 flex items-center justify-center h-[93vh] bg-[#1e1e1e]">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">No file is open</p>
          <p className="text-sm text-gray-500 mt-2">Open a file from the file explorer to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {activeFile.name} ({activeFile.language})
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AI Suggestions Toggle */}
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className={`p-2 rounded transition-colors ${
              showAISuggestions 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="Toggle AI Suggestions"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Inline Notes Toggle */}
          <button
            onClick={() => setShowInlineNotes(!showInlineNotes)}
            className={`p-2 rounded transition-colors ${
              showInlineNotes 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="Toggle Inline Notes"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Code Notes Panel */}
          <button
            onClick={onToggleNotes}
            className={`p-2 rounded transition-colors ${
              showNotes 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="Toggle Notes Panel"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Code Visualization */}
          <button
            onClick={onVisualizeCode}
            className="p-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            title="Visualize Code Structure"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex">
        <div className={`${showNotes ? 'w-2/3' : 'w-full'}`}>
          <Editor
            height={editorHeight}
            defaultLanguage={activeFile.language}
            value={filesContentMap.get(activeFile.path)?.content || activeFile.content}
            theme={theme}
            options={{
              fontSize: fontSize,
              minimap: { enabled: true },
              wordWrap: 'on',
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              parameterHints: {
                enabled: true
              },
              hover: {
                enabled: true
              }
            }}
            onMount={handleEditorDidMount}
            onChange={onEditorChange}
          />
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div className="w-1/3 border-l border-gray-700 bg-gray-900">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Code Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add notes about your code here..."
                className="w-full h-full min-h-[400px] p-3 bg-gray-800 text-white border border-gray-600 rounded resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && showAISuggestions && (
        <div className="absolute bottom-4 right-4 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-600">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              AI Suggestions
            </h4>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-3 border-b border-gray-700 last:border-b-0">
                <p className="text-sm text-gray-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor; 