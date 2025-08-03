import React, { useState, useEffect, useCallback } from 'react';
import { IFile } from '@/interfaces/IFile';
import { IFileExplorerNode } from '@/interfaces/IFileExplorerNode';
import { Network, GitBranch, FileCode, Code, ArrowRight, X } from 'lucide-react';

interface CodeVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  files: IFile[];
  fileExplorerData: IFileExplorerNode;
  filesContentMap: Map<string, IFile>;
}

interface FunctionNode {
  name: string;
  line: number;
  type: 'function' | 'class' | 'method';
  dependencies: string[];
}

interface FileNode {
  name: string;
  path: string;
  functions: FunctionNode[];
  imports: string[];
  exports: string[];
}

const CodeVisualization: React.FC<CodeVisualizationProps> = ({
  isOpen,
  onClose,
  files,
  fileExplorerData,
  filesContentMap
}) => {
  const [selectedView, setSelectedView] = useState<'files' | 'functions' | 'dependencies'>('files');
  const [parsedFiles, setParsedFiles] = useState<FileNode[]>([]);

  const parseCodeStructure = useCallback(() => {
    const parsed: FileNode[] = [];

    files.forEach(file => {
      const content = filesContentMap.get(file.path)?.content || file.content;
      if (!content) return;

      const functions: FunctionNode[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      // Parse functions and classes
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Function declarations
        if (trimmedLine.match(/^(export\s+)?(async\s+)?function\s+(\w+)/)) {
          const match = trimmedLine.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
          if (match) {
            functions.push({
              name: match[3],
              line: index + 1,
              type: 'function',
              dependencies: []
            });
          }
        }
        
        // Class declarations
        if (trimmedLine.match(/^(export\s+)?class\s+(\w+)/)) {
          const match = trimmedLine.match(/^(export\s+)?class\s+(\w+)/);
          if (match) {
            functions.push({
              name: match[2],
              line: index + 1,
              type: 'class',
              dependencies: []
            });
          }
        }
        
        // Method declarations
        if (trimmedLine.match(/^\s*(\w+)\s*\([^)]*\)\s*{/)) {
          const match = trimmedLine.match(/^\s*(\w+)\s*\([^)]*\)\s*{/);
          if (match && !trimmedLine.includes('function') && !trimmedLine.includes('class')) {
            functions.push({
              name: match[1],
              line: index + 1,
              type: 'method',
              dependencies: []
            });
          }
        }
        
        // Import statements
        if (trimmedLine.match(/^import\s+.+from\s+['"]([^'"]+)['"]/)) {
          const match = trimmedLine.match(/^import\s+.+from\s+['"]([^'"]+)['"]/);
          if (match) {
            imports.push(match[1]);
          }
        }
        
        // Export statements
        if (trimmedLine.match(/^export\s+(const|let|var|function|class)\s+(\w+)/)) {
          const match = trimmedLine.match(/^export\s+(const|let|var|function|class)\s+(\w+)/);
          if (match) {
            exports.push(match[2]);
          }
        }
      });

      parsed.push({
        name: file.name,
        path: file.path,
        functions,
        imports,
        exports
      });
    });

    setParsedFiles(parsed);
  }, [files, filesContentMap]);

  useEffect(() => {
    if (isOpen) {
      parseCodeStructure();
    }
  }, [isOpen, parseCodeStructure]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Code Visualization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 p-4 border-b border-gray-700">
          <button
            onClick={() => setSelectedView('files')}
            className={`px-4 py-2 rounded transition-colors ${
              selectedView === 'files'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileCode className="w-4 h-4 inline mr-2" />
            Files
          </button>
          <button
            onClick={() => setSelectedView('functions')}
            className={`px-4 py-2 rounded transition-colors ${
              selectedView === 'functions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Functions
          </button>
          <button
            onClick={() => setSelectedView('dependencies')}
            className={`px-4 py-2 rounded transition-colors ${
              selectedView === 'dependencies'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <GitBranch className="w-4 h-4 inline mr-2" />
            Dependencies
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-full overflow-auto">
          {selectedView === 'files' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">File Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold text-white">{file.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">{file.functions.length} functions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">{file.imports.length} imports</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">{file.exports.length} exports</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedView === 'functions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Function Hierarchy</h3>
              {parsedFiles.map((file, fileIndex) => (
                <div key={fileIndex} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <FileCode className="w-5 h-5 mr-2 text-blue-400" />
                    {file.name}
                  </h4>
                  <div className="space-y-2">
                    {file.functions.map((func, funcIndex) => (
                      <div key={funcIndex} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                        <div className={`w-3 h-3 rounded-full ${
                          func.type === 'function' ? 'bg-green-400' :
                          func.type === 'class' ? 'bg-blue-400' : 'bg-yellow-400'
                        }`} />
                        <span className="text-gray-300 font-mono">{func.name}</span>
                        <span className="text-gray-500 text-sm">line {func.line}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          func.type === 'function' ? 'bg-green-900 text-green-300' :
                          func.type === 'class' ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {func.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedView === 'dependencies' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Import/Export Dependencies</h3>
              {parsedFiles.map((file, fileIndex) => (
                <div key={fileIndex} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <FileCode className="w-5 h-5 mr-2 text-blue-400" />
                    {file.name}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Imports ({file.imports.length})
                      </h5>
                      <div className="space-y-1">
                        {file.imports.map((imp, impIndex) => (
                          <div key={impIndex} className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded">
                            {imp}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-purple-400 mb-2 flex items-center">
                        <GitBranch className="w-4 h-4 mr-1" />
                        Exports ({file.exports.length})
                      </h5>
                      <div className="space-y-1">
                        {file.exports.map((exp, expIndex) => (
                          <div key={expIndex} className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded">
                            {exp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeVisualization; 