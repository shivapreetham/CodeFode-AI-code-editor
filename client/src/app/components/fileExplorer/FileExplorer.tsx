import React, { Dispatch, SetStateAction, useEffect, useCallback } from "react";
import { useTraverseTree } from "@/hooks/useTraverseTree";
import FileExplorerNode from "./FileExplorerNode";
import { Typography } from "@mui/material";
import { IFileExplorerNode } from "@/interfaces/IFileExplorerNode";
import { IFile } from "@/interfaces/IFile";
import { workspaceApi } from "@/services/workspaceApi";



interface FileExplorerProps {
  fileExplorerData: IFileExplorerNode;
  setFileExplorerData: Dispatch<SetStateAction<IFileExplorerNode>>;
  activeFile: IFile;
  setActiveFile: Dispatch<SetStateAction<IFile>>;
  files: IFile[];
  setFiles: Dispatch<SetStateAction<IFile[]>>;
  isFileExplorerUpdated: boolean;
  setIsFileExplorerUpdated: Dispatch<SetStateAction<boolean>>;
  roomId: string;
  filesContentMap: Map<string, IFile>;
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
  roomId,
  filesContentMap
}: FileExplorerProps) {
  const { insertNode, deleteNode, renameNode, moveNode } = useTraverseTree();

  const saveWorkspaceChanges = useCallback(async () => {
    const payload = {
      fileExplorerData,
      openFiles: files,
      activeFile,
    };
    try {
      await workspaceApi.saveWorkspace(roomId, payload, filesContentMap);
      setIsFileExplorerUpdated(false);
    } catch (error) {
      console.error('Error saving workspace:', error);
    }
  }, [fileExplorerData, files, activeFile, roomId, filesContentMap, setIsFileExplorerUpdated]);

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
    setIsFileExplorerUpdated(true);
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
      setIsFileExplorerUpdated(true);
    }
  };

  const handleRename = (nodeId: string, newName: string) => {
    const updatedFileExplorerData = renameNode(nodeId, newName, fileExplorerData);
    setFileExplorerData(updatedFileExplorerData);
    
    const updatedFiles = files.map(file => {
      if (file.path.includes(nodeId)) {
        const newPath = file.path.replace(file.name, newName);
        return { ...file, name: newName, path: newPath };
      }
      return file;
    });
    setFiles(updatedFiles);

    if (activeFile.path.includes(nodeId)) {
      const newPath = activeFile.path.replace(activeFile.name, newName);
      setActiveFile({ ...activeFile, name: newName, path: newPath });
    }
    setIsFileExplorerUpdated(true);
  };

  const handleMove = (sourceId: string, targetId: string) => {
    const updatedFileExplorerData = moveNode(sourceId, targetId, fileExplorerData);
    if (updatedFileExplorerData !== null) {
      setFileExplorerData(updatedFileExplorerData);
      
      const findNewPath = (node: IFileExplorerNode): string | null => {
        if (node.id === sourceId) return node.path;
        for (const child of node.nodes) {
          const path = findNewPath(child);
          if (path) return path;
        }
        return null;
      };

      const newPath = findNewPath(updatedFileExplorerData);
      if (newPath) {
        const updatedFiles = files.map(file => {
          if (file.path.includes(sourceId)) {
            return { ...file, path: newPath };
          }
          return file;
        });
        setFiles(updatedFiles);

        if (activeFile.path.includes(sourceId)) {
          setActiveFile({ ...activeFile, path: newPath });
        }
      }
      setIsFileExplorerUpdated(true);
    }
  };

  useEffect(() => {
    if (isFileExplorerUpdated) {
      saveWorkspaceChanges();
    }
  }, [isFileExplorerUpdated, saveWorkspaceChanges]);

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
        handleRename={handleRename}
        handleMove={handleMove}
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