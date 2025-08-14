# Real-time Features

## 🚀 Real-time Architecture

CodeFode's real-time functionality is powered by Socket.IO, enabling seamless collaboration between multiple users in shared coding environments.

## 🔌 Socket.IO Implementation

### Client-Side Socket Setup (`/socket.tsx`)

The client-side socket connection is established and managed through a centralized socket module.

**Connection Configuration:**
```typescript
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

**Features:**
- Automatic reconnection on connection loss
- Transport fallback (WebSocket → Polling)
- Connection state monitoring
- Error handling and recovery

### Socket Context Integration

**Socket Provider:**
```typescript
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
```

## 👥 Collaborative Editing

### Real-time Code Synchronization

**Event Flow:**
1. User types in Monaco Editor
2. Change event captured with debouncing
3. Socket event emitted to server
4. Server broadcasts to all room participants
5. Other clients receive and apply changes

**Code Change Handler:**
```typescript
const handleCodeChange = useCallback((value: string) => {
  setFileContent(value);
  setIsModified(true);
  
  // Debounce socket emission
  const debouncedEmit = debounce(() => {
    socket?.emit('code-change', {
      roomId,
      fileId: activeFile?.id,
      content: value,
      userId: user?.id,
      timestamp: Date.now()
    });
  }, 300);
  
  debouncedEmit();
}, [socket, roomId, activeFile, user]);
```

### Conflict Resolution

**Operational Transformation:**
- Character-level change tracking
- Position-aware transformations
- Conflict resolution algorithms
- Consistency maintenance

**Implementation:**
```typescript
const applyOperation = (operation: Operation, currentContent: string) => {
  const { type, position, content, length } = operation;
  
  switch (type) {
    case 'insert':
      return currentContent.slice(0, position) + 
             content + 
             currentContent.slice(position);
             
    case 'delete':
      return currentContent.slice(0, position) + 
             currentContent.slice(position + length);
             
    case 'replace':
      return currentContent.slice(0, position) + 
             content + 
             currentContent.slice(position + length);
  }
};
```

## 👁️ Cursor Tracking

### Multi-User Cursor Visualization

**Cursor Data Structure:**
```typescript
interface CursorPosition {
  userId: string;
  position: {
    lineNumber: number;
    column: number;
  };
  color: string;
  username: string;
  timestamp: number;
}
```

**Cursor Movement Handler:**
```typescript
const handleCursorPositionChange = useCallback((position: monaco.Position) => {
  const cursorData: CursorPosition = {
    userId: user?.id!,
    position: {
      lineNumber: position.lineNumber,
      column: position.column
    },
    color: userColor,
    username: user?.name!,
    timestamp: Date.now()
  };
  
  socket?.emit('cursor-move', {
    roomId,
    fileId: activeFile?.id,
    cursor: cursorData
  });
}, [socket, roomId, activeFile, user, userColor]);
```

### Cursor Rendering

**Monaco Editor Decorations:**
```typescript
const updateCursorDecorations = useCallback((cursors: CursorPosition[]) => {
  const decorations = cursors.map(cursor => ({
    range: new monaco.Range(
      cursor.position.lineNumber,
      cursor.position.column,
      cursor.position.lineNumber,
      cursor.position.column + 1
    ),
    options: {
      className: `cursor-${cursor.userId}`,
      hoverMessage: { value: cursor.username },
      afterContentClassName: `cursor-indicator-${cursor.userId}`
    }
  }));
  
  editorRef.current?.deltaDecorations([], decorations);
}, []);
```

## 💬 Real-time Chat

### Chat Message Structure

```typescript
interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'code';
  roomId: string;
}
```

### Message Handling

**Send Message:**
```typescript
const sendMessage = useCallback((content: string) => {
  const message: ChatMessage = {
    id: generateId(),
    userId: user?.id!,
    username: user?.name!,
    content,
    timestamp: Date.now(),
    type: 'text',
    roomId
  };
  
  socket?.emit('chat-message', message);
  setMessages(prev => [...prev, message]);
}, [socket, user, roomId]);
```

**Receive Messages:**
```typescript
useEffect(() => {
  socket?.on('chat-message', (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    setUnreadCount(prev => prev + 1);
    
    // Show notification if chat is not visible
    if (!isChatVisible) {
      showNotification(`${message.username}: ${message.content}`);
    }
  });
  
  return () => {
    socket?.off('chat-message');
  };
}, [socket, isChatVisible]);
```

### Typing Indicators

**Typing Status Management:**
```typescript
const handleTypingStart = useCallback(() => {
  setIsTyping(true);
  socket?.emit('typing-start', { roomId, userId: user?.id, username: user?.name });
  
  // Auto-stop typing after 3 seconds of inactivity
  clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false);
    socket?.emit('typing-stop', { roomId, userId: user?.id });
  }, 3000);
}, [socket, roomId, user]);
```

## 🏃‍♂️ User Presence

### Presence Tracking

**User Status Types:**
- `online` - Actively present in room
- `away` - Inactive for 5+ minutes
- `offline` - Disconnected from room

**Presence Management:**
```typescript
const updatePresence = useCallback((status: PresenceStatus) => {
  socket?.emit('presence-update', {
    roomId,
    userId: user?.id,
    status,
    lastSeen: Date.now()
  });
}, [socket, roomId, user]);

// Activity detection
useEffect(() => {
  const handleActivity = () => {
    updatePresence('online');
    resetInactivityTimer();
  };
  
  window.addEventListener('mousemove', handleActivity);
  window.addEventListener('keypress', handleActivity);
  
  return () => {
    window.removeEventListener('mousemove', handleActivity);
    window.removeEventListener('keypress', handleActivity);
  };
}, [updatePresence]);
```

### User List Management

**Connected Users Display:**
```typescript
const ConnectedUsers = ({ users }: { users: User[] }) => {
  return (
    <div className="user-list">
      {users.map(user => (
        <div key={user.id} className="user-item">
          <Avatar 
            src={user.avatar} 
            name={user.name}
            color={user.color}
            status={user.presence}
          />
          <span className="username">{user.name}</span>
          <PresenceIndicator status={user.presence} />
        </div>
      ))}
    </div>
  );
};
```

## 📁 File Operations

### Real-time File Synchronization

**File Structure Updates:**
```typescript
const handleFileStructureChange = useCallback((operation: FileOperation) => {
  switch (operation.type) {
    case 'create':
      socket?.emit('file-create', {
        roomId,
        path: operation.path,
        type: operation.fileType,
        content: operation.content || ''
      });
      break;
      
    case 'delete':
      socket?.emit('file-delete', {
        roomId,
        path: operation.path
      });
      break;
      
    case 'rename':
      socket?.emit('file-rename', {
        roomId,
        oldPath: operation.oldPath,
        newPath: operation.newPath
      });
      break;
  }
}, [socket, roomId]);
```

### File Change Broadcasting

**File Content Updates:**
```typescript
useEffect(() => {
  socket?.on('file-updated', ({ fileId, content, userId }) => {
    if (userId !== user?.id && fileId === activeFile?.id) {
      // Update content without triggering our own change handler
      setFileContent(content);
      
      // Show notification about external changes
      showNotification(`File updated by ${getUserName(userId)}`);
    }
  });
  
  return () => {
    socket?.off('file-updated');
  };
}, [socket, user, activeFile]);
```

## 📊 Activity Logging

### Activity Tracking

**Activity Types:**
- File operations (create, edit, delete, rename)
- User actions (join, leave, chat)
- Code changes and saves
- AI interactions

**Activity Logger:**
```typescript
const logActivity = useCallback((activity: Activity) => {
  const activityData = {
    id: generateId(),
    userId: user?.id,
    username: user?.name,
    type: activity.type,
    description: activity.description,
    timestamp: Date.now(),
    roomId,
    metadata: activity.metadata
  };
  
  socket?.emit('activity-log', activityData);
  setActivityLog(prev => [activityData, ...prev.slice(0, 99)]); // Keep last 100
}, [socket, user, roomId]);
```

### Activity Display

**Activity Feed Component:**
```typescript
const ActivityFeed = ({ activities }: { activities: Activity[] }) => {
  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <div className="activity-icon">
            <ActivityIcon type={activity.type} />
          </div>
          <div className="activity-content">
            <span className="username">{activity.username}</span>
            <span className="description">{activity.description}</span>
            <time className="timestamp">
              {formatRelativeTime(activity.timestamp)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🔄 Connection Management

### Reconnection Handling

**Automatic Reconnection:**
```typescript
useEffect(() => {
  socket?.on('reconnect', () => {
    // Rejoin room
    socket.emit('join-room', roomId);
    
    // Sync current state
    socket.emit('sync-request', {
      roomId,
      lastSyncTime: lastSyncTimeRef.current
    });
    
    showNotification('Reconnected to room');
  });
  
  socket?.on('reconnect_failed', () => {
    showError('Failed to reconnect. Please refresh the page.');
  });
  
  return () => {
    socket?.off('reconnect');
    socket?.off('reconnect_failed');
  };
}, [socket, roomId]);
```

### State Synchronization

**Sync on Reconnect:**
```typescript
const handleSyncResponse = useCallback((syncData: SyncData) => {
  // Update file structure
  setFileStructure(syncData.fileStructure);
  
  // Update user list
  setUsers(syncData.users);
  
  // Update chat messages
  setMessages(syncData.messages);
  
  // Update activity log
  setActivityLog(syncData.activities);
  
  lastSyncTimeRef.current = Date.now();
}, []);
```

## 🛡️ Security Considerations

### Event Validation

**Server-Side Validation:**
- User authentication verification
- Room access permission checks
- Input sanitization and validation
- Rate limiting on events

**Client-Side Protection:**
- XSS prevention in chat messages
- File content sanitization
- User input validation

### Performance Optimizations

**Debouncing and Throttling:**
```typescript
// Debounce code changes
const debouncedCodeChange = useMemo(
  () => debounce(handleCodeChange, 300),
  [handleCodeChange]
);

// Throttle cursor movements
const throttledCursorMove = useMemo(
  () => throttle(handleCursorMove, 100),
  [handleCursorMove]
);
```

**Event Cleanup:**
```typescript
useEffect(() => {
  return () => {
    // Clean up all event listeners
    socket?.off('code-change');
    socket?.off('cursor-move');
    socket?.off('chat-message');
    socket?.off('user-joined');
    socket?.off('user-left');
  };
}, [socket]);
```