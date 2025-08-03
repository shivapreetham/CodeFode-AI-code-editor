import React from 'react';
import Editor from "@monaco-editor/react";
import Loading from "@/app/components/ui/loading/Loading";

interface CodeEditorProps {
  activeFile: any;
  isOutputExpand: boolean;
  isCollapsed: boolean;
  theme: string;
  fontSize: number;
  filesContentMap: Map<string, any>;
  onEditorChange: (content: string | undefined) => void;
  onEditorDidMount: (editor: any, monaco: any) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  isOutputExpand,
  isCollapsed,
  theme,
  fontSize,
  filesContentMap,
  onEditorChange,
  onEditorDidMount
}) => {
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
    <div
      className={`w-full h-[93vh] ${
        isCollapsed ? "md:w-[99.5%]" : "md:w-[97%]"
      } md:h-screen transition-all duration-300`}
    >
      <Editor
        height={isOutputExpand ? "60%" : "70%"}
        path={activeFile.name}
        defaultLanguage={activeFile.language}
        defaultValue={activeFile.content}
        onChange={onEditorChange}
        onMount={onEditorDidMount}
        value={filesContentMap.get(activeFile.path)?.content}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          cursorStyle: "line",
          lineNumbersMinChars: 4,
          quickSuggestions: true,
          wordWrap: "on",
          wrappingStrategy: "advanced",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          smoothScrolling: true,
          mouseWheelScrollSensitivity: 1,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <Loading status="Initializing editor..." color="#f29221" />
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor; 