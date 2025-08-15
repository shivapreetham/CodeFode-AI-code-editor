import React, { useCallback } from 'react';
import CloseIcon from "@mui/icons-material/Close";
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
      <div className="h-[5vh] w-full bg-surface dark:bg-surface-dark border-b border-secondary-300 dark:border-secondary-700 flex items-center justify-center">
        <span className="text-secondary-theme text-sm">No files open</span>
      </div>
    );
  }

  return (
    <div 
      className="h-[5vh] w-full flex overflow-x-auto bg-surface dark:bg-surface-dark border-b border-secondary-300 dark:border-secondary-700"
      role="tablist"
      aria-label="Open files"
    >
      {files.map((file, index) => {
        const isActive = activeFile?.path === file.path;
        
        return (
          <button
            key={`${file.path}-${index}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${file.path}`}
            onClick={() => handleFileChange(file)}
            className={`
              group relative flex items-center gap-2 px-4 py-2 text-sm border-r border-secondary-300 dark:border-secondary-700 min-w-fit max-w-48
              transition-all duration-200 hover:bg-primary-50 dark:hover:bg-primary-950
              ${isActive
                ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900 border-b-2 border-primary-500"
                : "text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
              }
            `}
            title={`${file.name} - ${file.path}`}
          >
            {/* File icon based on language */}
            <div className={`w-2 h-2 rounded-full ${
              file.language === 'javascript' ? 'bg-yellow-500' :
              file.language === 'typescript' ? 'bg-blue-500' :
              file.language === 'python' ? 'bg-green-500' :
              file.language === 'css' ? 'bg-purple-500' :
              file.language === 'html' ? 'bg-orange-500' :
              'bg-secondary-400'
            }`} />
            
            <span className="truncate flex-1 text-left">{file.name}</span>
            
            <button
              type="button"
              onClick={(e) => handleFileClose(e, file)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-light hover:text-error transition-all duration-200"
              title={`Close ${file.name}`}
              aria-label={`Close ${file.name}`}
            >
              <CloseIcon sx={{ fontSize: "14px" }} />
            </button>
          </button>
        );
      })}
    </div>
  );
};

export default FileTabs; 