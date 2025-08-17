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
import MousePointerTracker from "@/app/components/mousePointer/MousePointerTracker";

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
  const [editingSessions, setEditingSessions] = useState<Map<string, { startTime: number, filePath: string }>>(new Map());
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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
    sidebarWidth,
    filesContentMap,
    setClients,
    setActiveFile,
    setFiles,
    setFileExplorerData,
    setIsFileExplorerUpdated,
    setNotifications,
    setSidebarWidth,
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

    // Track edit sessions
    editor.onDidChangeModelContent(() => {
      const currentFilePath = activeFile?.path;
      
      if (!currentFilePath || !username || !socketRef?.current) return;

      const sessionKey = `${username}-${currentFilePath}`;
      
      // Start edit session if not already started
      if (!editingSessions.has(sessionKey)) {
        const startTime = Date.now();
        setEditingSessions(prev => new Map(prev).set(sessionKey, { startTime, filePath: currentFilePath }));
        
        socketRef.current.emit(ACTIONS.FILE_EDIT_START, {
          roomId,
          username,
          filePath: currentFilePath,
          fileName: activeFile?.name,
          language: activeFile?.language,
          timestamp: startTime
        });
      }
    });

    // Track when user stops editing (focus lost)
    editor.onDidBlurEditorText(() => {
      const currentFilePath = activeFile?.path;
      
      if (!currentFilePath || !username || !socketRef?.current) return;

      const sessionKey = `${username}-${currentFilePath}`;
      const session = editingSessions.get(sessionKey);
      
      if (session) {
        const endTime = Date.now();
        const duration = endTime - session.startTime;
        
        setEditingSessions(prev => {
          const newSessions = new Map(prev);
          newSessions.delete(sessionKey);
          return newSessions;
        });
        
        socketRef.current.emit(ACTIONS.FILE_EDIT_END, {
          roomId,
          username,
          filePath: currentFilePath,
          fileName: activeFile?.name,
          language: activeFile?.language,
          duration,
          timestamp: endTime
        });
      }
    });
  }, [activeFile, username, roomId, socketRef, editingSessions]);

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

  // Sidebar resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
  }, [sidebarWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // Min 200px, Max 600px
    setSidebarWidth(newWidth);
  }, [isResizing, startX, startWidth, setSidebarWidth]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.classList.add('resizing');
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.classList.remove('resizing');
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTabChange: handleTabChange,
    onRunCode: () => handleRunCode(),
    onToggleSidebar: toggleSidebar,
  });

  // Update global active file when it changes and track file opened
  useEffect(() => {
    setActiveFileGlobal(activeFile);
    
    // Track file opened event
    if (activeFile?.path && socketRef?.current && username) {
      socketRef.current.emit(ACTIONS.FILE_OPENED, {
        roomId,
        username,
        filePath: activeFile.path,
        fileName: activeFile.name,
        language: activeFile.language,
        timestamp: Date.now()
      });
    }
  }, [activeFile, setActiveFileGlobal, socketRef, roomId, username]);

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

  // Handle inserting AI suggestion into editor
  const handleInsertAICode = useCallback((code: string) => {
    if (!editorRef.current || !monacoRef.current) {
      console.warn('Editor not available for code insertion');
      return;
    }

    try {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      const range = selection || new monacoRef.current.Range(1, 1, 1, 1);
      
      // Insert the code at cursor position
      editor.executeEdits('insert-ai-code', [{
        range: range,
        text: code,
        forceMoveMarkers: true
      }]);
      
      // Focus the editor
      editor.focus();
      
      // Show success toast
      toast.success('Code inserted successfully!');
    } catch (error) {
      console.error('Error inserting code:', error);
      toast.error('Failed to insert code');
    }
  }, []);

  // Handle inserting line-specific AI corrections
  const handleInsertLineCorrection = useCallback((correction: any) => {
    if (!editorRef.current || !monacoRef.current) {
      console.warn('Editor not available for line correction');
      return;
    }

    try {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (!model) {
        console.warn('Editor model not available');
        return;
      }

      // Create range for the specific lines to be replaced
      const startLine = correction.startLine;
      const endLine = correction.endLine;
      
      // Validate line numbers
      const totalLines = model.getLineCount();
      if (startLine < 1 || endLine > totalLines || startLine > endLine) {
        toast.error(`Invalid line range: ${startLine}-${endLine}. File has ${totalLines} lines.`);
        return;
      }

      // Get the range to replace (entire lines)
      const range = new monacoRef.current.Range(
        startLine, 1, // Start of first line
        endLine, model.getLineMaxColumn(endLine) // End of last line
      );

      // Apply the correction
      editor.executeEdits('apply-line-correction', [{
        range: range,
        text: correction.correctedCode,
        forceMoveMarkers: true
      }]);

      // Move cursor to the corrected area
      const newPosition = new monacoRef.current.Position(startLine, 1);
      editor.setPosition(newPosition);
      editor.revealPosition(newPosition);

      // Focus the editor
      editor.focus();

      // Show success toast with specific line info
      toast.success(`Applied correction to lines ${startLine}-${endLine}!`);
      
      console.log('Line correction applied:', {
        lines: `${startLine}-${endLine}`,
        title: correction.title,
        severity: correction.severity
      });
      
    } catch (error) {
      console.error('Error applying line correction:', error);
      toast.error('Failed to apply line correction');
    }
  }, []);

  // Loading state - handled by RoomContext
  if (!isInitialized) {
    return (
      <div className="vscode-container">
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center p-8">
            <div className="loading-spinner mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--bc))' }}>
              Connecting to room...
            </h2>
            <p className="text-lg mb-6" style={{ color: 'hsl(var(--bc) / 0.7)' }}>
              Please wait while we establish the connection.
            </p>
            <div className="p-6 rounded-lg max-w-md mx-auto" style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))' }}>
              <p className="text-base mb-2" style={{ color: 'hsl(var(--bc) / 0.7)' }}>
                <span className="font-medium">Room:</span> {roomId}
              </p>
              <p className="text-base" style={{ color: 'hsl(var(--bc) / 0.7)' }}>
                <span className="font-medium">User:</span> {username}
              </p>
            </div>
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
      <div className={`vscode-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mouse Pointer Tracker */}
        <MousePointerTracker
          socket={socketRef?.current}
          roomId={roomId}
          username={username || 'Anonymous'}
          isCodeEditorActive={activeTab === 0} // Track only when in file explorer or coding area
        />
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--b2))',
              color: 'hsl(var(--bc))',
              border: '1px solid hsl(var(--b3))',
              borderRadius: '8px',
              fontSize: '16px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: 'hsl(var(--su))',
                secondary: 'hsl(var(--suc))',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(var(--er))',
                secondary: 'hsl(var(--erc))',
              },
            },
          }}
        />

        {/* Activity Bar */}
        <Sidebar
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          onTabChange={handleTabChange}
          onToggleCollapse={toggleSidebar}
        />

        {/* Sidebar Panel */}
        <div 
          className="vscode-sidebar-panel"
          style={isMobile ? {
            width: '320px',
            minWidth: '320px',
            maxWidth: '320px'
          } : { 
            width: `${sidebarWidth}px`,
            minWidth: `${sidebarWidth}px`,
            maxWidth: `${sidebarWidth}px`
          }}
        >
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
            onInsertCode={handleInsertAICode}
            onInsertLineCorrection={handleInsertLineCorrection}
            isDebouncing={isDebouncing}
            activeFile={activeFile}
            currentCode={filesContentMap.get(activeFile?.path)?.content || activeFile?.content}
          />
        </div>

        {/* Resize Handle */}
        {!isCollapsed && !isMobile && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            style={{
              width: '4px',
              cursor: 'col-resize',
              backgroundColor: 'hsl(var(--b3))',
              borderLeft: '1px solid hsl(var(--b3))',
              borderRight: '1px solid hsl(var(--b3))',
              position: 'relative',
              zIndex: 10,
              minHeight: '100vh',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--b3))';
            }}
          />
        )}

        {/* Main Editor Area */}
        <div className="vscode-main-area">
          {/* File Tabs */}
          <FileTabs
            files={files}
            activeFile={activeFile}
            onFileChange={handleChangeActiveFile}
            onFileClose={handleCloseFile}
          />

          {/* Editor Content */}
          <div className="vscode-editor-content">
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
              aiResponse={aiResponse}
              onInsertCode={handleInsertAICode}
              onVisualizeCode={handleVisualizeCode}
              onToggleNotes={handleToggleNotes}
              showNotes={showNotes}
              notes={notes.get(activeFile?.path || '') || ''}
              onNotesChange={handleNotesChange}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Code Output Panel */}
          {isOutputExpand && (
            <div style={{ height: '300px', borderTop: '1px solid hsl(var(--b3))' }}>
              <CodeOutput
                isOutputExpand={isOutputExpand}
                codeOutput={codeOutput}
                loading={loading}
                codeStatus={codeStatus}
                onToggleOutputVisibility={handleToggleOutputVisibility}
                onRunCode={handleRunCode}
              />
            </div>
          )}

          {/* Status Bar */}
          <div className="vscode-status-bar">
            <div className="flex items-center space-x-4">
              <span>Room: {roomId}</span>
              <span>Users: {clients.length}</span>
              {activeFile && <span>{activeFile.name} • {activeFile.language}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <span>CodeFode AI Editor</span>
            </div>
          </div>
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
      <div className="vscode-container">
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center p-8">
            <div className="loading-spinner mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--bc))' }}>
              Loading session...
            </h2>
            <p className="text-lg" style={{ color: 'hsl(var(--bc) / 0.7)' }}>
              Please wait while we verify your authentication.
            </p>
          </div>
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
