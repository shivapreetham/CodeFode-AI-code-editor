# ⚙️ Server Documentation

Backend documentation for CodeFode - built with Express.js, Socket.IO, and MongoDB.

## 📋 Table of Contents

- **[Quick Start Guide](./quick-start.md)** - Setup and development
- **[API Reference](./api.md)** - REST API endpoints
- **[Socket Events](./sockets.md)** - Real-time communication
- **[Database](./database.md)** - MongoDB models and operations
- **[Middleware](./middleware.md)** - Express middleware functions

## 🏗️ Architecture Overview

### Technology Stack
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Document database
- **Mongoose** - ODM for MongoDB
- **Cohere AI** - AI code assistance

### Project Structure
```
server/src/
├── controllers/           # Business logic handlers
│   ├── aiCodeController.js
│   ├── workspaceController.js
│   ├── userControllers.js
│   └── notificationController.js
├── models/               # Database schemas
│   └── workspace.js
├── routes/               # API route definitions
│   ├── aiRoutes.js
│   ├── workspaceRoutes.js
│   ├── userRoutes.js
│   └── notificationRoutes.js
├── socket/               # Socket.IO handlers
│   ├── initsocket.js
│   └── socketHandlers.js
├── middleware/           # Express middleware
│   ├── logger.js
│   ├── security.js
│   ├── validation.js
│   ├── compression.js
│   └── errorHandler.js
├── config/               # Configuration
│   └── environment.js
├── db/                   # Database connection
│   └── dbconn.js
└── index.js              # Application entry point
```

## 🚀 Core Features

### 1. Real-time Collaboration
- Multi-user code editing
- Live cursor synchronization
- Real-time chat system
- User presence tracking

### 2. AI Integration
- Code analysis and suggestions
- Error detection and fixes
- Best practices recommendations
- Rate-limited AI API calls

### 3. Workspace Management
- File and folder operations
- Project persistence
- Auto-save functionality
- Version history

### 4. Security & Performance
- Input validation and sanitization
- Rate limiting
- Compression middleware
- Error handling and logging

## 🌐 API Endpoints

### Workspace Management
- `GET /api/workspace/:roomId` - Get workspace data
- `POST /api/workspace` - Save workspace
- `DELETE /api/workspace/:roomId` - Delete workspace

### AI Integration  
- `POST /api/ai/code` - Analyze code with AI
- `GET /api/ai/status` - Check AI service status

### Notifications
- `GET /api/notifications/:roomId` - Get notifications
- `POST /api/notifications/:roomId` - Add notification
- `DELETE /api/notifications/:roomId/cleanup` - Clean old notifications

### User Management
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User authentication
- `GET /api/user/profile` - Get user profile

## 🔌 Socket.IO Events

### Connection Events
- `join` - User joins a room
- `joined` - User successfully joined
- `disconnected` - User disconnected
- `leave` - User leaves room

### Code Collaboration
- `code-change` - Code modification broadcast
- `cursor-change` - Cursor position update
- `sync-code` - Code synchronization

### Communication
- `send-message` - Send chat message
- `receive-message` - Receive chat message
- `get-messages` - Load message history

### Code Execution
- `execute-code` - Run code in container
- `code-result` - Execution result

## 💾 Database Models

### Workspace Schema
```javascript
{
  roomId: String,           // Unique room identifier
  fileExplorerData: Object, // File tree structure
  openFiles: [FileSchema],  // Currently open files
  activeFile: FileSchema,   // Currently active file
  filesContent: [Object],   // File contents mapping
  notifications: [Object],  // Activity notifications
  lastUpdated: Date         // Last modification time
}
```

### File Schema
```javascript
{
  name: String,     // File name
  content: String,  // File content
  language: String, // Programming language
  path: String      // File path
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/codefode

# AI Service
COHERE_API_KEY=your_cohere_api_key

# Security (optional)
JWT_SECRET=your_jwt_secret
```

### Docker Setup
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

## 🛡️ Security Features

### Input Validation
- Zod schema validation
- Request sanitization
- File path validation
- Size limits enforcement

### Rate Limiting
- Socket event rate limiting
- API endpoint throttling
- Code execution limits
- AI service quotas

### Error Handling
- Centralized error middleware
- Structured error responses
- Security-aware error messages
- Logging and monitoring

## 📊 Performance

### Caching Strategy
- Response caching for workspace data
- In-memory socket state
- Database query optimization
- Asset compression

### Resource Management
- Connection pooling
- Memory leak prevention
- Garbage collection optimization
- Process monitoring

## 🧪 Development

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Local Development
```bash
cd server
npm install
npm run dev
```

### Testing
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Debugging
```bash
# Enable debug mode
DEBUG=app:* npm run dev

# Check logs
tail -f logs/app.log
```

## 📚 Related Documentation

- **[Client Documentation](../client/)** - Frontend integration
- **[Deployment Guide](../deployment/)** - Production setup
- **[Contributing Guidelines](../contributing/)** - Development workflow