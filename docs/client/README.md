# 📱 Client Documentation

Frontend documentation for CodeFode - built with Next.js 14, TypeScript, and modern web technologies.

## 📋 Table of Contents

- **[Quick Start Guide](./quick-start.md)** - Setup and development
- **[Components Guide](./components.md)** - UI components and usage
- **[State Management](./state-management.md)** - Contexts and hooks
- **[Real-time Features](./realtime.md)** - Socket.IO and collaboration
- **[API Integration](./api-integration.md)** - Service functions and data fetching

## 🏗️ Architecture Overview

### Technology Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Monaco Editor** - VS Code-powered editor
- **Socket.IO** - Real-time communication

### Project Structure
```
client/src/
├── app/                    # Next.js App Router
│   ├── components/         # UI components
│   ├── room/[roomId]/     # Collaborative rooms
│   ├── (auth)/            # Authentication pages
│   └── globals.css        # Global styles
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── services/              # API service functions
├── interfaces/            # TypeScript interfaces
└── utils/                 # Utility functions
```

## 🎯 Core Features

### 1. Real-time Code Editor
- Monaco Editor integration
- Syntax highlighting for multiple languages
- Live code synchronization
- Multi-user cursor tracking

### 2. Collaborative Features
- Real-time chat system
- User presence indicators
- Activity logging
- File sharing and management

### 3. AI Integration
- Code suggestions and completion
- Error detection and fixes
- Best practices recommendations
- AI-powered chat assistance

### 4. User Interface
- Dark/light theme support
- Responsive design
- Customizable layouts
- Keyboard shortcuts

## 🔧 Key Components

### Layout Components
- **Header** - Navigation and user menu
- **Sidebar** - File explorer and panels
- **Footer** - Status and information

### Editor Components
- **CodeEditor** - Monaco editor wrapper
- **FileTabs** - Open file management
- **FileExplorer** - File tree navigation

### Communication Components
- **Chat** - Real-time messaging
- **Peoples** - User presence
- **AiSidebar** - AI assistance panel

## 🔄 State Management

### Context Providers
- **RoomContext** - Room state and collaboration
- **ThemeContext** - UI theme preferences
- **FontSizeContext** - Editor font settings
- **ActiveFileContext** - Current file state

### Custom Hooks
- **useSocket** - Socket connection management
- **useAISuggestion** - AI integration
- **useWorkspace** - File operations
- **useNotifications** - Toast notifications

## 🌐 Routing

### Public Routes
- `/` - Landing page
- `/login` - Authentication
- `/register` - User registration

### Protected Routes
- `/join` - Room joining
- `/room/[roomId]` - Collaborative editing

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser

### Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Build
```bash
npm run build
npm start
```

## 📝 Contributing

When contributing to the client:

1. Follow TypeScript best practices
2. Use existing component patterns
3. Maintain responsive design
4. Test across different browsers
5. Update documentation for new features

## 🔗 Related Documentation

- **[Server Documentation](../server/)** - Backend API and services
- **[Deployment Guide](../deployment/)** - Production setup
- **[Contributing Guidelines](../contributing/)** - Development workflow