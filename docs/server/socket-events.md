# Socket Events Documentation

## 🔌 Socket.IO Real-time Events

CodeFode uses Socket.IO for real-time collaboration, enabling multiple users to work together seamlessly in shared coding environments.

## 🏗️ Event Architecture

### Event Categories

1. **Room Management** - User joining/leaving rooms
2. **Code Collaboration** - Real-time code synchronization
3. **Communication** - Chat and messaging
4. **Cursor Tracking** - Multi-user cursor positions
5. **Code Execution** - Running code in real-time
6. **File Activity** - File operations tracking
7. **Notifications** - Activity notifications
8. **Whiteboard** - Drawing and collaboration
9. **Mouse Tracking** - Real-time pointer positions

### Event Naming Convention

Events follow the pattern: `CATEGORY_ACTION`
- Example: `CODE_CHANGE`, `USER_JOINED`, `CURSOR_MOVE`

## 🚪 Room Management Events

### JOIN

**Direction:** Client → Server

**Description:** User joins a collaborative room

**Payload:**
```javascript
{
  roomId: "string",     // Unique room identifier
  username: "string"    // Display name of the user
}
```

**Server Response Events:**
- `JOINED` - Confirmation of successful join
- `LOAD_MESSAGES` - Historical chat messages for the room

**Example:**
```javascript
socket.emit('JOIN', {
  roomId: 'room-abc123',
  username: 'john_doe'
});
```

### JOINED

**Direction:** Server → All Clients in Room

**Description:** Notifies all room participants when a new user joins

**Payload:**
```javascript
{
  clients: [
    {
      socketId: "string",
      username: "string"
    }
  ],
  username: "string",   // Username of the user who joined
  socketId: "string"    // Socket ID of the new user
}
```

### DISCONNECTED

**Direction:** Server → All Clients in Room

**Description:** Notifies room participants when a user disconnects

**Payload:**
```javascript
{
  socketId: "string",
  username: "string"
}
```

## 💻 Code Collaboration Events

### CODE_CHANGE

**Direction:** Bidirectional (Client ↔ Server ↔ Other Clients)

**Description:** Synchronizes code changes across all room participants

**Client → Server Payload:**
```javascript
{
  roomId: "string",
  payload: {
    fileId: "string",           // Unique file identifier
    content: "string",          // Updated file content
    changes: [                  // Optional: granular changes
      {
        range: {
          startLine: "number",
          startColumn: "number", 
          endLine: "number",
          endColumn: "number"
        },
        text: "string",
        operation: "insert|delete|replace"
      }
    ],
    userId: "string",           // User making the change
    timestamp: "number"         // Unix timestamp
  }
}
```

**Server → Other Clients Payload:**
```javascript
{
  payload: {
    fileId: "string",
    content: "string",
    changes: "array",
    userId: "string", 
    timestamp: "number"
  }
}
```

**Usage Example:**
```javascript
// Client sending code change
socket.emit('CODE_CHANGE', {
  roomId: currentRoom,
  payload: {
    fileId: 'main.js',
    content: updatedCode,
    userId: currentUser.id,
    timestamp: Date.now()
  }
});

// Client receiving code change
socket.on('CODE_CHANGE', ({ payload }) => {
  if (payload.userId !== currentUser.id) {
    updateEditorContent(payload.content);
  }
});
```

## 👆 Cursor Tracking Events

### CURSOR_CHANGE

**Direction:** Bidirectional (Client ↔ Server ↔ Other Clients)

**Description:** Synchronizes cursor positions across all users in real-time

**Client → Server Payload:**
```javascript
{
  roomId: "string",
  username: "string",
  position: {
    line: "number",           // Line number (1-based)
    column: "number",         // Column number (1-based)
    selection: {              // Optional: text selection
      startLine: "number",
      startColumn: "number",
      endLine: "number", 
      endColumn: "number"
    }
  },
  filePath: "string",         // Current file path
  color: "string"             // User's cursor color
}
```

**Server → Other Clients Payload:**
```javascript
{
  username: "string",
  position: "object",
  filePath: "string",
  color: "string"
}
```

**Implementation:**
```javascript
// Send cursor position update
const handleCursorPositionChange = (position) => {
  socket.emit('CURSOR_CHANGE', {
    roomId: currentRoom,
    username: currentUser.name,
    position: {
      line: position.lineNumber,
      column: position.column
    },
    filePath: currentFile.path,
    color: currentUser.cursorColor
  });
};

// Receive cursor updates from other users
socket.on('CURSOR_CHANGE', ({ username, position, filePath, color }) => {
  updateCursorDisplay(username, position, filePath, color);
});
```

## 💬 Chat and Communication Events

### SEND_MESSAGE

**Direction:** Client → Server

**Description:** Sends a chat message to the room

**Payload:**
```javascript
{
  roomId: "string",
  message: "string",          // Message content
  username: "string",         // Sender's username
  timestamp: "number",        // Unix timestamp
  toSocketId: "string"        // Optional: for private messages
}
```

### RECEIVE_MESSAGE

**Direction:** Server → All Clients in Room

**Description:** Broadcasts chat message to all room participants

**Payload:**
```javascript
{
  sender: "string",           // Username of sender
  text: "string",             // Message content
  timestamp: "number",        // Unix timestamp
  private: "boolean"          // Whether it's a private message
}
```

### GET_MESSAGES

**Direction:** Client → Server

**Description:** Requests chat message history for a room

**Payload:**
```javascript
{
  roomId: "string"
}
```

### LOAD_MESSAGES

**Direction:** Server → Client

**Description:** Sends chat message history to requesting client

**Payload:**
```javascript
[
  {
    sender: "string",
    text: "string", 
    timestamp: "number",
    private: "boolean"
  }
]
```

**Chat Implementation:**
```javascript
// Send message
const sendMessage = (messageText) => {
  socket.emit('SEND_MESSAGE', {
    roomId: currentRoom,
    message: messageText,
    username: currentUser.name,
    timestamp: Date.now()
  });
};

// Receive messages
socket.on('RECEIVE_MESSAGE', (messageData) => {
  addMessageToChat(messageData);
  updateUnreadCount();
});

// Load message history
socket.emit('GET_MESSAGES', { roomId: currentRoom });
socket.on('LOAD_MESSAGES', (messages) => {
  setChatHistory(messages);
});
```

## ⚡ Code Execution Events

### EXECUTE_CODE

**Direction:** Client → Server

**Description:** Requests code execution in a sandboxed environment

**Payload:**
```javascript
{
  language: "string",         // Programming language
  code: "string",             // Code to execute
  input: "string",            // Optional: stdin input
  args: ["string"],           // Optional: command line arguments
  timeout: "number"           // Optional: execution timeout (ms)
}
```

**Supported Languages:**
- `javascript`
- `python`
- `java`
- `cpp`
- `c`
- `go`
- `rust`
- `php`
- `ruby`

### CODE_RESULT

**Direction:** Server → Client

**Description:** Returns the result of code execution

**Success Payload:**
```javascript
{
  success: true,
  output: "string",           // Program output (stdout)
  error: "string",            // Error output (stderr)
  executionTime: "number",    // Execution time in milliseconds
  memoryUsage: "number",      // Memory usage in bytes
  exitCode: "number"          // Program exit code
}
```

**Error Payload:**
```javascript
{
  success: false,
  output: "string",           // Error message
  error: "string",            // Detailed error information
  code: "ERROR_CODE"          // Error classification
}
```

**Rate Limiting:**
- Maximum 1 execution per second per user
- Automatic rate limiting with error messages

**Implementation:**
```javascript
// Execute code
const executeCode = (language, code) => {
  socket.emit('EXECUTE_CODE', {
    language: language,
    code: code,
    timeout: 5000  // 5 second timeout
  });
};

// Handle execution result
socket.on('CODE_RESULT', (result) => {
  if (result.success) {
    displayOutput(result.output);
    updateExecutionStats(result.executionTime, result.memoryUsage);
  } else {
    displayError(result.output);
  }
});
```

## 🔗 Connection Management Events

### connect

**Direction:** Server → Client

**Description:** Fired when client successfully connects to server

**Usage:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  setConnectionStatus('connected');
});
```

### disconnect

**Direction:** Server → Client

**Description:** Fired when client disconnects from server

**Payload:**
```javascript
{
  reason: "string"            // Disconnection reason
}
```

**Usage:**
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  setConnectionStatus('disconnected');
  handleReconnection();
});
```

### connect_error

**Direction:** Server → Client

**Description:** Fired when connection attempt fails

**Payload:**
```javascript
{
  message: "string",          // Error message
  description: "string",      // Detailed description
  type: "string"              // Error type
}
```

### reconnect

**Direction:** Server → Client

**Description:** Fired when client successfully reconnects

**Usage:**
```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  rejoinRoom();
  syncState();
});
```

## 🛡️ Security and Rate Limiting

### Rate Limiting Implementation

**Code Execution Rate Limiting:**
```javascript
const rateLimiter = new Map();

socket.on('EXECUTE_CODE', async (data) => {
  const now = Date.now();
  const lastExecution = rateLimiter.get(socket.id) || 0;
  
  if (now - lastExecution < 1000) {
    socket.emit('CODE_RESULT', {
      success: false,
      output: "Please wait before executing more code"
    });
    return;
  }
  
  rateLimiter.set(socket.id, now);
  // Execute code...
});
```

### Input Validation

**Message Sanitization:**
```javascript
const sanitizeMessage = (message) => {
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .substring(0, 1000); // Limit message length
};
```

### Authentication

**Room Access Control:**
```javascript
socket.on('JOIN', ({ roomId, username, token }) => {
  // Verify user authentication
  if (!verifyToken(token)) {
    socket.emit('error', { message: 'Authentication required' });
    return;
  }
  
  // Verify room access permissions
  if (!hasRoomAccess(userId, roomId)) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }
  
  // Join room
  socket.join(roomId);
});
```

## 📊 Error Handling

### Standard Error Format

```javascript
{
  error: "string",            // Error type
  message: "string",          // Human-readable message
  code: "string",             // Error code for client handling
  details: "object"           // Additional error details
}
```

### Common Error Codes

- `ROOM_NOT_FOUND` - Room doesn't exist
- `ACCESS_DENIED` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `INVALID_DATA` - Malformed request data
- `EXECUTION_FAILED` - Code execution error
- `CONNECTION_ERROR` - Network connectivity issues

### Client Error Handling

```javascript
socket.on('error', (error) => {
  switch (error.code) {
    case 'RATE_LIMITED':
      showNotification('Too many requests. Please slow down.');
      break;
    case 'ACCESS_DENIED':
      redirectToLogin();
      break;
    default:
      showError(error.message);
  }
});
```

## 📁 File Activity Events

### FILE_OPENED
**Direction:** Client → Server → All Clients in Room
**Description:** Notifies when a user opens a file

**Client → Server Payload:**
```javascript
{
  roomId: "string",
  username: "string", 
  filePath: "string",
  fileName: "string",
  language: "string",
  timestamp: "number"
}
```

### FILE_EDIT_START
**Direction:** Client → Server → All Clients in Room
**Description:** Notifies when a user starts editing a file

### FILE_EDIT_END
**Direction:** Client → Server → All Clients in Room
**Description:** Notifies when a user stops editing a file
**Includes duration metadata**

## 🔔 Notification Events

### NOTIFICATION_ADDED
**Direction:** Server → All Clients in Room
**Description:** Broadcasts new activity notifications

**Payload:**
```javascript
{
  notification: {
    type: "FILE_OPEN|FILE_EDIT_START|FILE_EDIT_END|WHITEBOARD_DRAW|WHITEBOARD_CLEAR",
    message: "string",
    username: "string",
    timestamp: "Date",
    metadata: {
      path: "string",
      language: "string", 
      action: "string",
      duration: "number"
    }
  }
}
```

## 🎨 Whiteboard Events

### WHITEBOARD_DRAW
**Direction:** Client → Server → Other Clients in Room
**Description:** Synchronizes drawing actions

**Payload:**
```javascript
{
  roomId: "string",
  username: "string",
  type: "path|object|text",
  data: "any",
  timestamp: "number"
}
```

### WHITEBOARD_CLEAR
**Direction:** Client → Server → Other Clients in Room  
**Description:** Clears the whiteboard

### WHITEBOARD_LOAD
**Direction:** Client → Server
**Description:** Loads saved whiteboard data

**Response:**
```javascript
{
  canvasData: "object|null",
  metadata: {
    width: "number",
    height: "number", 
    background: "string"
  }
}
```

## 🖱️ Mouse Tracking Events

### MOUSE_POINTER_MOVE
**Direction:** Client → Server → Other Clients in Room
**Description:** Real-time mouse cursor positions

**Payload:**
```javascript
{
  roomId: "string",
  username: "string",
  x: "number",
  y: "number", 
  timestamp: "number"
}
```

## 🛡️ Rate Limiting

- **Code Execution:** 5 requests/minute
- **Mouse Pointer:** 60 requests/10 seconds
- **Whiteboard Draw:** 100 requests/10 seconds
- **Chat Messages:** 20 requests/minute
- **Code Changes:** 50 requests/10 seconds
- **Cursor Changes:** 30 requests/10 seconds

## 📊 Client Implementation Example

```javascript
// Listen for notifications
socket.on('NOTIFICATION_ADDED', ({ notification }) => {
  addNotificationToUI(notification);
});

// File tracking
socket.emit('FILE_OPENED', {
  roomId: currentRoom,
  username: currentUser,
  filePath: file.path,
  fileName: file.name,
  language: file.language,
  timestamp: Date.now()
});

// Whiteboard events
socket.on('WHITEBOARD_DRAW', ({ username, type, data }) => {
  if (username !== currentUser) {
    drawOnCanvas(type, data);
  }
});
```