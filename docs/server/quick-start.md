# 🚀 Server Quick Start Guide

Get the CodeFode backend server running in minutes!

## ⚡ Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB 4.4+** - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **npm** or **yarn** package manager
- **Cohere AI API Key** - [Get one here](https://cohere.ai/)

## 📦 Installation

### 1. Navigate to Server Directory
```bash
cd CodeFode-AI-code-editor/server
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create `.env` file in the server root:
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Connection
MONGO_URI=mongodb://localhost:27017/codefode

# AI Service (Required)
COHERE_API_KEY=your_cohere_api_key_here

# Optional Security
JWT_SECRET=your_jwt_secret_here
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS (with Homebrew)
brew services start mongodb/brew/mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services or run mongod.exe
```

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The server will be available at: **http://localhost:8000**

## 🔧 Development Scripts

```bash
# Development server with auto-restart
npm run dev

# Production server
npm start

# Run with debugging
DEBUG=app:* npm run dev

# Testing
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix
```

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/        # Business logic
│   │   ├── aiCodeController.js
│   │   ├── workspaceController.js
│   │   ├── userControllers.js
│   │   └── notificationController.js
│   ├── models/            # Database schemas
│   │   └── workspace.js
│   ├── routes/            # API endpoints
│   │   ├── aiRoutes.js
│   │   ├── workspaceRoutes.js
│   │   └── userRoutes.js
│   ├── socket/            # Socket.IO handlers
│   │   ├── initsocket.js
│   │   └── socketHandlers.js
│   ├── middleware/        # Express middleware
│   │   ├── logger.js
│   │   ├── security.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── config/           # Configuration
│   │   └── environment.js
│   ├── db/               # Database connection
│   │   └── dbconn.js
│   └── index.js          # Entry point
├── logs/                 # Log files
├── .env                  # Environment variables
├── package.json          # Dependencies
└── Dockerfile           # Container config
```

## 🌐 API Testing

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": {...},
  "environment": "development"
}
```

### Test Workspace API
```bash
# Get workspace (should return 404 for new workspace)
curl http://localhost:8000/api/workspace/test-room-123

# Create workspace
curl -X POST http://localhost:8000/api/workspace \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test-room-123","openFiles":[],"activeFile":null}'
```

### Test AI API
```bash
curl -X POST http://localhost:8000/api/ai/code \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"Hello World\");","language":"javascript"}'
```

## 🔌 Socket.IO Testing

### Using a WebSocket Client
```bash
npm install -g wscat

# Connect to Socket.IO server
wscat -c "ws://localhost:8000/socket.io/?EIO=4&transport=websocket"
```

### Browser Console Test
```javascript
// In browser console at http://localhost:8000
const socket = io();

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join a test room
  socket.emit('join', {
    roomId: 'test-room',
    username: 'test-user'
  });
});

socket.on('joined', (data) => {
  console.log('Joined room:', data);
});
```

## 📊 Database Setup

### Connect to MongoDB
```bash
# Using MongoDB shell
mongo
# or with newer versions
mongosh

# Switch to codefode database
use codefode

# Check collections
show collections

# Query workspaces
db.workspaces.find().pretty()
```

### Sample Workspace Document
```javascript
db.workspaces.insertOne({
  "roomId": "sample-room",
  "fileExplorerData": {
    "id": "root",
    "name": "root",
    "isFolder": true,
    "path": "/root",
    "nodes": []
  },
  "openFiles": [],
  "activeFile": null,
  "filesContent": [],
  "notifications": [],
  "lastUpdated": new Date()
});
```

## 🛡️ Security Configuration

### Basic Security Headers
The server includes security middleware:
- CORS protection
- Rate limiting
- Input validation
- Error sanitization

### Environment-based Configuration
```javascript
// config/environment.js
export default {
  server: {
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codefode'
  },
  ai: {
    cohereApiKey: process.env.COHERE_API_KEY
  }
};
```

## 🚨 Troubleshooting

### Common Issues

**Port 8000 already in use:**
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
PORT=8001 npm run dev
```

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB service
brew services start mongodb/brew/mongodb-community  # macOS
sudo systemctl start mongod                        # Linux
```

**Environment variables not loading:**
- Ensure `.env` file is in server root directory
- Check file permissions
- Restart the server after changes

**AI API errors:**
- Verify Cohere API key is valid
- Check API quota and limits
- Monitor network connectivity

### Debug Mode

Enable detailed logging:
```bash
DEBUG=app:* npm run dev
```

Check log files:
```bash
# View recent logs
tail -f logs/app-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

## 📈 Performance Monitoring

### Memory Usage
```bash
# Monitor memory usage
node --inspect src/index.js

# Or use PM2 for production
npm install -g pm2
pm2 start src/index.js --name codefode-server
pm2 monit
```

### Database Performance
```bash
# MongoDB stats
db.stats()

# Query performance
db.workspaces.find().explain("executionStats")
```

## 🐳 Docker Development

### Build Docker Image
```bash
docker build -t codefode-server .
```

### Run with Docker
```bash
docker run -p 8000:8000 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/codefode \
  -e COHERE_API_KEY=your_api_key \
  codefode-server
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  server:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/codefode
      - COHERE_API_KEY=your_api_key
    depends_on:
      - mongo
  
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## 🧪 Testing

### Unit Tests
```bash
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Integration Tests
```bash
# Test API endpoints
npm run test:api

# Test Socket.IO events  
npm run test:socket
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 5 http://localhost:8000/health
```

## 📚 Next Steps

1. **[API Reference](./api.md)** - Explore all API endpoints
2. **[Socket Events](./sockets.md)** - Learn about real-time events
3. **[Database](./database.md)** - Understand data models
4. **[Middleware](./middleware.md)** - Custom middleware functions

## 🤝 Getting Help

- Check the [troubleshooting section](#troubleshooting) above
- Review server logs for error details
- Ensure all dependencies are properly installed
- Verify environment variables are set correctly