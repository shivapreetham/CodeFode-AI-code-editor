# 🔌 Socket Events Reference

Complete guide to Socket.IO real-time communication events in CodeFode.

## 🌐 Connection Setup

### Client Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  transports: ['websocket', 'polling'],
  timeout: 15000,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Server Configuration
```javascript
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## 🏠 Room Management Events

### Join Room
User joins a collaborative room.

**Client Emit:**
```javascript
socket.emit('join', {
  roomId: 'room-123',
  username: 'john@example.com'
});
```

**Server Response:**
```javascript
socket.on('joined', (data) => {
  console.log('Joined room:', data);
  // data = {
  //   clients: [
  //     { socketId: 'abc123', username: 'john@example.com' },
  //     { socketId: 'def456', username: 'jane@example.com' }
  //   ],
  //   username: 'john@example.com',
  //   socketId: 'abc123'
  // }
});
```

**Server Broadcast to Room:**
All users in the room receive updates about new users.

**Validation:**
- `roomId`: Required string, 1-100 characters, alphanumeric with dashes/underscores
- `username`: Required string, 1-50 characters

**Rate Limit:** 5 joins per minute per socket

### Leave Room
User leaves the current room.

**Client Emit:**
```javascript
socket.emit('leave', {
  roomId: 'room-123'
});
```

**Server Broadcast:**
```javascript
socket.on('disconnected', (data) => {
  console.log('User left:', data);
  // data = {
  //   socketId: 'abc123',
  //   username: 'john@example.com'
  // }
});
```

### User Disconnection
Automatically triggered when user closes browser or loses connection.

**Server Broadcast:**
```javascript
socket.on('disconnected', (data) => {
  // Handle user disconnection
  // Update user presence indicators
  // Clean up user-specific data
});
```

## 📝 Code Collaboration Events

### Code Change
Real-time code synchronization between users.

**Client Emit:**
```javascript
socket.emit('code-change', {
  roomId: 'room-123',
  payload: {
    filePath: '/root/index.js',
    content: 'console.log("Hello World");',
    operation: 'insert', // or 'delete', 'replace'
    position: { line: 1, ch: 0 },
    length: 25
  }
});
```

**Server Broadcast to Other Users:**
```javascript
socket.on('code-change', (data) => {
  console.log('Code updated:', data);
  // data = {
  //   payload: {
  //     filePath: '/root/index.js',
  //     content: 'console.log("Hello World");',
  //     operation: 'insert',
  //     position: { line: 1, ch: 0 },
  //     length: 25
  //   }
  // }
});
```

**Rate Limit:** 50 changes per 10 seconds per socket

### Code Synchronization
Force sync code state across all users.

**Client Emit:**
```javascript
socket.emit('sync-code', {
  roomId: 'room-123',
  filePath: '/root/index.js',
  content: 'complete file content...',
  version: 123
});
```

**Server Broadcast:**
```javascript
socket.on('sync-code', (data) => {
  // Sync editor content with received data
  editor.setValue(data.content);
});
```

## 👆 Cursor Tracking Events

### Cursor Position Change
Track cursor positions of all users in real-time.

**Client Emit:**
```javascript
socket.emit('cursor-change', {
  roomId: 'room-123',
  username: 'john@example.com',
  position: {
    line: 5,
    ch: 12
  },
  filePath: '/root/index.js'
});
```

**Server Broadcast to Other Users:**
```javascript
socket.on('cursor-change', (data) => {
  console.log('Cursor moved:', data);
  // data = {
  //   userId: 'abc123',
  //   username: 'john@example.com',
  //   position: { line: 5, ch: 12 },
  //   filePath: '/root/index.js'
  // }
  
  // Update cursor indicators in editor
  updateRemoteCursor(data.userId, data.position, data.username);
});
```

**Validation:**
- `position.line`: Required number >= 0
- `position.ch`: Required number >= 0  
- `filePath`: Optional string

**Rate Limit:** 30 cursor changes per 10 seconds (silent ignore if exceeded)

## 💬 Chat Communication Events

### Send Message
Send chat messages to room participants.

**Client Emit:**
```javascript
socket.emit('send-message', {
  roomId: 'room-123',
  message: 'Hello everyone!',
  username: 'john@example.com',
  timestamp: Date.now(), // Must be number, not ISO string
  toSocketId: 'def456' // Optional: for private messages
});
```

**Server Broadcast:**
```javascript
socket.on('receive-message', (data) => {
  console.log('New message:', data);
  // data = {
  //   sender: 'john@example.com',
  //   text: 'Hello everyone!',
  //   timestamp: 1640995200000,
  //   private: false,
  //   socketId: 'abc123'
  // }
  
  // Add message to chat interface
  addMessageToChat(data);
});
```

**Validation:**
- `message`: Required string, 1-1000 characters
- `username`: Required string, 1-50 characters
- `timestamp`: Required number (Unix timestamp)
- `toSocketId`: Optional string for private messages

**Rate Limit:** 20 messages per minute per socket

### Get Message History
Load existing chat messages when joining a room.

**Client Emit:**
```javascript
socket.emit('get-messages', {
  roomId: 'room-123'
});
```

**Server Response:**
```javascript
socket.on('load-messages', (messages) => {
  console.log('Message history:', messages);
  // messages = [
  //   {
  //     sender: 'jane@example.com',
  //     text: 'Welcome to the room!',
  //     timestamp: 1640995100000,
  //     private: false,
  //     socketId: 'def456'
  //   },
  //   // ... more messages (last 100 messages)
  // ]
  
  // Load messages into chat interface
  loadChatHistory(messages);
});
```

**Message Storage:**
- Last 100 messages per room are stored in memory
- Messages are not persisted to database
- Private messages are not included in history

## 🏃‍♂️ Code Execution Events

### Execute Code
Run code in a secure container environment.

**Client Emit:**
```javascript
socket.emit('execute-code', {
  language: 'javascript',
  code: 'console.log("Hello World");'
});
```

**Server Response:**
```javascript
socket.on('code-result', (result) => {
  console.log('Execution result:', result);
  // result = {
  //   success: true,
  //   output: 'Hello World\n',
  //   timestamp: '2024-01-01T00:00:00.000Z',
  //   metadata: {
  //     language: 'javascript',
  //     executedAt: '2024-01-01T00:00:00.000Z',
  //     codeLength: 25
  //   }
  // }
  
  // Display result in terminal/output panel
  displayExecutionResult(result);
});
```

**Supported Languages:**
- `javascript` - Node.js execution
- `python` - Python 3
- `cpp` - C++ with g++ compiler

**Validation:**
- `language`: Required string, must be supported language
- `code`: Required string, 1-10,000 characters

**Rate Limit:** 5 executions per minute per socket

**Security Features:**
- Sandboxed execution environment
- 5-second timeout limit
- Memory and CPU restrictions
- No network access from code

### Code Execution Error
When code execution fails or times out.

**Server Response:**
```javascript
socket.on('code-result', (result) => {
  if (!result.success) {
    console.error('Execution failed:', result);
    // result = {
    //   success: false,
    //   output: 'SyntaxError: Unexpected token',
    //   timestamp: '2024-01-01T00:00:00.000Z'
    // }
  }
});
```

## ⚠️ Error Handling Events

### Socket Errors
General socket connection and validation errors.

**Client Listener:**
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // error = {
  //   message: 'Invalid data for send-message: Expected number, received string',
  //   event: 'send-message',
  //   timestamp: '2024-01-01T00:00:00.000Z'
  // }
  
  // Display error to user
  showErrorNotification(error.message);
});
```

**Common Error Types:**
- **Validation Error**: Invalid event data
- **Rate Limit Error**: Too many requests
- **Authentication Error**: Invalid room access
- **Connection Error**: Network issues

### Connection Events
Track connection status changes.

**Client Listeners:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  setConnectionStatus('connected');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  setConnectionStatus('disconnected');
  
  // Handle different disconnect reasons
  if (reason === 'io server disconnect') {
    // Server forcibly disconnected the socket
    // Try to reconnect manually
    socket.connect();
  }
  // else: client disconnected or network issues
  // automatic reconnection will be attempted
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  setConnectionStatus('connected');
  
  // Re-join room if previously in one
  if (currentRoomId) {
    socket.emit('join', { roomId: currentRoomId, username });
  }
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection failed:', error);
  setConnectionStatus('reconnecting');
});
```

## 🔒 Security & Validation

### Input Validation
All socket events are validated using Zod schemas:

```javascript
// Example validation schema
const joinRoomSchema = z.object({
  roomId: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  username: z.string().min(1).max(50)
});
```

### Rate Limiting
Events are rate-limited to prevent abuse:

```javascript
// Rate limiting implementation
const rateLimiter = new Map();

const isAllowed = (socketId, action, limit = 10, windowMs = 60000) => {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  
  // ... rate limiting logic
  
  return allowed;
};
```

### Room Authorization
Users must be in a room to perform room-specific actions:

```javascript
// Authorization check
if (userRoomMap[socket.id] !== roomId) {
  socket.emit('error', {
    message: 'Not authorized for this room',
    event: eventName
  });
  return;
}
```

## 📊 Performance Considerations

### Event Frequency
- **Cursor events**: High frequency, not logged
- **Code changes**: Medium frequency, logged
- **Chat messages**: Low frequency, stored in memory
- **Code execution**: Low frequency, resource intensive

### Memory Management
- Room state is stored in memory for fast access
- Message history is limited to last 100 messages per room
- User maps are cleaned up on disconnection
- Rate limiting data is periodically cleaned

### Scaling Considerations
For production scaling:
- Use Redis adapter for multi-server Socket.IO
- Implement persistent message storage
- Add horizontal scaling for code execution
- Monitor memory usage and connection counts

## 🧪 Testing Socket Events

### Manual Testing with Browser Console
```javascript
// Connect to server
const socket = io('http://localhost:8000');

// Test join room
socket.emit('join', { roomId: 'test', username: 'testuser' });

// Test code change
socket.emit('code-change', {
  roomId: 'test',
  payload: { filePath: '/test.js', content: 'console.log("test");' }
});

// Listen for events
socket.on('joined', (data) => console.log('Joined:', data));
socket.on('code-change', (data) => console.log('Code changed:', data));
```

### Automated Testing
```javascript
// Using socket.io-client in tests
const client = require('socket.io-client');

describe('Socket Events', () => {
  let socket;
  
  beforeEach(() => {
    socket = client('http://localhost:8000');
  });
  
  afterEach(() => {
    socket.disconnect();
  });
  
  test('join room event', (done) => {
    socket.emit('join', { roomId: 'test', username: 'testuser' });
    
    socket.on('joined', (data) => {
      expect(data.username).toBe('testuser');
      done();
    });
  });
});
```

## 📚 Related Documentation

- **[API Reference](./api.md)** - REST API endpoints
- **[Database](./database.md)** - Data persistence
- **[Client Real-time Features](../client/realtime.md)** - Frontend Socket.IO integration