# State Management

## 🎯 State Management Strategy

CodeFode uses React Context API combined with custom hooks for efficient state management across the application.

## 🏗️ Context Providers

### ActiveFileContext (`/context/ActiveFileContext.tsx`)

Manages the currently active file and file operations state.

**State Structure:**
```typescript
interface ActiveFileContextType {
  activeFile: IFile | null;
  setActiveFile: (file: IFile | null) => void;
  fileContent: string;
  setFileContent: (content: string) => void;
  isModified: boolean;
  setIsModified: (modified: boolean) => void;
  openFiles: IFile[];
  setOpenFiles: (files: IFile[]) => void;
}
```

**Key Features:**
- Track currently selected file
- Manage file content and modification state
- Handle multiple open files
- File dirty state tracking

**Usage:**
```typescript
const { activeFile, setActiveFile, fileContent } = useActiveFile();
```

### ChatContext (`/context/ChatContext.tsx`)

Handles real-time chat functionality and message state.

**State Structure:**
```typescript
interface ChatContextType {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  typingUsers: string[];
  setTypingUsers: (users: string[]) => void;
  unreadCount: number;
  markAsRead: () => void;
}
```

**Features:**
- Real-time message management
- Typing indicators
- Unread message tracking
- Message persistence

### FontSizeContext (`/context/FontSizeContext.tsx`)

Manages editor font size preferences with persistence.

**State Structure:**
```typescript
interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}
```

**Features:**
- Font size adjustment (12px - 24px)
- localStorage persistence
- Keyboard shortcuts support
- Accessibility compliance

### RoomContext (`/context/RoomContext.tsx`)

Manages collaborative room state and user interactions.

**State Structure:**
```typescript
interface RoomContextType {
  roomId: string;
  users: User[];
  currentUser: User | null;
  isConnected: boolean;
  fileStructure: FileNode;
  setFileStructure: (structure: FileNode) => void;
  userCursors: { [userId: string]: CursorPosition };
  updateUserCursor: (userId: string, position: CursorPosition) => void;
}
```

**Features:**
- Room connection management
- User presence tracking
- File structure synchronization
- Cursor position sharing

### ThemeContext (`/context/ThemeContext.tsx`)

Handles application theme state and preferences.

**State Structure:**
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  systemTheme: 'light' | 'dark';
}
```

**Features:**
- Light/dark theme switching
- System theme detection
- Theme persistence
- Smooth transitions

## 🪝 Custom Hooks

### useSocket (`/hooks/useSocket.ts`)

Manages Socket.IO connection and base event handling.

**Features:**
- Connection establishment and cleanup
- Reconnection logic
- Base event listeners
- Connection status tracking

**Usage:**
```typescript
const { socket, isConnected, connectionError } = useSocket();

useEffect(() => {
  if (socket) {
    socket.emit('join-room', roomId);
  }
}, [socket, roomId]);
```

### useRoomSocket (`/hooks/useRoomSocket.ts`)

Handles room-specific socket events and state synchronization.

**Events Handled:**
- `user-joined` - New user joins room
- `user-left` - User leaves room
- `file-changed` - File content updates
- `cursor-moved` - User cursor position changes
- `chat-message` - New chat messages

**Features:**
- Automatic event cleanup
- Error handling and recovery
- State synchronization
- Event debouncing

### useAISuggestion (`/hooks/useAISuggestion.ts`)

Manages AI-powered code suggestions and interactions.

**Features:**
- Code completion requests
- Error detection and fixes
- Code optimization suggestions
- AI chat functionality

**Usage:**
```typescript
const { 
  getSuggestions, 
  isLoading, 
  suggestions 
} = useAISuggestion();

const handleGetSuggestions = async () => {
  const suggestions = await getSuggestions(currentCode);
};
```

### useCursorManagement (`/hooks/useCursorManagement.ts`)

Handles multi-user cursor tracking and visualization.

**Features:**
- Real-time cursor position updates
- Cursor color assignment
- Position debouncing
- Cleanup on user disconnect

### useKeyboardShortcuts (`/hooks/useKeyboardShortcuts.ts`)

Manages application-wide keyboard shortcuts.

**Shortcuts:**
- `Ctrl+S` - Save current file
- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+F` - Find in file
- `Ctrl+/` - Toggle AI sidebar
- `Ctrl++/-` - Adjust font size

### useNotifications (`/hooks/useNotifications.ts`)

Handles toast notifications and user feedback.

**Features:**
- Success/error/warning notifications
- Auto-dismiss timers
- Queue management
- Position customization

**Usage:**
```typescript
const { showSuccess, showError, showWarning } = useNotifications();

const handleSave = async () => {
  try {
    await saveFile();
    showSuccess('File saved successfully!');
  } catch (error) {
    showError('Failed to save file');
  }
};
```

### useWorkspace (`/hooks/useWorkspace.ts`)

Manages workspace operations and file system interactions.

**Features:**
- File CRUD operations
- Folder management
- File search and filtering
- Workspace persistence

### useTraverseTree (`/hooks/useTraverseTree.ts`)

Utility hook for file tree navigation and manipulation.

**Features:**
- Tree traversal algorithms
- Node insertion and deletion
- Path resolution
- Tree validation

## 🔄 State Flow Architecture

### Data Flow Pattern
```
User Action → Component → Hook → Context → Socket.IO → Server
                ↓                                        ↓
        UI Update ← State Update ← Event Handler ← Server Response
```

### Example: File Selection Flow
1. User clicks file in FileExplorer
2. Component calls `setActiveFile()` from ActiveFileContext
3. Context updates state and triggers re-renders
4. Socket event emitted to notify other users
5. File content loaded and displayed in CodeEditor

### State Synchronization
- Local state updates happen immediately for responsiveness
- Remote state synchronization via Socket.IO events
- Conflict resolution for concurrent modifications
- Optimistic updates with rollback on failures

## 🎨 State Persistence

### localStorage Integration
- Theme preferences
- Font size settings
- Recent files list
- User preferences

### Session Storage
- Current file content (temporary)
- Unsaved changes backup
- Tab state preservation

### Server Persistence
- User authentication state
- Workspace configurations
- File content and structure
- Chat message history

## 🔐 State Security

### Data Validation
- Input sanitization before state updates
- Type checking with TypeScript
- Schema validation for complex objects

### Access Control
- User authentication checks
- Permission-based state access
- Secure state transmission

## 🚀 Performance Optimizations

### Re-render Prevention
```typescript
// Memoized context values
const contextValue = useMemo(() => ({
  activeFile,
  setActiveFile,
  fileContent,
  setFileContent
}), [activeFile, fileContent]);

// Memoized components
const MemoizedFileExplorer = React.memo(FileExplorer);
```

### State Splitting
- Separate contexts for different concerns
- Granular state updates
- Selective component subscriptions

### Batching Updates
```typescript
// Batch multiple state updates
const updateFileState = useCallback((file: IFile, content: string) => {
  startTransition(() => {
    setActiveFile(file);
    setFileContent(content);
    setIsModified(false);
  });
}, []);
```

## 🧪 Testing State Management

### Context Testing
```typescript
const renderWithContext = (component: ReactElement) => {
  return render(
    <ActiveFileProvider>
      <RoomProvider>
        {component}
      </RoomProvider>
    </ActiveFileProvider>
  );
};
```

### Hook Testing
```typescript
const { result } = renderHook(() => useActiveFile(), {
  wrapper: ActiveFileProvider
});

act(() => {
  result.current.setActiveFile(mockFile);
});

expect(result.current.activeFile).toBe(mockFile);
```

### Integration Testing
- End-to-end state flow testing
- Socket event simulation
- Multi-component interaction testing