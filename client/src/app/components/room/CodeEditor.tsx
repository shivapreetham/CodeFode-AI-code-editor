import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { IFile } from '@/interfaces/IFile';
import { Sparkles, FileText, Eye, Lightbulb, Plus } from 'lucide-react';

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
  aiResponse?: any;
  onInsertCode?: (code: string) => void;
  onVisualizeCode?: () => void;
  onToggleNotes?: () => void;
  showNotes?: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  onTabChange?: (tabId: number) => void;
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
  aiResponse,
  onInsertCode,
  onVisualizeCode,
  onToggleNotes,
  showNotes = false,
  notes = '',
  onNotesChange,
  onTabChange
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const editorHeight = isOutputExpand ? '60vh' : '85vh';

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Add hover provider for inline notes
    monaco.languages.registerHoverProvider('javascript', {
      provideHover: (model: any, position: any) => {
        const lineNumber = position.lineNumber;
        const lineContent = model.getLineContent(lineNumber);
        
        // Check for note markers like // NOTE: or /* NOTE: */
        const noteMatch = lineContent.match(/(?:\/\/|\/\*)\s*NOTE:\s*(.+?)(?:\*\/)?$/);
        
        if (noteMatch) {
          return {
            contents: [
              { value: '**📝 Code Note:**' },
              { value: noteMatch[1] }
            ]
          };
        }

        return null;
      }
    });

    // Add keyboard shortcuts that work when editor is focused
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      console.log('🎯 Ctrl+I triggered from Monaco editor');
      if (onTabChange) {
        onTabChange(4); // Switch to AI Assistant tab
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      // Only trigger if no text is selected (avoid interfering with copy)
      const selection = editor.getSelection();
      if (selection && selection.isEmpty()) {
        console.log('🎯 Ctrl+C triggered from Monaco editor (no selection)');
        if (onTabChange) {
          onTabChange(2); // Switch to Chat tab
        }
      }
    });

    onEditorDidMount(editor, monaco);
  };

  // Check if we have a valid active file
  if (!activeFile?.name || activeFile.name === "") {
    return (
      <div className="hero min-h-[93vh] bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
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
            <h1 className="text-xl font-medium">No file is open</h1>
            <p className="py-4 opacity-70">Open a file from the file explorer to start coding</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Editor Toolbar */}
      <div className="navbar bg-base-200 min-h-12 px-4">
        <div className="navbar-start">
          <span className="text-sm font-medium">
            {activeFile.name} ({activeFile.language})
          </span>
        </div>
        
        <div className="navbar-end">
          <div className="btn-group">
            {/* Code Notes Panel */}
            <button
              onClick={onToggleNotes}
              className={`btn btn-sm ${
                showNotes 
                  ? 'btn-secondary' 
                  : 'btn-ghost'
              }`}
              title="Toggle Notes Panel"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Code Visualization */}
            <button
              onClick={onVisualizeCode}
              className="btn btn-primary btn-sm"
              title="Visualize Code Structure"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
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
          <div className="w-1/3 border-l border-base-300 bg-base-200 flex flex-col">
            <div className="navbar bg-base-300 min-h-14 px-4">
              <div className="navbar-start">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Code Notes
                </h3>
              </div>
            </div>
            <div className="p-4 border-b border-base-300">
              <div className="badge badge-outline">
                {activeFile.name} - {activeFile.language}
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add notes about your code here...

💡 Tips:
• Use markdown formatting
• Add // NOTE: in your code for inline notes
• Document functions and classes
• Track bugs and improvements"
                className="textarea textarea-bordered w-full h-full min-h-[400px] font-mono text-sm"
              />
            </div>
            <div className="p-4 border-t border-base-300">
              <div className="space-y-1">
                <div className="text-xs opacity-70 flex items-center">
                  <span className="mr-2">💡</span>
                  <span>Use // NOTE: in your code for inline notes</span>
                </div>
                <div className="text-xs opacity-70 flex items-center">
                  <span className="mr-2">📝</span>
                  <span>Notes are saved per file automatically</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CodeEditor; 