# 📚 CodeFode Documentation

Welcome to CodeFode - a real-time collaborative AI-powered code editor!

## 🚀 Quick Start

### 1. Setup
```bash
# Clone and install dependencies
git clone <repo-url>
cd CodeFode-AI-code-editor

# Install client dependencies
cd client && npm install

# Install server dependencies  
cd ../server && npm install
```

### 2. Environment Setup
```bash
# Client (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Server (.env)
PORT=8000
MONGO_URI=mongodb://localhost:27017/codefode
COHERE_API_KEY=your_cohere_api_key
```

### 3. Run the Application
```bash
# Terminal 1 - Start Server
cd server && npm run dev

# Terminal 2 - Start Client
cd client && npm run dev
```

### 4. Access
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

## 📖 Documentation Structure

### 📱 [Client Documentation](./client/)
- **[Quick Start Guide](./client/quick-start.md)** - Get started with the frontend
- **[Components Guide](./client/components.md)** - UI components and usage
- **[State Management](./client/state-management.md)** - Contexts and hooks
- **[Real-time Features](./client/realtime.md)** - Socket.IO and collaboration

### ⚙️ [Server Documentation](./server/)
- **[Quick Start Guide](./server/quick-start.md)** - Backend setup and development
- **[API Reference](./server/api.md)** - REST API endpoints
- **[Socket Events](./server/sockets.md)** - Real-time communication
- **[Database](./server/database.md)** - MongoDB models and operations

## 🔧 Core Features

### 👥 Real-time Collaboration
- Multi-user code editing
- Live cursor tracking
- Real-time chat
- User presence indicators

### 🤖 AI-Powered Assistance
- Code suggestions and completion
- Error detection and fixes
- Best practices recommendations
- Powered by Cohere AI

### 📁 File Management
- File explorer with drag & drop
- Multiple file tabs
- Auto-save functionality
- Project workspace persistence

### 🔐 Security & Authentication
- User authentication system
- Secure session management
- Input validation and sanitization
- Rate limiting

## 🛠️ Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS + Custom components
- **Editor**: Monaco Editor (VS Code engine)
- **Real-time**: Socket.IO Client

### Backend (Express.js)
- **Framework**: Express.js with ES modules
- **Language**: JavaScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO Server
- **AI**: Cohere AI SDK

## 📁 Project Structure

```
CodeFode-AI-code-editor/
├── client/                 # Frontend (Next.js)
│   ├── src/
│   │   ├── app/           # Pages and layouts
│   │   ├── components/    # Reusable components
│   │   ├── context/       # State management
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API services
│   └── package.json
│
├── server/                # Backend (Express.js)
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database schemas
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.IO handlers
│   │   └── middleware/    # Express middleware
│   └── package.json
│
└── docs/                  # Documentation
    ├── client/            # Frontend docs
    └── server/            # Backend docs
```

## 🔗 Key Integrations

### AI Service (Cohere)
- Code analysis and suggestions
- Error detection and fixes
- Best practices recommendations
- Rate-limited API calls

### Database (MongoDB)
- Workspace persistence
- User session management
- File content storage
- Activity logging

### Real-time (Socket.IO)
- Code synchronization
- Cursor tracking
- Chat messages
- User presence

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in environment files
2. **Database connection**: Ensure MongoDB is running
3. **AI API errors**: Check Cohere API key validity
4. **Socket connection**: Verify CORS and URL configuration

### Development Tips
- Use browser dev tools for client-side debugging
- Check server logs for backend issues
- Monitor network tab for API/socket issues
- Use MongoDB Compass for database inspection

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Update documentation if needed
5. Submit a pull request

## 📄 License

MIT License - see the main README for details.