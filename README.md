# 🚀 CodeFode - AI-Powered Collaborative Code Editor

<div align="center">

[![Demo Video](https://img.youtube.com/vi/1JKeSBsQ2zA/maxresdefault.jpg)](https://youtu.be/1JKeSBsQ2zA)

**A powerful, lightweight AI-assisted code editor that revolutionizes collaborative development**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black)](https://nextjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101)](https://socket.io/)

</div>

## 🌟 Overview

CodeFode is a cutting-edge collaborative code editor that combines the power of AI assistance with real-time collaboration features. Built with modern web technologies, it empowers developers to write, share, and improve code more efficiently than ever before.

### ✨ What Makes CodeFode Special?

- **🤖 AI-Powered Intelligence**: Advanced code completion, error detection, and optimization suggestions
- **👥 Real-time Collaboration**: Multiple developers can work together seamlessly with live cursor tracking
- **🔐 Enterprise-Ready Security**: Robust authentication with 2FA, OAuth, and secure session management
- **⚡ High Performance**: Optimized for speed with efficient real-time synchronization
- **🎨 Modern UI/UX**: Intuitive interface with customizable themes and responsive design

## 🚀 Key Features

### 1. Code Editor
- Lightweight, feature-rich code editing environment
- Syntax highlighting with multiple themes
- Word wrap and line numbering
- Bracket matching and automatic indentation
- Intuitive file explorer panel

### 2. 🤖 AI-Powered Code Assistance
- Intelligent auto-completion for function names and variables
- Quick fix suggestions for syntax errors
- Code snippet generation
- Automated code documentation
- AI-driven code improvement recommendations

### 3. 🤝 Real-Time Collaboration
- Multi-user editing with live cursor tracking
- In-editor commenting system
- Comprehensive activity logging
- Auto-save and undo/redo history

### 4. 🔒 Security & Authentication
- Secure login options:
  - Email authentication
  - Google OAuth
- Two-factor authentication (2FA)
  - OTP and TOTP support
- Password reset functionality

### 5. 🎨 User Experience
- Dark and light mode
- Customizable font sizes and color themes
- Collapsible sidebar
- Intuitive, user-friendly interface

## 🛠 Technology Stack

### 🎨 Frontend
- **Next.js 14** - React framework with App Router architecture
- **Monaco Editor** - VS Code-powered editor with IntelliSense
- **TypeScript** - Type-safe development experience
- **Material-UI** - Modern React component library
- **TailwindCSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **NextAuth.js** - Comprehensive authentication solution

### ⚙️ Backend
- **Express.js** - Fast, unopinionated web framework
- **Socket.IO Server** - Real-time bidirectional event-based communication
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling for Node.js
- **Cohere AI** - Advanced AI code assistance
- **Google Generative AI** - Alternative AI provider
- **Bull** - Job queue for background processing

### 🔧 Development Tools
- **ESLint & Prettier** - Code quality and formatting
- **TypeScript** - Static type checking
- **Docker** - Containerization for consistent deployments
- **Vercel** - Seamless deployment platform

## 📦 Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB
- Cohere API Key
- Google OAuth Credentials (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CodeFode-AI-code-editor.git
cd CodeFode-AI-code-editor
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/codefode

# AI Services
COHERE_API_KEY=your_cohere_api_key
GOOGLE_API_KEY=your_google_api_key

# Security
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create a `.env.local` file in the client directory:
```env
# Next.js Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database
MONGODB_URL=mongodb://localhost:27017/codefode

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SECURE=false
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 🐳 Docker Setup (Alternative)

For a containerized setup:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run individual containers
docker build -t codefode-client ./client
docker build -t codefode-server ./server
docker run -p 3000:3000 codefode-client
docker run -p 8000:8000 codefode-server
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[📖 Getting Started](./docs/README.md)** - Complete documentation overview
- **[🏗️ Architecture](./docs/architecture/)** - System design and architecture
- **[💻 Client Guide](./docs/client/)** - Frontend development guide
- **[⚙️ Server Guide](./docs/server/)** - Backend development guide
- **[🔌 API Reference](./docs/api/)** - REST API and Socket.IO documentation
- **[🚀 Deployment](./docs/deployment/)** - Production deployment guides
- **[🤝 Contributing](./docs/contributing/)** - Development workflow and guidelines

## 🎯 Features in Detail

### 🤖 AI-Powered Code Assistance
- **Intelligent Code Completion**: Context-aware suggestions powered by Cohere AI
- **Real-time Error Detection**: Instant feedback on syntax and logical errors
- **Code Optimization**: Performance improvement recommendations
- **Auto-documentation**: Generate documentation from code comments
- **Multi-language Support**: Works with JavaScript, Python, Java, C++, and more

### 👥 Real-time Collaboration
- **Live Editing**: Multiple users can edit code simultaneously
- **Cursor Tracking**: See where other users are working in real-time
- **Conflict Resolution**: Automatic handling of concurrent edits
- **Chat Integration**: Built-in messaging for team communication
- **Activity Logging**: Track all changes and user actions

### 🔐 Security & Authentication
- **Multi-factor Authentication**: Email OTP and authenticator app support
- **OAuth Integration**: Secure login with Google and other providers
- **Session Management**: Secure JWT-based session handling
- **Password Security**: Bcrypt hashing with configurable rounds
- **Rate Limiting**: Protection against abuse and spam

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Theme Customization**: Dark and light modes with custom color schemes
- **Keyboard Shortcuts**: Productivity-focused hotkey support
- **File Management**: Intuitive file explorer with drag-and-drop
- **Code Execution**: Run code directly in the browser with multiple language support

## 🔧 Development

### Development Scripts

**Frontend (Client):**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
```

**Backend (Server):**
```bash
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

### Project Structure
```
CodeFode-AI-code-editor/
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Express.js backend application
│   ├── src/
│   │   ├── controllers/   # Business logic controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API route definitions
│   │   └── socket/        # Socket.IO event handlers
│   └── package.json
├── docs/                  # Comprehensive documentation
└── README.md
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./docs/contributing/development-workflow.md) for details on:

- 🔧 Setting up the development environment
- 📝 Code style and conventions
- 🧪 Testing requirements
- 📋 Pull request process
- 🐛 Bug reporting guidelines

### Quick Contribution Steps
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Make** your changes following our coding standards
5. **Test** your changes thoroughly
6. **Commit** with clear, descriptive messages
7. **Push** to your fork (`git push origin feature/amazing-feature`)
8. **Submit** a Pull Request with detailed description

## 🆘 Support & Community

- 📧 **Email**: support@codefode.com
- 💬 **Discord**: [Join our community](https://discord.gg/codefode)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/CodeFode-AI-code-editor/issues)
- 📖 **Wiki**: [Project Wiki](https://github.com/your-username/CodeFode-AI-code-editor/wiki)

## 📊 Project Status

- ✅ **Core Features**: Complete
- ✅ **Real-time Collaboration**: Stable
- ✅ **AI Integration**: Production Ready
- 🔄 **Mobile Optimization**: In Progress
- 📋 **Additional Languages**: Planned

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2024 CodeFode Team
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

## 🙌 Acknowledgements

Special thanks to the amazing open-source projects that make CodeFode possible:

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - VS Code's editor in the browser
- **[Socket.IO](https://socket.io/)** - Real-time bidirectional event-based communication
- **[Cohere AI](https://cohere.ai/)** - Advanced language AI for developers
- **[Material-UI](https://mui.com/)** - React component library
- **[MongoDB](https://www.mongodb.com/)** - Database for modern applications

---

<div align="center">

**Made with ❤️ by the CodeFode Team**

[⭐ Star this repo](https://github.com/your-username/CodeFode-AI-code-editor) | [🐛 Report Bug](https://github.com/your-username/CodeFode-AI-code-editor/issues) | [✨ Request Feature](https://github.com/your-username/CodeFode-AI-code-editor/issues)

</div>
