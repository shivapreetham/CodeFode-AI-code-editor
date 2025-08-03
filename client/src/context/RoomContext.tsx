'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { workspaceApi } from '@/services/workspaceApi';
import { addNotification, createNotificationMessage, getNotifications } from '@/services/notificationApi';
import { getFileLanguage } from '@/app/helpers/getFileLanguage';
import { ACTIONS } from '@/app/helpers/Actions';
import { initSocket } from '@/socket';
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

interface RoomContextType {
  // State
  clients: any[];
  activeTab: number;
  activeFile: IFile;
  files: IFile[];
  fileExplorerData: IFileExplorerNode;
  isFileExplorerUpdated: boolean;
  isOutputExpand: boolean;
  loading: boolean;
  codeOutput: string;
  codeStatus: string;
  notifications: Notification[];
  isCollapsed: boolean;
  filesContentMap: Map<string, IFile>;

  // Setters
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveFile: React.Dispatch<React.SetStateAction<IFile>>;
  setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
  setFileExplorerData: React.Dispatch<React.SetStateAction<IFileExplorerNode>>;
  setIsFileExplorerUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  // Handlers
  toggleSidebar: () => void;
  handleTabChange: (tabId: number) => void;
  handleToggleOutputVisibility: () => void;
  handleAddNotification: (type: NotificationType, details: { username: string; fileName?: string; folderName?: string; path?: string }) => Promise<void>;
  handleCloseFile: (e: React.MouseEvent, file: IFile) => void;
  handleChangeActiveFile: (file: IFile) => void;
  handleRunCode: () => Promise<void>;
  handleEditorChange: (content: string | undefined) => void;
  handleCodeChange: (payload: any) => void;
  handleCodeResult: (result: any) => void;
  handleRefreshNotifications: () => Promise<void>;

  // Room info
  roomId: string;
  username: string;
  isInitialized: boolean;
  socketRef: React.MutableRefObject<any>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: React.ReactNode;
  roomId: string;  // Changed from string | undefined
  username: string; // Changed from string | null
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children, roomId, username }) => {
  console.log('🔍 DEBUG: RoomProvider initialized with:', { roomId, username });
  
  // Validate props immediately
  if (!roomId || roomId === 'undefined' || !username) {
    console.error('❌ ERROR: Invalid room parameters in RoomProvider');
    throw new Error(`Invalid room parameters: roomId=${roomId}, username=${username}`);
  }

  const [isInitialized, setIsInitialized] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const socketRef = useRef<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeFile, setActiveFile] = useState<IFile>(DEFAULT_FILE);
  const [files, setFiles] = useState<IFile[]>([DEFAULT_FILE]);
  const [fileExplorerData, setFileExplorerData] = useState<IFileExplorerNode>(DEFAULT_EXPLORER);
  const [isFileExplorerUpdated, setIsFileExplorerUpdated] = useState(false);
  const [isOutputExpand, setIsOutputExpand] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeOutput, setCodeOutput] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize default file in map
  useEffect(() => {
    if (filesContentMap.size === 0) {
      filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
    }
  }, []);

  // Socket initialization - separate from workspace loading
  useEffect(() => {
    const initSocketConnection = async () => {
      console.log('🔍 DEBUG: Starting socket initialization...');
      console.log('🔍 DEBUG: roomId:', roomId, 'username:', username);
      
      try {
        // Initialize socket
        socketRef.current = await initSocket();
        console.log('✅ Socket instance created');
        
        // Set up socket connection handlers
        socketRef.current.on("connect_error", (err: any) => {
          console.error("❌ Socket connection error:", err);
          setIsInitialized(false);
          toast.error("Failed to connect to server");
        });

        socketRef.current.on("connect", () => {
          console.log("✅ Socket connected, joining room:", roomId);
          socketRef.current.emit(ACTIONS.JOIN, { roomId, username });
          setIsInitialized(true);
        });

        socketRef.current.on("disconnect", (reason: string) => {
          console.log("🔌 Socket disconnected:", reason);
          setIsInitialized(false);
        });

        // If already connected, emit join immediately
        if (socketRef.current.connected) {
          console.log("✅ Socket already connected, joining room:", roomId);
          socketRef.current.emit(ACTIONS.JOIN, { roomId, username });
          setIsInitialized(true);
        }

      } catch (error) {
        console.error("❌ Socket initialization error:", error);
        setIsInitialized(false);
        toast.error("Socket initialization failed");
      }
    };

    initSocketConnection();

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username]);

  // Load workspace - ONLY after socket is initialized
  useEffect(() => {
    console.log('🔍 DEBUG: loadWorkspace effect triggered');
    console.log('🔍 DEBUG: isInitialized:', isInitialized);
    console.log('🔍 DEBUG: workspaceLoaded:', workspaceLoaded);
    console.log('🔍 DEBUG: roomId:', roomId);
    
    const loadWorkspace = async () => {
      // Multiple safeguards
      if (!isInitialized || workspaceLoaded) {
        console.log('🔍 DEBUG: loadWorkspace skipped - isInitialized:', isInitialized, 'workspaceLoaded:', workspaceLoaded);
        return;
      }

      // Fix: Additional validation - ensure roomId is a valid format
      if (!roomId || roomId === 'undefined' || !/^[A-Za-z0-9_-]+$/.test(roomId)) {
        console.error('❌ ERROR: Invalid roomId format in loadWorkspace:', roomId);
        console.error('❌ ERROR: roomId must match pattern: /^[A-Za-z0-9_-]+$/');
        return;
      }
      
      try {
        console.log('🚀 Loading workspace for room:', roomId);
        setLoading(true);
        
        const workspace = await workspaceApi.getWorkspace(roomId);

        if (workspace && workspace.filesContentMap) {
          console.log('✅ Existing workspace loaded');
          console.log('📁 Files in workspace:', workspace.filesContentMap.size);
          
          setFileExplorerData(workspace.fileExplorerData);
          setFiles(workspace.openFiles);
          setActiveFile(workspace.activeFile);

          // Clear and update filesContentMap
          filesContentMap.clear();
          workspace.filesContentMap.forEach((file: IFile, path: string) => {
            filesContentMap.set(path, file);
          });
        } else {
          console.log('📝 Creating new workspace with defaults');
          // Set defaults for new workspace
          setFileExplorerData(DEFAULT_EXPLORER);
          setFiles([DEFAULT_FILE]);
          setActiveFile(DEFAULT_FILE);
          filesContentMap.clear();
          filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
        }
        
        setWorkspaceLoaded(true);
        console.log('✅ Workspace loading completed');
      } catch (error) {
        console.error("❌ Error loading workspace:", error);
        
        // Set defaults on error
        console.log('📝 Setting default workspace due to error');
        setFileExplorerData(DEFAULT_EXPLORER);
        setFiles([DEFAULT_FILE]);
        setActiveFile(DEFAULT_FILE);
        filesContentMap.clear();
        filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
        setWorkspaceLoaded(true);
        
        toast.error("Failed to load workspace, using defaults");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [isInitialized, workspaceLoaded, roomId]);

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
    if (!isInitialized) {
      console.log('🔍 DEBUG: Notification skipped - not initialized');
      return;
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
      console.error('❌ Error adding notification:', error);
    }
  }, [roomId, socketRef, isInitialized]);

  const handleCloseFile = useCallback((e: React.MouseEvent, file: IFile) => {
    e.stopPropagation();
    console.log('🔍 DEBUG: Closing file:', file.path);
    
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
    
    handleAddNotification('FILE_UPDATE', {
      username,
      fileName: activeFile.name,
      path: activeFile.path
    });

    if (isInitialized) {
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
  }, [files, activeFile, fileExplorerData, roomId, socketRef, username, handleAddNotification, isInitialized]);

  const handleChangeActiveFile = useCallback((file: IFile) => {
    console.log('🔍 DEBUG: Changing active file to:', file.path);
    setActiveFile(file);
  }, []);

  const handleRunCode = useCallback(async () => {
    console.log('🔍 DEBUG: Running code for file:', activeFile.path);
    
    if (!activeFile.path) {
      toast.error("No active file to run");
      return;
    }

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

    handleAddNotification('CODE_EXECUTE', {
      username,
      fileName: activeFile.name,
      path: activeFile.path
    });

    setCodeStatus("");
    try {
      setLoading(true);
      if (!socketRef || !socketRef.current) {
        toast.error("Failed to connect to websocket");
        setLoading(false);
        return;
      }
      console.log('🚀 Emitting code execution...');
      socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
        language: data.language,
        code: data.code,
      });
    } catch (error) {
      console.error('❌ Code execution error:', error);
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
      if (!isInitialized || !workspaceLoaded) {
        console.log('🔍 DEBUG: Save skipped - not ready');
        return;
      }

      console.log('💾 Saving changes for file:', activeFile.path);

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
        .then(() => console.log('✅ Workspace saved successfully'))
        .catch((error) => console.error("❌ Error saving workspace:", error));
    }, [roomId, socketRef, isInitialized, workspaceLoaded]),
    1500
  );

  const handleEditorChange = useCallback((content: string | undefined) => {
    if (content === undefined) return;
    console.log('✏️ Editor content changed, length:', content.length);
    debouncedSaveAndEmit(content, activeFile, fileExplorerData, files);
  }, [debouncedSaveAndEmit, activeFile, fileExplorerData, files]);

  const handleCodeChange = useCallback((payload: any) => {
    console.log('🔄 Code change received:', Object.keys(payload));
    
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
      if (payload.activeFile && payload.activeFile.path) {
        filesContentMap.set(payload.activeFile.path, payload.activeFile);
      }
    }
  }, []);

  const handleCodeResult = useCallback((result: any) => {
    console.log('📤 Code execution result received');
    setLoading(false);
    setCodeOutput(result.output);
  }, []);

  const handleRefreshNotifications = useCallback(async () => {
    if (!isInitialized) {
      console.log('🔍 DEBUG: Notification refresh skipped - not initialized');
      return;
    }
    
    try {
      console.log('🔄 Refreshing notifications...');
      const refreshedNotifications = await getNotifications(roomId);
      setNotifications(refreshedNotifications);
      console.log('✅ Notifications refreshed:', refreshedNotifications.length);
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
    }
  }, [roomId, isInitialized]);

  // Save workspace when file explorer is updated
  useEffect(() => {
    if (isFileExplorerUpdated && socketRef?.current && isInitialized && workspaceLoaded) {
      console.log('💾 File explorer updated, saving workspace...');
      
      const dataPayload = {
        fileExplorerData,
        openFiles: files,
        activeFile,
      };

      // Save to backend
      workspaceApi
        .saveWorkspace(roomId, dataPayload, filesContentMap)
        .then(() => console.log('✅ Workspace saved after file explorer update'))
        .catch((error) => console.error("❌ Error saving workspace:", error));

      // Emit to other clients
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        payload: dataPayload,
      });

      setIsFileExplorerUpdated(false);
    }
  }, [isFileExplorerUpdated, fileExplorerData, files, activeFile, roomId, socketRef, isInitialized, workspaceLoaded]);

  const value: RoomContextType = {
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

    // Room info
    roomId,
    username,
    isInitialized: isInitialized && workspaceLoaded, // Both conditions must be true
    socketRef,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}; 