import React from 'react';
import CloseIcon from "@mui/icons-material/Close";

interface FileTabsProps {
  files: any[];
  activeFile: any;
  onFileChange: (file: any) => void;
  onFileClose: (e: React.MouseEvent, file: any) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({
  files,
  activeFile,
  onFileChange,
  onFileClose
}) => {
  return (
    <div className="h-[5vh] w-full flex overflow-x-auto mb-2 bg-[#1e1e1e] border-b border-gray-700">
      {files.map((file, index) => (
        <div
          key={file.path + index}
          onClick={() => onFileChange(file)}
          className={`
            cursor-pointer flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-700 min-w-fit
            transition-all duration-200
            ${activeFile.path === file.path
              ? "text-yellow-400 bg-[#2d2d2d] border-b-2 border-yellow-400"
              : "text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
            }
          `}
        >
          <span className="truncate max-w-[120px]">{file.name}</span>
          <CloseIcon
            onClick={(e) => onFileClose(e, file)}
            className="cursor-pointer hover:text-red-400 transition-colors duration-200"
            sx={{ fontSize: "16px" }}
          />
        </div>
      ))}
    </div>
  );
};

export default FileTabs; 