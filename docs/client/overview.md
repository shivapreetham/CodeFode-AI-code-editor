# Client-Side Overview

## 🎯 Architecture

CodeFode's frontend is built with Next.js 14 using the App Router architecture, providing a modern, performant, and scalable foundation for the collaborative code editor.

## 🏗️ Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   │   ├── (auth)/            # Authentication route group
│   │   ├── api/               # API routes (backend functionality)
│   │   ├── components/        # Reusable UI components
│   │   ├── room/              # Collaborative editing rooms
│   │   └── globals.css        # Global styles
│   ├── context/               # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── interfaces/            # TypeScript interfaces
│   ├── services/              # API service functions
│   ├── utils/                 # Utility functions
│   └── socket.tsx            # Socket.IO client setup
├── public/                    # Static assets
├── types/                     # Global TypeScript types
└── package.json              # Dependencies and scripts
```

## 🔧 Core Technologies

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **React 18** - Component-based UI library
- **TypeScript** - Type-safe JavaScript

### UI Components & Styling
- **Material-UI (MUI)** - React component library
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Code Editor
- **Monaco Editor** - VS Code-powered editor
- **@monaco-editor/react** - React wrapper for Monaco

### Real-time Communication
- **Socket.IO Client** - WebSocket communication
- **React Context** - State management for real-time data

### Authentication
- **NextAuth.js** - Authentication framework
- **Google OAuth** - Social authentication
- **bcryptjs** - Password hashing

### State Management
- **React Context API** - Global state management
- **Custom Hooks** - Encapsulated business logic

## 🎨 Key Features

### 1. Code Editor Interface
- Monaco Editor integration with syntax highlighting
- Multi-language support
- Customizable themes (dark/light mode)
- Font size adjustment
- Line numbering and bracket matching

### 2. Real-time Collaboration
- Live cursor tracking
- Multi-user editing with conflict resolution
- Real-time chat system
- Activity logging
- User presence indicators

### 3. File Management
- Interactive file explorer
- File creation, deletion, and renaming
- Folder structure navigation
- File type detection and icons

### 4. AI Integration
- Code completion suggestions
- Error detection and fixes
- Code optimization recommendations
- AI-powered chat assistance

### 5. Authentication System
- Email/password authentication
- Google OAuth integration
- Password reset functionality
- Two-factor authentication (OTP)

## 🔄 State Management

### Context Providers
- **ActiveFileContext** - Currently selected file state
- **ChatContext** - Chat messages and real-time communication
- **FontSizeContext** - Editor font size preferences
- **RoomContext** - Collaborative room state
- **ThemeContext** - UI theme preferences

### Custom Hooks
- **useSocket** - Socket.IO connection management
- **useRoomSocket** - Room-specific socket events
- **useAISuggestion** - AI integration functionality
- **useCursorManagement** - Multi-user cursor tracking
- **useKeyboardShortcuts** - Keyboard navigation
- **useNotifications** - Toast notifications
- **useWorkspace** - File system operations

## 🌐 Routing Structure

### Public Routes
- `/` - Landing page
- `/login` - User authentication
- `/register` - User registration
- `/forgot-password` - Password reset

### Protected Routes
- `/join` - Room joining interface
- `/room/[roomId]` - Collaborative editing room

### API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/register` - User registration
- `/api/otp/*` - OTP verification
- `/api/reset-password` - Password reset

## 🎯 Component Architecture

### Layout Components
- **Header** - Navigation and user menu
- **Footer** - Site footer with links
- **Loading** - Loading states and spinners

### Room Components
- **CodeEditor** - Monaco editor wrapper
- **FileExplorer** - File tree navigation
- **FileTabs** - Open file tab management
- **Sidebar** - Collapsible sidebar panels
- **Chat** - Real-time messaging
- **Peoples** - User presence and activity

### UI Components
- **ThemeComp** - Theme toggle component
- **Terminal** - Integrated terminal interface
- **AiSidebar** - AI assistance panel

## 🔐 Security Features

### Authentication
- Secure session management with NextAuth.js
- Password hashing with bcryptjs
- CSRF protection
- OAuth integration with Google

### Data Protection
- Input validation and sanitization
- XSS prevention
- Secure HTTP headers
- Environment variable protection

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1920px+)
- Laptops and tablets (768px - 1919px)
- Mobile devices (320px - 767px)

## 🚀 Performance Optimizations

### Code Splitting
- Route-based code splitting with Next.js
- Dynamic imports for heavy components
- Lazy loading for non-critical features

### Caching
- Next.js automatic static optimization
- Image optimization with next/image
- Browser caching for static assets

### Bundle Optimization
- Tree shaking for unused code elimination
- Webpack optimizations
- Compressed assets delivery