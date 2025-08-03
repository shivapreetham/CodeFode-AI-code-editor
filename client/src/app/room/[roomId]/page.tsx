"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import React, { useContext, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import "./page.css";

// Components
import Sidebar from "@/app/components/room/Sidebar";
import SidebarPanel from "@/app/components/room/SidebarPanel";
import FileTabs from "@/app/components/room/FileTabs";
import CodeEditor from "@/app/components/room/CodeEditor";
import CodeOutput from "@/app/components/room/CodeOutput";

// Hooks
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAISuggestions } from "@/hooks/useAISuggestion";

// Context
import { RoomProvider, useRoom } from "@/context/RoomContext";

// Contexts
import { ChatContext } from "@/context/ChatContext";
import { ThemeContext } from "@/context/ThemeContext";
import { FontSizeContext } from "@/context/FontSizeContext";
import { ActiveFileContext } from "@/context/ActiveFileContext";

// Socket and Actions
import { initSocket } from '@/socket';
import { ACTIONS } from "@/app/helpers/Actions";

const RoomContent = () => {
  const { setMessages } = useContext(ChatContext);
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useContext(FontSizeContext);
  const { setActiveFileGlobal } = useContext(ActiveFileContext);

  // AI Suggestions
  const {
    isLoading: aiLoading,
    aiResponse,
    error: aiError,
    fetchSuggestions,
  } = useAISuggestions({
    enabled: true,
  });

  // Cursor management refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const remoteCursorDecorations = useRef<{ [key: string]: string[] }>({});
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Room state management using centralized context
  const {
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
    setClients,
    setActiveFile,
    setFiles,
    setFileExplorerData,
    setIsFileExplorerUpdated,
    setNotifications,
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
      socketRef,
    isInitialized,
      roomId,
    username
  } = useRoom();

  console.log('🔍 DEBUG: RoomContent rendered with:', { 
    roomId, 
    username, 
    isInitialized, 
    activeFileExists: !!activeFile?.path,
    activeTab
  });

  // Cursor management functions
  const updateRemoteCursor = useCallback((
    remoteUserId: string,
    position: any,
    remoteUsername: string
  ) => {
    if (!editorRef.current || !monacoRef.current) return;

    console.log("Updating remote cursor for:", remoteUserId, "at", position);

    const newDecorations = [
      {
        range: new monacoRef.current.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          className: "remote-cursor",
          beforeContentClassName: "remote-cursor-label",
          hoverMessage: { value: `👤 ${remoteUsername}` },
        },
      },
    ];

    const oldDecorations = remoteCursorDecorations.current[remoteUserId] || [];
    const newDecoIds = editorRef.current.deltaDecorations(
      oldDecorations,
      newDecorations
    );

    remoteCursorDecorations.current[remoteUserId] = newDecoIds;
  }, []);

  const handleCursorChange = useCallback((data: any) => {
    if (data.username === username) return;
    updateRemoteCursor(data.username, data.position, data.username);
  }, [username, updateRemoteCursor]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    console.log("Monaco Editor mounted");
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for local cursor position changes and emit the event
    editor.onDidChangeCursorPosition((e: any) => {
      const currentFilePath = activeFile?.path;

      if (!currentFilePath || !username) {
        return;
      }

      const payload = {
        roomId,
        username,
        position: e.position,
        filePath: currentFilePath,
      };

      socketRef?.current?.emit(ACTIONS.CURSOR_CHANGE, payload);
    });
  }, [activeFile, username, roomId, socketRef]);

  // Socket event listeners - now handled by RoomContext initialization
  useEffect(() => {
    if (!isInitialized || !socketRef?.current) {
      console.log('🔍 DEBUG: Socket listeners not set up yet - isInitialized:', isInitialized);
      return;
    }

    console.log('🔍 DEBUG: Setting up socket event listeners...');

    // Set up socket event listeners
    socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUsername }: any) => {
      console.log('👥 User joined:', joinedUsername);
      if (joinedUsername !== username) {
        toast.success(`${joinedUsername} joined the room.`);
      }
      setClients(clients);
    });

    socketRef.current.on(ACTIONS.LOAD_MESSAGES, (chatHistory: any[]) => {
      console.log('💬 Loading chat messages:', chatHistory.length);
      setMessages(chatHistory);
    });

    socketRef.current.on(ACTIONS.DISCONNECTED, ({ username: leftUsername, socketId }: any) => {
      console.log('👋 User left:', leftUsername);
      toast.success(`${leftUsername} left the room.`);
      setClients((prev: any[]) => prev.filter((client: any) => client.socketId !== socketId));
    });

    socketRef.current.on(ACTIONS.NOTIFICATION_ADDED, ({ notification }: any) => {
      console.log('🔔 Notification received:', notification.type);
      setNotifications(prev => [notification, ...prev]);
    });

    socketRef.current.on(ACTIONS.CURSOR_CHANGE, (data: any) => {
      if (data.username === username) return;
      handleCursorChange(data);
    });

    socketRef.current.on(ACTIONS.CODE_CHANGE, ({ payload }: any) => {
      console.log('🔄 Code change received from socket');
      handleCodeChange(payload);
    });
    
    socketRef.current.on(ACTIONS.CODE_RESULT, (result: any) => {
      console.log('📤 Code execution result received from socket');
      handleCodeResult(result);
    });

    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up socket event listeners...');
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.NOTIFICATION_ADDED);
        socketRef.current.off(ACTIONS.CURSOR_CHANGE);
        socketRef.current.off(ACTIONS.CODE_RESULT);
        socketRef.current.off(ACTIONS.LOAD_MESSAGES);
      }
    };
  }, [isInitialized, socketRef, setClients, setMessages, setNotifications, handleCursorChange, handleCodeChange, handleCodeResult, username]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTabChange: handleTabChange,
    onRunCode: () => handleRunCode(),
    onToggleSidebar: toggleSidebar,
  });

  // Update global active file when it changes
  useEffect(() => {
    setActiveFileGlobal(activeFile);
  }, [activeFile, setActiveFileGlobal]);

  // Reset AI trigger flag when active file changes
  useEffect(() => {
    // Clear any pending AI timeout
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  }, [activeFile?.path]);

  // Handle AI suggestions when AI tab is active
  useEffect(() => {
    console.log('🧠 AI useEffect:', {
      activeTab,
      hasContent: !!activeFile?.content,
      hasLang: !!activeFile?.language,
      contentLength: activeFile?.content?.length,
      language: activeFile?.language,
      isInitialized
    });

    if (activeTab === 4 && activeFile?.content && activeFile?.language) {
      console.log('✅ AI conditions met - starting debounce');
      
      // Clear any pending AI timeout
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }

      // Set debouncing state
      setIsDebouncing(true);

      // Set a new timeout to trigger AI after a delay
      aiTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Debounce timeout fired - calling fetchSuggestions');
        setIsDebouncing(false);
        fetchSuggestions(activeFile.content, activeFile.language);
      }, 1000); // 1 second debounce
    } else {
      console.log('❌ AI conditions not met:', {
        activeTabIs4: activeTab === 4,
        hasContent: !!activeFile?.content,
        hasLanguage: !!activeFile?.language
      });
      
      // Clear timeout if conditions are not met
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setIsDebouncing(false);
    }
  }, [activeTab, activeFile?.content, activeFile?.language, fetchSuggestions]);

  // Manual AI trigger function
  const handleManualAITrigger = useCallback(() => {
    console.log('🔥 Manual AI trigger clicked');
    if (activeFile?.content && activeFile?.language) {
      console.log('✅ Manual trigger conditions met - calling fetchSuggestions directly');
      // Clear any pending AI timeout
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      fetchSuggestions(activeFile.content, activeFile.language);
    } else {
      console.log('❌ Manual trigger conditions not met:', {
        hasContent: !!activeFile?.content,
        hasLanguage: !!activeFile?.language
      });
    }
  }, [activeFile?.content, activeFile?.language, fetchSuggestions]);

  // Loading state - handled by RoomContext
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Connecting to room...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Please wait while we establish the connection.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Room: {roomId} | User: {username}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <Toaster />

      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        onTabChange={handleTabChange}
        onToggleCollapse={toggleSidebar}
      />

      {/* Sidebar Panel */}
      <SidebarPanel
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        roomId={roomId}
        username={username}
        clients={clients}
        notifications={notifications}
        onRefreshNotifications={handleRefreshNotifications}
        fileExplorerData={fileExplorerData}
        setFileExplorerData={setFileExplorerData}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        files={files}
        setFiles={setFiles}
        isFileExplorerUpdated={isFileExplorerUpdated}
        setIsFileExplorerUpdated={setIsFileExplorerUpdated}
        filesContentMap={filesContentMap}
        setNotifications={setNotifications}
        socket={socketRef}
        aiResponse={aiResponse}
        aiLoading={aiLoading}
        aiError={aiError}
        onManualAITrigger={handleManualAITrigger}
        isDebouncing={isDebouncing}
      />

      {/* Main Editor Area */}
      <div
        className={`coegle_editor h-screen ${
          isCollapsed ? "md:w-[99.5%]" : "md:w-[95%]"
        }`}
      >
        {/* File Tabs */}
        <FileTabs
          files={files}
          activeFile={activeFile}
          onFileChange={handleChangeActiveFile}
          onFileClose={handleCloseFile}
        />

        {/* Code Editor */}
        <CodeEditor
          activeFile={activeFile}
          isOutputExpand={isOutputExpand}
          isCollapsed={isCollapsed}
          theme={theme}
          fontSize={fontSize}
          filesContentMap={filesContentMap}
          onEditorChange={handleEditorChange}
          onEditorDidMount={handleEditorDidMount}
        />

        {/* Code Output */}
        <CodeOutput
          isOutputExpand={isOutputExpand}
          codeOutput={codeOutput}
          loading={loading}
          codeStatus={codeStatus}
          onToggleOutputVisibility={handleToggleOutputVisibility}
          onRunCode={handleRunCode}
        />
      </div>
              </div>
            );
};

const Page = () => {
  const params = useParams();
  const query = useSearchParams();
  const router = useRouter();
  
  // Enhanced parameter extraction with validation
  const { roomId, username } = useMemo(() => {
    console.log('🔍 DEBUG: Extracting route parameters...');
    console.log('🔍 DEBUG: Raw params:', params);
    console.log('🔍 DEBUG: Raw query params:', Array.from(query.entries()));
    
    let extractedRoomId: string | null = null;
    let extractedUsername: string | null = null;

    // Extract roomId with comprehensive validation
    if (params?.roomId) {
      const rawRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
      console.log('🔍 DEBUG: Raw roomId from params:', rawRoomId);
      
      // Fix: Additional validation - ensure roomId is not "undefined" string
      if (rawRoomId && rawRoomId !== 'undefined' && rawRoomId.trim() !== '' && /^[A-Za-z0-9_-]+$/.test(rawRoomId.trim())) {
        extractedRoomId = rawRoomId.trim();
        console.log('✅ Valid roomId extracted:', extractedRoomId);
      } else {
        console.error('❌ Invalid roomId format:', rawRoomId);
        console.error('❌ roomId must be non-empty and match pattern: /^[A-Za-z0-9_-]+$/');
      }
    } else {
      console.error('❌ No roomId in params');
    }

    // Extract username with validation
    const rawUsername = query.get("username");
    console.log('🔍 DEBUG: Raw username from query:', rawUsername);
    
    if (rawUsername && rawUsername.trim() !== '') {
      extractedUsername = rawUsername.trim();
      console.log('✅ Valid username extracted:', extractedUsername);
    } else {
      console.error('❌ Invalid username:', rawUsername);
    }

    console.log('🔍 DEBUG: Final extracted values:', { extractedRoomId, extractedUsername });

    return {
      roomId: extractedRoomId,
      username: extractedUsername
    };
  }, [params, query]);

  // Authentication check
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log('🔐 User not authenticated, redirecting to login...');
      router.push("/login");
    }
  }, [status, router]);

  // Handle URL parameters
  useEffect(() => {
    const toastId = query.get("toastId");
    if (toastId) {
      console.log('🍞 Dismissing toast:', toastId);
      toast.dismiss(toastId);
    }
  }, [query]);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Loading session...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Please wait while we verify your authentication.
          </p>
        </div>
      </div>
    );
  }

  // Validation checks with detailed error information
  if (!roomId || !username) {
    console.error('❌ ERROR: Invalid room parameters');
    console.error('❌ ERROR: roomId:', roomId);
    console.error('❌ ERROR: username:', username);
    console.error('❌ ERROR: Raw params:', params);
    console.error('❌ ERROR: Raw query:', query.toString());
    console.error('❌ ERROR: Current URL:', typeof window !== 'undefined' ? window.location.href : 'unknown');
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Invalid Room Access
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Missing or invalid room parameters. Please check your URL and try again.
          </p>
          
          <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg mb-4 text-left">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">RoomId:</span> <span className="font-mono bg-gray-300 dark:bg-gray-700 px-1 rounded">{roomId || 'undefined'}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Username:</span> <span className="font-mono bg-gray-300 dark:bg-gray-700 px-1 rounded">{username || 'undefined'}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">URL Path:</span> <span className="font-mono bg-gray-300 dark:bg-gray-700 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.pathname : 'unknown'}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Query String:</span> <span className="font-mono bg-gray-300 dark:bg-gray-700 px-1 rounded text-xs">{query.toString() || 'empty'}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Go Home
            </button>
                <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reload Page
                </button>
              </div>
            </div>
          </div>
    );
  }

  console.log('✅ Page rendering with valid parameters:', { roomId, username });

  return (
    <RoomProvider roomId={roomId} username={username}>
      <RoomContent />
    </RoomProvider>
  );
};

export default Page;
