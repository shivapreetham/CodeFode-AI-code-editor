# Server-Side Overview

## 🎯 Architecture

CodeFode's backend is built with Express.js and provides a robust foundation for real-time collaborative code editing, AI integration, and workspace management.

## 🏗️ Project Structure

```
server/
├── src/
│   ├── constants/
│   │   └── actions.js          # Socket.IO event constants
│   ├── controllers/
│   │   ├── aiCodeController.js      # AI integration logic
│   │   ├── notificationController.js # Notification handling
│   │   ├── runInContainer.js        # Code execution engine
│   │   ├── userControllers.js       # User management
│   │   └── workspaceController.js   # Workspace operations
│   ├── db/
│   │   └── dbconn.js               # MongoDB connection
│   ├── models/
│   │   └── workspace.js            # Database schemas
│   ├── routes/
│   │   ├── aiRoutes.js             # AI service endpoints
│   │   ├── notificationRoutes.js   # Notification API
│   │   ├── userRoutes.js           # User management API
│   │   └── workspaceRoutes.js      # Workspace API
│   ├── socket/
│   │   └── initsocket.js           # Socket.IO configuration
│   └── index.js                    # Application entry point
├── Dockerfile                      # Container configuration
├── package.json                    # Dependencies and scripts
└── vercel.json                     # Deployment configuration
```

## 🔧 Core Technologies

### Backend Framework
- **Express.js** - Web application framework
- **Node.js** - JavaScript runtime environment
- **ES Modules** - Modern JavaScript module system

### Database
- **MongoDB** - Document-based database
- **Mongoose** - MongoDB object modeling

### Real-time Communication
- **Socket.IO** - WebSocket communication library
- **HTTP Server** - Built-in Node.js HTTP server

### AI Integration
- **Cohere AI SDK** - AI code assistance
- **Google Generative AI** - Alternative AI provider
- **Zod** - Schema validation

### Additional Libraries
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **Bull** - Job queue for background tasks

## 🚀 Server Configuration

### Application Setup (`/src/index.js`)

The main server file configures Express.js application with middleware and routing.

**Key Features:**
- Express.js server initialization
- CORS configuration for cross-origin requests
- JSON body parsing middleware
- Route mounting for different API modules
- MongoDB connection establishment
- Socket.IO server integration

**Configuration:**
```javascript
import express from "express"
import dotenv from "dotenv"
import cors from 'cors'
import { app, server } from "./socket/initsocket.js";

dotenv.config()
app.use(express.json())
app.use(cors({
  credentials: true
}))

const PORT = process.env.PORT || 8000;
```

### Environment Variables

**Required Configuration:**
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://localhost:27017/codefode

# AI Service Configuration
COHERE_API_KEY=your-cohere-api-key
GOOGLE_API_KEY=your-google-api-key

# Security Settings
JWT_SECRET=your-jwt-secret
```

## 🌐 API Architecture

### Route Structure

The server follows RESTful API conventions with modular route organization:

**API Endpoints:**
- `/api/user/*` - User management and authentication
- `/api/workspace/*` - Workspace and file operations
- `/api/ai/*` - AI-powered code assistance
- `/api/notifications/*` - Notification system

### Middleware Stack

**Global Middleware:**
1. **CORS** - Cross-origin request handling
2. **JSON Parser** - Request body parsing
3. **Error Handler** - Centralized error handling
4. **Rate Limiter** - Request rate limiting (socket events)

### Error Handling

**Standardized Error Responses:**
```javascript
try {
  // Controller logic
  res.json(result);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

## 🔌 Socket.IO Integration

### Real-time Communication (`/src/socket/initsocket.js`)

The Socket.IO server handles real-time collaboration features.

**Key Features:**
- User room management
- Real-time code synchronization
- Chat message broadcasting
- Cursor position tracking
- Code execution with rate limiting

**Socket Event Types:**
- `JOIN` - User joins a room
- `CODE_CHANGE` - Code modifications
- `CURSOR_CHANGE` - Cursor position updates
- `SEND_MESSAGE` - Chat messages
- `EXECUTE_CODE` - Code execution requests
- `DISCONNECTED` - User disconnection

### Connection Management

**User Tracking:**
```javascript
const userSocketMap = {};        // Maps socket ID to username
const userRoomMap = {};          // Maps socket ID to room ID
const chatMessages = {};         // Maps room ID to chat history
const rateLimiter = new Map();   // Rate limiting for code execution
```

**Room Operations:**
```javascript
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};
```

## 💾 Database Integration

### MongoDB Connection (`/src/db/dbconn.js`)

Database connection management with Mongoose.

**Connection Features:**
- Automatic reconnection
- Connection pooling
- Error handling and logging
- Environment-based configuration

### Data Models

**Workspace Schema (`/src/models/workspace.js`):**
- Room identification and metadata
- File structure and content storage
- User collaboration data
- Timestamp tracking

## 🤖 AI Integration

### AI Controller (`/src/controllers/aiCodeController.js`)

Handles AI-powered code assistance and suggestions.

**Features:**
- Code completion and suggestions
- Error detection and fixes
- Code optimization recommendations
- Multi-language support

**API Endpoint:**
```javascript
router.post('/code', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required'
      });
    }

    const result = await processCodeWithAI(code, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process code'
    });
  }
});
```

### Supported AI Providers

**Cohere AI Integration:**
- Natural language code generation
- Code explanation and documentation
- Error detection and debugging assistance

**Google Generative AI:**
- Alternative AI provider
- Fallback for high availability
- Specialized model capabilities

## 🏃‍♂️ Code Execution Engine

### Container-based Execution (`/src/controllers/runInContainer.js`)

Secure code execution in isolated environments.

**Security Features:**
- Sandboxed execution environment
- Resource usage limitations
- Timeout protection
- Input validation and sanitization

**Supported Languages:**
- JavaScript/Node.js
- Python
- Java
- C/C++
- Go
- Rust
- And more...

**Rate Limiting:**
```javascript
const now = Date.now();
const lastExecution = rateLimiter.get(socket.id) || 0;
if (now - lastExecution < 1000) {
  socket.emit(ACTIONS.CODE_RESULT, {
    success: false,
    output: "Please wait before executing more code",
  });
  return;
}
```

## 🔐 Security Implementation

### Input Validation

**Request Validation:**
- Schema validation with Zod
- Input sanitization
- Type checking and constraints
- SQL injection prevention

### Rate Limiting

**Socket Event Limiting:**
- Per-user execution limits
- Time-based restrictions
- Queue management
- Abuse prevention

### Authentication & Authorization

**Security Measures:**
- JWT token validation
- Session management
- Role-based access control
- Secure header configuration

## 📊 Performance Optimizations

### Database Optimization

**MongoDB Performance:**
- Indexed queries for fast lookups
- Connection pooling
- Query optimization
- Data aggregation pipelines

### Memory Management

**Resource Optimization:**
- Efficient data structures
- Memory leak prevention
- Garbage collection optimization
- Process monitoring

### Caching Strategy

**Performance Improvements:**
- In-memory caching for frequent data
- Redis integration (configurable)
- Query result caching
- Static asset optimization

## 🐳 Containerization

### Docker Configuration (`/Dockerfile`)

Container setup for consistent deployment across environments.

**Container Features:**
- Multi-stage build process
- Optimized image size
- Security best practices
- Environment variable support

### Deployment Options

**Supported Platforms:**
- **Vercel** - Serverless deployment
- **Docker** - Container-based deployment
- **Traditional VPS** - Standard server deployment
- **Cloud Providers** - AWS, GCP, Azure

## 📈 Monitoring & Logging

### Application Logging

**Log Levels:**
- Error logging for debugging
- Request/response logging
- Performance metrics
- Security event tracking

### Health Monitoring

**System Metrics:**
- Server uptime monitoring
- Database connection status
- Memory and CPU usage
- Socket connection metrics

## 🔄 Development Workflow

### Local Development

**Development Setup:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with nodemon (auto-reload)
nodemon src/index.js
```

### Testing Strategy

**Testing Approaches:**
- Unit tests for controllers
- Integration tests for APIs
- Socket.IO event testing
- Load testing for performance

### Code Quality

**Quality Assurance:**
- ESLint configuration
- Code formatting standards
- Git hooks for pre-commit checks
- Continuous integration setup