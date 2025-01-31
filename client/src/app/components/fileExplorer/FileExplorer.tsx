import React, { Dispatch, SetStateAction } from "react";
import { useTraverseTree } from "@/hooks/useTraverseTree";
import FileExplorerNode from "./FileExplorerNode";
import { Typography } from "@mui/material";
import { IFileExplorerNode } from "@/interfaces/IFileExplorerNode";
import { IFile } from "@/interfaces/IFile";

interface FileExplorerProps {
  fileExplorerData: IFileExplorerNode;
  setFileExplorerData: Dispatch<SetStateAction<IFileExplorerNode>>;
  activeFile: IFile;
  setActiveFile: Dispatch<SetStateAction<IFile>>;
  files: IFile[];
  setFiles: Dispatch<SetStateAction<IFile[]>>;
  isFileExplorerUpdated: boolean;
  setIsFileExplorerUpdated: Dispatch<SetStateAction<boolean>>;
}

function FileExplorer({
  fileExplorerData,
  setFileExplorerData,
  activeFile,
  setActiveFile,
  files,
  setFiles,
  isFileExplorerUpdated,
  setIsFileExplorerUpdated,
}: FileExplorerProps) {
  const { insertNode, deleteNode } = useTraverseTree();

  const handleInsertNode = (
    folderId: string,
    item: string,
    isFolder: boolean
  ) => {
    const updatedFileExplorerData = insertNode(
      fileExplorerData,
      folderId,
      item,
      isFolder
    );
    setFileExplorerData(updatedFileExplorerData);
  };

  const handleDeleteNode = (nodeId: string, nodePath: string) => {
    const updatedFileExplorerData = deleteNode(nodeId, fileExplorerData);
    if (updatedFileExplorerData !== null) {
      setFileExplorerData(updatedFileExplorerData);

      const updatedOpenFiles = files.filter((file) => file.path !== nodePath);
      const updatedActiveFile =
        updatedOpenFiles.length > 0
          ? updatedOpenFiles[0]
          : {
              name: "",
              content: "",
              language: "",
              path: "",
            };
      setActiveFile(updatedActiveFile);
      setFiles(updatedOpenFiles);
      setIsFileExplorerUpdated(true)
    }
  };

  return (
    <div className="text-[#aaaaaa] p-4">
      <Typography
        variant="h6"
        component="h6"
        className="border-b border-[#aaaaa] pb-1 mb-2"
      >
        EDITOR
      </Typography>
      <FileExplorerNode
        handleInsertNode={handleInsertNode}
        handleDeleteNode={handleDeleteNode}
        fileExplorerNode={fileExplorerData}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        files={files}
        setFiles={setFiles}
        isFileExplorerUpdated={isFileExplorerUpdated}
        setIsFileExplorerUpdated={setIsFileExplorerUpdated}
      />
    </div>
  );
}

export default FileExplorer;
