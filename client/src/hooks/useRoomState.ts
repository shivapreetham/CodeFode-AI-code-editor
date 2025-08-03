import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { workspaceApi } from '@/services/workspaceApi';
import { addNotification, createNotificationMessage, getNotifications } from '@/services/notificationApi';
import { getFileLanguage } from '@/app/helpers/getFileLanguage';
import { ACTIONS } from '@/app/helpers/Actions';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';
import { IFile } from '@/interfaces/IFile';
import { IFileExplorerNode } from '@/interfaces/IFileExplorerNode';
import { Notification, NotificationType } from '@/interfaces/Notifications';

const filesContentMap = new Map<string, IFile>();

const DEFAULT_FILE: IFile = {
  name: "index.js",
  language: "javascript",
  content: `console.log(\`Happy Coding\`)`,
  path: "/root/index.js",
};

const DEFAULT_EXPLORER: IFileExplorerNode = {
  id: uuid(),
  name: "root",
  isFolder: true,
  path: "/root",
  nodes: [
    {
      id: uuid(),
      name: "index.js",
      isFolder: false,
      nodes: [],
      path: "/root/index.js",
    },
  ],
};

export const useRoomState = (roomId: string | undefined, username: string | null, socketRef: any) => {
  const [clients, setClients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeFile, setActiveFile] = useState<IFile>({
    name: "",
    content: "",
    language: "",
    path: "",
  });
  const [files, setFiles] = useState<IFile[]>([]);
  const [fileExplorerData, setFileExplorerData] = useState<IFileExplorerNode>(DEFAULT_EXPLORER);
  const [isFileExplorerUpdated, setIsFileExplorerUpdated] = useState(false);
  const [isOutputExpand, setIsOutputExpand] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeOutput, setCodeOutput] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const handleTabChange = useCallback((tabId: number) => {
    setActiveTab(tabId);
  }, []);

  const handleToggleOutputVisibility = useCallback(() => {
    setIsOutputExpand(!isOutputExpand);
  }, [isOutputExpand]);

  const handleAddNotification = useCallback(async (
    type: NotificationType,
    details: { username: string; fileName?: string; folderName?: string; path?: string }
  ) => {
    if (!roomId || roomId.trim() === '') {
      return; // Don't add notification if roomId is invalid
    }
    
    try {
      const message = createNotificationMessage(type, details);
      const metadata = {
        path: details.path,
        language: details.fileName ? getFileLanguage(details.fileName) : undefined,
      };

      const newNotification = await addNotification(roomId, {
        type,
        message,
        username: details.username,
        metadata
      });

      const typedNotification: Notification = {
        type: newNotification.type,
        message: newNotification.message,
        username: newNotification.username,
        timestamp: new Date(newNotification.timestamp),
        metadata: newNotification.metadata
      };

      setNotifications(prev => [typedNotification, ...prev]);
      
      socketRef?.current?.emit(ACTIONS.NOTIFICATION_ADDED, {
        roomId,
        notification: typedNotification
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [roomId, socketRef]);

  const handleCloseFile = useCallback((e: React.MouseEvent, file: IFile) => {
    e.stopPropagation();
    const updatedOpenFiles = files.filter(
      (currentFile) => currentFile.path !== file.path
    );
    const updatedActiveFile: IFile =
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
    
    if (username) {
      handleAddNotification('FILE_UPDATE', {
        username,
        fileName: activeFile.name,
        path: activeFile.path
      });
    }

    if (roomId && roomId.trim() !== '') {
      const dataPayload = {
        fileExplorerData,
        openFiles: updatedOpenFiles,
        activeFile: updatedActiveFile,
      };
      socketRef?.current?.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        payload: dataPayload,
      });
    }
  }, [files, activeFile, fileExplorerData, roomId, socketRef, username, handleAddNotification]);

  const handleChangeActiveFile = useCallback((file: IFile) => {
    setActiveFile(file);
  }, []);

  const handleRunCode = useCallback(async () => {
    const data = {
      code: filesContentMap.get(activeFile.path)?.content,
      language: activeFile.language,
      extension: activeFile.name.split(".")[1],
    };

    if (!["cpp", "py", "js"].includes(data.extension)) {
      toast.error(
        `Unsupported programming language (${data.language}). Supported languages are C++, Python, and JavaScript.`
      );
      return;
    }

    if (username) {
      handleAddNotification('CODE_EXECUTE', {
        username,
        fileName: activeFile.name,
        path: activeFile.path
      });
    }

    setCodeStatus("");
    try {
      setLoading(true);
      if (!socketRef || !socketRef.current) {
        toast.error("Failed to connect to websocket");
        setLoading(false);
        return;
      }
      socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
        language: data.language,
        code: data.code,
      });
    } catch (error) {
      console.log(error);
      toast.error("Internal server error!");
      setLoading(false);
    }
  }, [activeFile, username, handleAddNotification, socketRef]);

  const debouncedSaveAndEmit = useDebounceCallback(
    useCallback((
      content: string,
      activeFile: IFile,
      fileExplorerData: IFileExplorerNode,
      files: IFile[]
    ) => {
      if (!roomId || roomId.trim() === '') {
        return; // Don't save or emit if roomId is invalid
      }

      const updatedActiveFile: IFile = {
        ...activeFile,
        content: content,
      };

      filesContentMap.set(activeFile.path, updatedActiveFile);
      const dataPayload = {
        fileExplorerData,
        openFiles: files,
        activeFile: updatedActiveFile,
      };

      // Emit changes
      socketRef?.current?.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        payload: dataPayload,
      });

      // Save workspace
      workspaceApi
        .saveWorkspace(roomId, dataPayload, filesContentMap)
        .catch((error) => console.error("Error saving workspace:", error));
    }, [roomId, socketRef]),
    1500
  );

  const handleEditorChange = useCallback((content: string | undefined) => {
    if (content === undefined) return;
    debouncedSaveAndEmit(content, activeFile, fileExplorerData, files);
  }, [debouncedSaveAndEmit, activeFile, fileExplorerData, files]);

  const handleCodeChange = useCallback((payload: any) => {
    if (payload.codeOutputData) {
      setCodeOutput(payload.codeOutputData.output);
      setCodeStatus(payload.codeOutputData.status);
      setLoading(
        ["loading", "pending"].includes(payload.codeOutputData.status)
      );
      ["success", "failed"].includes(payload.codeOutputData.status) &&
        setIsOutputExpand(true);
    } else {
      setFileExplorerData(payload.fileExplorerData);
      setFiles(payload.openFiles);
      filesContentMap.set(payload.activeFile.path, payload.activeFile);
    }
  }, []);

  const handleCodeResult = useCallback((result: any) => {
    setLoading(false);
    setCodeOutput(result.output);
  }, []);

  const handleRefreshNotifications = useCallback(async () => {
    if (roomId && roomId.trim() !== '') {
      const refreshedNotifications = await getNotifications(roomId);
      setNotifications(refreshedNotifications);
    }
  }, [roomId]);

  // Load workspace on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        const workspace = await workspaceApi.getWorkspace(roomId);

        if (workspace && workspace.filesContentMap) {
          setFileExplorerData(workspace.fileExplorerData);
          setFiles(workspace.openFiles);
          setActiveFile(workspace.activeFile);

          // Clear and update filesContentMap
          filesContentMap.clear();
          workspace.filesContentMap.forEach((file: IFile, path: string) => {
            filesContentMap.set(path, file);
          });
        } else {
          // Set defaults for new workspace
          setFileExplorerData(DEFAULT_EXPLORER);
          setFiles([DEFAULT_FILE]);
          setActiveFile(DEFAULT_FILE);
          filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
        }
      } catch (error) {
        console.error("Error loading workspace:", error);
        // Set defaults on error
        setFileExplorerData(DEFAULT_EXPLORER);
        setFiles([DEFAULT_FILE]);
        setActiveFile(DEFAULT_FILE);
        filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && roomId.trim() !== '') {
      loadWorkspace();
    }
  }, [roomId]);

  // Save workspace when file explorer is updated
  useEffect(() => {
    if (isFileExplorerUpdated && socketRef?.current && roomId && roomId.trim() !== '') {
      const dataPayload = {
        fileExplorerData,
        openFiles: files,
        activeFile,
      };

      // Save to backend
      workspaceApi
        .saveWorkspace(roomId, dataPayload, filesContentMap)
        .catch((error) => console.error("Error saving workspace:", error));

      // Emit to other clients
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        payload: dataPayload,
      });

      setIsFileExplorerUpdated(false);
    }
  }, [isFileExplorerUpdated, fileExplorerData, files, activeFile, roomId, socketRef]);

  return {
    // State
    clients,
    activeTab,
    activeFile,
    files,
    fileExplorerData,
    isFileExplorerUpdated,
    isOutputExpand,
    loading,
    codeOutput,
    codeStatus,
    notifications,
    isCollapsed,
    filesContentMap,

    // Setters
    setClients,
    setActiveFile,
    setFiles,
    setFileExplorerData,
    setIsFileExplorerUpdated,
    setNotifications,

    // Handlers
    toggleSidebar,
    handleTabChange,
    handleToggleOutputVisibility,
    handleAddNotification,
    handleCloseFile,
    handleChangeActiveFile,
    handleRunCode,
    handleEditorChange,
    handleCodeChange,
    handleCodeResult,
    handleRefreshNotifications,
  };
}; 