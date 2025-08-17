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
  sidebarWidth: number;
  filesContentMap: Map<string, IFile>;

  // Setters
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveFile: React.Dispatch<React.SetStateAction<IFile>>;
  setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
  setFileExplorerData: React.Dispatch<React.SetStateAction<IFileExplorerNode>>;
  setIsFileExplorerUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;

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
  
  // Validate props immediately with enhanced validation
  if (!roomId || 
      roomId === 'undefined' || 
      roomId.trim() === '' ||
      roomId.length < 3 || 
      roomId.length > 100 ||
      !/^[A-Za-z0-9_-]+$/.test(roomId) ||
      !username || 
      username.trim() === '' ||
      username.length < 2 ||
      username.length > 50 ||
      !/^[A-Za-z0-9_@.-\s]+$/.test(username)) {
    console.error('❌ ERROR: Invalid room parameters in RoomProvider', {
      roomId: { value: roomId, valid: roomId && roomId !== 'undefined' && /^[A-Za-z0-9_-]+$/.test(roomId) },
      username: { value: username, valid: username && /^[A-Za-z0-9_@.-\s]+$/.test(username) }
    });
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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codeFodeSidebarWidth');
      return saved ? parseInt(saved, 10) : 350;
    }
    return 350;
  });

  // Initialize default file in map
  useEffect(() => {
    if (filesContentMap.size === 0) {
      filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
    }
  }, []);

  // Save sidebar width to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('codeFodeSidebarWidth', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  // Socket initialization - separate from workspace loading
  useEffect(() => {
    const initSocketConnection = async () => {
      
      try {
        // Initialize socket
        socketRef.current = initSocket();
        console.log('✅ Socket instance created');
        
        // Set up socket connection handlers with enhanced error handling
        socketRef.current.on("connect_error", (err: any) => {
          console.error("❌ Socket connection error:", err);
          setIsInitialized(false);
          
          // More specific error messages
          if (err.type === 'TransportError') {
            toast.error("Network connection failed. Please check your internet connection.");
          } else if (err.message?.includes('timeout')) {
            toast.error("Connection timeout. The server may be busy.");
          } else {
            toast.error("Failed to connect to server. Please try again later.");
          }
        });

        socketRef.current.on("connect", () => {
          console.log("✅ Socket connected, joining room:", roomId);
          try {
            socketRef.current.emit(ACTIONS.JOIN, { roomId, username });
            setIsInitialized(true);
            toast.success('Connected to room successfully!');
          } catch (error) {
            console.error('❌ Error joining room:', error);
            toast.error('Failed to join room');
            setIsInitialized(false);
          }
        });

        socketRef.current.on("disconnect", (reason: string) => {
          console.log("🔌 Socket disconnected:", reason);
          setIsInitialized(false);
          
          // Handle different disconnect reasons
          if (reason === 'io server disconnect') {
            toast.error('Disconnected by server. Please refresh the page.');
          } else if (reason === 'transport close') {
            toast.error('Connection lost. Attempting to reconnect...');
          } else if (reason !== 'io client disconnect') {
            toast.error('Connection lost. Please check your internet connection.');
          }
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

      // Enhanced validation - ensure roomId is a valid format
      if (!roomId || 
          roomId === 'undefined' || 
          roomId.trim() === '' ||
          roomId.length < 3 || 
          roomId.length > 100 ||
          !/^[A-Za-z0-9_-]+$/.test(roomId)) {
        console.error('❌ ERROR: Invalid roomId format in loadWorkspace:', {
          roomId,
          length: roomId?.length,
          pattern: roomId ? /^[A-Za-z0-9_-]+$/.test(roomId) : false
        });
        toast.error('Invalid room ID format');
        setWorkspaceLoaded(true); // Prevent infinite loop
        return;
      }
      
      // Add timeout for workspace loading
      const timeoutId = setTimeout(() => {
        console.log('⏰ Workspace loading timeout - using defaults');
        setWorkspaceLoaded(true);
        setLoading(false);
        toast.error('Workspace loading timeout - using defaults');
      }, 5000);
      
      try {
        console.log('🚀 Loading workspace for room:', roomId);
        setLoading(true);
        
        const workspace = await Promise.race([
          workspaceApi.getWorkspace(roomId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Workspace loading timeout')), 4000)
          )
        ]);
        // Debug workspace loading
        if (!workspace) {
          console.log('⚠️ No workspace data received');
        } else if (!workspace.filesContentMap) {
          console.log('⚠️ Workspace missing filesContentMap');
        } else {
          console.log('✅ Workspace has filesContentMap with', workspace.filesContentMap.size, 'files');
        }

        if (workspace && workspace.filesContentMap) {
          console.log('✅ Existing workspace loaded');
          console.log('📁 Files in workspace:', workspace.filesContentMap.size);
          
          // Validate workspace data before setting
          try {
            if (workspace.fileExplorerData) {
              setFileExplorerData(workspace.fileExplorerData);
            } else {
              console.warn('⚠️ No file explorer data in workspace, using default');
              setFileExplorerData(DEFAULT_EXPLORER);
            }
            
            if (Array.isArray(workspace.openFiles) && workspace.openFiles.length > 0) {
              setFiles(workspace.openFiles);
            } else {
              console.warn('⚠️ No open files in workspace, using default');
              setFiles([DEFAULT_FILE]);
            }
            
            if (workspace.activeFile && workspace.activeFile.path) {
              setActiveFile(workspace.activeFile);
            } else {
              console.warn('⚠️ No active file in workspace, using default');
              setActiveFile(workspace.openFiles?.[0] || DEFAULT_FILE);
            }

            // Clear and update filesContentMap with validation
            filesContentMap.clear();
            if (workspace.filesContentMap instanceof Map) {
              workspace.filesContentMap.forEach((file: IFile, path: string) => {
                if (file && typeof file === 'object' && file.path && file.name) {
                  filesContentMap.set(path, file);
                } else {
                  console.warn('⚠️ Invalid file data in workspace:', { path, file });
                }
              });
            } else {
              console.warn('⚠️ filesContentMap is not a Map, setting default');
              filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
            }
          } catch (error) {
            console.error('❌ Error processing workspace data:', error);
            throw error; // Re-throw to trigger catch block below
          }
        } else {
          console.log('📝 Creating new workspace with defaults');
          // Set defaults for new workspace
          setFileExplorerData(DEFAULT_EXPLORER);
          setFiles([DEFAULT_FILE]);
          setActiveFile(DEFAULT_FILE);
          filesContentMap.clear();
          filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
        }
        
        clearTimeout(timeoutId);
        setWorkspaceLoaded(true);
        console.log('✅ Workspace loading completed');
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("❌ Error loading workspace:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        });
        
        // Set defaults on error with enhanced error handling
        console.log('📝 Setting default workspace due to error:', error.message);
        
        try {
          setFileExplorerData(DEFAULT_EXPLORER);
          setFiles([DEFAULT_FILE]);
          setActiveFile(DEFAULT_FILE);
          filesContentMap.clear();
          filesContentMap.set(DEFAULT_FILE.path, DEFAULT_FILE);
          setWorkspaceLoaded(true);
          
          // More specific error messages
          if (error?.response?.status === 404) {
            toast.error("Workspace not found. Creating a new one.");
          } else if (error?.response?.status === 403) {
            toast.error("Access denied to workspace. Using defaults.");
          } else if (error?.code === 'NETWORK_ERROR') {
            toast.error("Network error. Please check your connection.");
          } else {
            toast.error("Failed to load workspace. Using defaults.");
          }
        } catch (fallbackError) {
          console.error('❌ Critical error setting default workspace:', fallbackError);
          toast.error('Critical error occurred. Please refresh the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, roomId]); // workspaceLoaded intentionally excluded to prevent loading loops

  // Reset workspaceLoaded when roomId changes
  useEffect(() => {
    if (roomId) {
      setWorkspaceLoaded(false);
    }
  }, [roomId]);

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
    // Enhanced validation
    if (!isInitialized) {
      console.log('🔍 DEBUG: Notification skipped - not initialized');
      return;
    }
    
    if (!details.username || details.username.trim() === '') {
      console.error('❌ Invalid username for notification:', details);
      return;
    }
    
    try {
      const message = createNotificationMessage(type, details);
      
      if (!message || message.trim() === '') {
        console.error('❌ Empty notification message generated');
        return;
      }
      
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
      
      if (!newNotification) {
        console.error('❌ Failed to create notification');
        return;
      }

      const typedNotification: Notification = {
        type: newNotification.type,
        message: newNotification.message,
        username: newNotification.username,
        timestamp: new Date(newNotification.timestamp),
        metadata: newNotification.metadata
      };

      setNotifications(prev => [typedNotification, ...prev.slice(0, 99)]); // Keep only last 100 notifications
      
      // Emit socket event with error handling
      if (socketRef?.current?.connected) {
        try {
          socketRef.current.emit(ACTIONS.NOTIFICATION_ADDED, {
            roomId,
            notification: typedNotification
          });
        } catch (socketError) {
          console.error('❌ Error emitting notification via socket:', socketError);
        }
      } else {
        console.warn('⚠️ Socket not connected, notification not broadcasted');
      }
    } catch (error: any) {
      console.error('❌ Error adding notification:', error);
      
      // Show user-friendly error message
      if (error?.response?.status === 429) {
        console.warn('⚠️ Rate limited - notification not added');
      } else {
        toast.error('Failed to add notification');
      }
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
    sidebarWidth,
    filesContentMap,

    // Setters
    setClients,
    setActiveFile,
    setFiles,
    setFileExplorerData,
    setIsFileExplorerUpdated,
    setNotifications,
    setSidebarWidth,

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
    isInitialized: isInitialized, // Only require socket connection
    socketRef,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}; 