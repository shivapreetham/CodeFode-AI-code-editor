"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import React, { useContext, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import "./page.css";
import ErrorBoundary from "@/app/components/common/ErrorBoundary";

// Components
import Sidebar from "@/app/components/room/Sidebar";
import SidebarPanel from "@/app/components/room/SidebarPanel";
import FileTabs from "@/app/components/room/FileTabs";
import CodeEditor from "@/app/components/room/CodeEditor";
import CodeOutput from "@/app/components/room/CodeOutput";
import CodeVisualization from "@/app/components/room/CodeVisualization";

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
  
  // New feature states
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [showVisualization, setShowVisualization] = useState(false);
  const [aiInlineSuggestions, setAiInlineSuggestions] = useState<string[]>([]);

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

  // Essential debug info only when needed
  if (activeTab === 4) {
    console.log('🧠 AI Tab Active:', { 
      hasFile: !!activeFile?.path,
      language: activeFile?.language,
      contentLength: (filesContentMap.get(activeFile?.path)?.content || activeFile?.content)?.length
    });
  }

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
        position: {
          line: e.position.lineNumber,
          ch: e.position.column
        },
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

    // Capture socket reference for cleanup
    const socket = socketRef.current;

    // Set up socket event listeners
    socket.on(ACTIONS.JOINED, ({ clients, username: joinedUsername }: any) => {
      console.log('👥 User joined:', joinedUsername);
      if (joinedUsername !== username) {
        toast.success(`${joinedUsername} joined the room.`);
      }
      setClients(clients);
    });

    socket.on(ACTIONS.LOAD_MESSAGES, (chatHistory: any[]) => {
      console.log('💬 Loading chat messages:', chatHistory.length);
      setMessages(chatHistory);
    });

    socket.on(ACTIONS.DISCONNECTED, ({ username: leftUsername, socketId }: any) => {
      console.log('👋 User left:', leftUsername);
      toast.success(`${leftUsername} left the room.`);
      setClients((prev: any[]) => prev.filter((client: any) => client.socketId !== socketId));
    });

    socket.on(ACTIONS.NOTIFICATION_ADDED, ({ notification }: any) => {
      console.log('🔔 Notification received:', notification.type);
      setNotifications(prev => [notification, ...prev]);
    });

    socket.on(ACTIONS.CURSOR_CHANGE, (data: any) => {
      if (data.username === username) return;
      handleCursorChange(data);
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ payload }: any) => {
      console.log('🔄 Code change received from socket');
      handleCodeChange(payload);
    });
    
    socket.on(ACTIONS.CODE_RESULT, (result: any) => {
      console.log('📤 Code execution result received from socket');
      handleCodeResult(result);
    });

    return () => {
      if (socket) {
        console.log('🧹 Cleaning up socket event listeners...');
        socket.off(ACTIONS.JOINED);
        socket.off(ACTIONS.DISCONNECTED);
        socket.off(ACTIONS.CODE_CHANGE);
        socket.off(ACTIONS.NOTIFICATION_ADDED);
        socket.off(ACTIONS.CURSOR_CHANGE);
        socket.off(ACTIONS.CODE_RESULT);
        socket.off(ACTIONS.LOAD_MESSAGES);
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

  // Handle AI response and generate inline suggestions
  useEffect(() => {
    if (aiResponse) {
      const suggestions: string[] = [];
      
      // Extract suggestions and best practices
      aiResponse.suggestions?.forEach(suggestion => {
        if (suggestion?.code) suggestions.push(suggestion.code);
      });
      
      aiResponse.bestPractices?.forEach(practice => {
        if (practice?.code) suggestions.push(practice.code);
      });
      
      setAiInlineSuggestions(suggestions);
    } else {
      setAiInlineSuggestions([]);
    }
  }, [aiResponse]);

  // Add demo note when notes panel is first opened
  useEffect(() => {
    if (showNotes && !notes.has(activeFile?.path || '')) {
      setNotes(prev => new Map(prev).set(activeFile?.path || '', `# Code Notes for ${activeFile?.name || 'Current File'}

## 📝 How to use inline notes:
- Add // NOTE: your note here to any line
- Add /* NOTE: your note here */ for multi-line notes
- Hover over lines with notes to see them

## 🚀 AI Features:
- AI suggestions appear as ghost text
- Click the sparkles button to toggle AI suggestions
- Use the "Analyze Now" button for instant AI analysis

## 📊 Visualization:
- Click the eye button to see code structure
- View file dependencies and function hierarchies
- Analyze import/export relationships

## 💡 Tips:
- Use the notes panel for detailed documentation
- Combine AI suggestions with your own notes
- Visualize your code to understand structure better`));
    }
  }, [showNotes, notes, activeFile?.name, activeFile?.path]);

  // Handle AI suggestions when AI tab is active
  useEffect(() => {
    const currentContent = filesContentMap.get(activeFile?.path)?.content || activeFile?.content;
    const currentLanguage = activeFile?.language;

    if (activeTab === 4 && currentContent && currentLanguage) {
      // Clear any pending AI timeout
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }

      setIsDebouncing(true);

      // Set a new timeout to trigger AI after a delay
      aiTimeoutRef.current = setTimeout(() => {
        setIsDebouncing(false);
        fetchSuggestions(currentContent, currentLanguage);
      }, 1000);
    } else {
      // Clear timeout if conditions are not met
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setIsDebouncing(false);
    }
  }, [activeTab, activeFile?.path, activeFile?.content, activeFile?.language, activeFile?.name, filesContentMap, fetchSuggestions]);

  // Manual AI trigger function
  const handleManualAITrigger = useCallback(() => {
    const currentContent = filesContentMap.get(activeFile?.path)?.content || activeFile?.content;
    const currentLanguage = activeFile?.language;
    
    if (currentContent && currentLanguage) {
      // Clear any pending AI timeout
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      fetchSuggestions(currentContent, currentLanguage);
    }
  }, [activeFile?.path, activeFile?.content, activeFile?.language, filesContentMap, fetchSuggestions]);

  // Handle notes toggle
  const handleToggleNotes = useCallback(() => {
    setShowNotes(!showNotes);
  }, [showNotes]);

  // Handle notes change
  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(prev => new Map(prev).set(activeFile?.path || '', newNotes));
  }, [activeFile?.path]);

  // Handle code visualization
  const handleVisualizeCode = useCallback(() => {
    setShowVisualization(true);
  }, []);

  // Handle close visualization
  const handleCloseVisualization = useCallback(() => {
    setShowVisualization(false);
  }, []);

  // Loading state - handled by RoomContext
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-light dark:bg-surface-dark">
        <div className="text-center p-8">
          <div className="loading-spinner w-12 h-12 border-primary-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-primary-theme mb-3">
            Connecting to room...
          </h2>
          <p className="text-secondary-theme mb-2">
            Please wait while we establish the connection.
          </p>
          <div className="card p-4 max-w-sm mx-auto mt-4">
            <p className="text-sm text-secondary-theme">
              <span className="font-medium">Room:</span> {roomId}
            </p>
            <p className="text-sm text-secondary-theme">
              <span className="font-medium">User:</span> {username}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Room page error:', error, errorInfo);
        // Log to error reporting service here if needed
      }}
    >
      <div className="flex flex-col md:flex-row bg-surface-light dark:bg-surface-dark min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface-light)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            },
            success: {
              style: {
                background: 'var(--color-success)',
                color: 'white',
              },
            },
            error: {
              style: {
                background: 'var(--color-error)',
                color: 'white',
              },
            },
          }}
        />

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
          aiSuggestions={aiInlineSuggestions}
          onVisualizeCode={handleVisualizeCode}
          onToggleNotes={handleToggleNotes}
          showNotes={showNotes}
          notes={notes.get(activeFile?.path || '') || ''}
          onNotesChange={handleNotesChange}
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

        {/* Code Visualization Modal */}
        <CodeVisualization
          isOpen={showVisualization}
          onClose={handleCloseVisualization}
          files={files}
          fileExplorerData={fileExplorerData}
          filesContentMap={filesContentMap}
        />
      </div>
    </ErrorBoundary>
  );
};

const Page = () => {
  const params = useParams();
  const query = useSearchParams();
  const router = useRouter();
  
  // Enhanced parameter extraction with validation
  const { roomId, username } = useMemo(() => {
    let extractedRoomId: string | null = null;
    let extractedUsername: string | null = null;

    // Extract roomId with comprehensive validation
    if (params?.roomId) {
      const rawRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
      
      // Enhanced validation - ensure roomId is not "undefined" string and meets format requirements
      if (rawRoomId && 
          rawRoomId !== 'undefined' && 
          rawRoomId.trim() !== '' && 
          rawRoomId.length >= 3 && 
          rawRoomId.length <= 100 && 
          /^[A-Za-z0-9_-]+$/.test(rawRoomId.trim())) {
        extractedRoomId = rawRoomId.trim();
      } else {
        console.error('❌ Invalid roomId format:', rawRoomId);
        console.error('❌ roomId must be non-empty and match pattern: /^[A-Za-z0-9_-]+$/');
      }
    } else {
      console.error('❌ No roomId in params');
    }

    // Extract username with validation
    const rawUsername = query.get("username");
    
    if (rawUsername && 
        rawUsername.trim() !== '' && 
        rawUsername.length >= 2 && 
        rawUsername.length <= 50 && 
        /^[A-Za-z0-9_@.-\s]+$/.test(rawUsername.trim())) {
      extractedUsername = rawUsername.trim();
    } else {
      console.error('❌ Invalid username:', rawUsername, {
        length: rawUsername?.length,
        pattern: rawUsername ? /^[A-Za-z0-9_@.-\s]+$/.test(rawUsername.trim()) : false
      });
    }


    return {
      roomId: extractedRoomId,
      username: extractedUsername
    };
  }, [params, query]);

  // Authentication check with error handling
  const { status } = useSession();
  
  useEffect(() => {
    try {
      if (status === "unauthenticated") {
        console.log('🔐 User not authenticated, redirecting to login...');
        toast.error('Please log in to access this room');
        router.push("/login");
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      toast.error('Authentication error occurred');
    }
  }, [status, router]);

  // Handle URL parameters with error handling
  useEffect(() => {
    try {
      const toastId = query.get("toastId");
      if (toastId) {
        console.log('🍞 Dismissing toast:', toastId);
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error('❌ Error handling URL parameters:', error);
    }
  }, [query]);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-light dark:bg-surface-dark">
        <div className="text-center p-8">
          <div className="loading-spinner w-12 h-12 border-primary-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-primary-theme mb-3">
            Loading session...
          </h2>
          <p className="text-secondary-theme">
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
      <div className="flex items-center justify-center h-screen bg-surface-light dark:bg-surface-dark p-4">
        <div className="card max-w-md mx-auto p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-error mb-2">
              Invalid Room Access
            </h1>
            <p className="text-secondary-theme mb-4">
              Missing or invalid room parameters. Please check your URL and try again.
            </p>
          </div>
          
          <div className="bg-surface dark:bg-surface-darker p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-primary-theme mb-3">Debug Information:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-theme">Room ID:</span>
                <span className="font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded text-xs">
                  {roomId || 'undefined'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-theme">Username:</span>
                <span className="font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded text-xs">
                  {username || 'undefined'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-theme">URL Path:</span>
                <span className="font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded text-xs max-w-48 truncate">
                  {typeof window !== 'undefined' ? window.location.pathname : 'unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-theme">Query:</span>
                <span className="font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded text-xs max-w-48 truncate">
                  {query.toString() || 'empty'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="btn-primary w-full px-4 py-2 rounded-lg font-medium"
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary w-full px-4 py-2 rounded-lg font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <RoomProvider roomId={roomId} username={username}>
      <RoomContent />
    </RoomProvider>
  );
};

export default Page;
