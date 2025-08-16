import React, { useCallback } from 'react';
import { X } from "lucide-react";
import { IFile } from '@/interfaces/IFile';

interface FileTabsProps {
  files: IFile[];
  activeFile: IFile | null;
  onFileChange: (file: IFile) => void;
  onFileClose: (e: React.MouseEvent, file: IFile) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({
  files,
  activeFile,
  onFileChange,
  onFileClose
}) => {
  const handleFileChange = useCallback((file: IFile) => {
    try {
      onFileChange(file);
    } catch (error) {
      console.error('Error changing file:', error);
    }
  }, [onFileChange]);

  const handleFileClose = useCallback((e: React.MouseEvent, file: IFile) => {
    try {
      e.stopPropagation();
      onFileClose(e, file);
    } catch (error) {
      console.error('Error closing file:', error);
    }
  }, [onFileClose]);

  if (!files || files.length === 0) {
    return (
      <div className="vscode-tabs-bar">
        <span className="px-4 py-2 text-base" style={{ color: 'hsl(var(--bc) / 0.7)' }}>No files open</span>
      </div>
    );
  }

  return (
    <div className="vscode-tabs-bar">
      {files.map((file, index) => {
        const isActive = activeFile?.path === file.path;
        
        return (
          <div
            key={`${file.path}-${index}`}
            className={`file-tab ${isActive ? 'active' : ''} group`}
            onClick={() => handleFileChange(file)}
            title={`${file.name} - ${file.path}`}
          >
            {/* File icon based on language */}
            <div className={`file-tab-icon ${
              file.language === 'javascript' ? 'bg-yellow-500' :
              file.language === 'typescript' ? 'bg-blue-500' :
              file.language === 'python' ? 'bg-green-500' :
              file.language === 'css' ? 'bg-purple-500' :
              file.language === 'html' ? 'bg-orange-500' :
              'bg-gray-400'
            }`} />
            
            <span className="file-tab-name">{file.name}</span>
            
            <button
              type="button"
              onClick={(e) => handleFileClose(e, file)}
              className="file-tab-close"
              title={`Close ${file.name}`}
              aria-label={`Close ${file.name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileTabs; 