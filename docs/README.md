# CodeFode Documentation

Welcome to the comprehensive documentation for CodeFode - an AI-powered collaborative code editor.

## 📚 Documentation Structure

### 🏗️ Architecture
- [System Architecture](./architecture/system-overview.md) - High-level system design and component interactions
- [Database Schema](./architecture/database-schema.md) - MongoDB collections and data models
- [Real-time Communication](./architecture/realtime-communication.md) - Socket.IO implementation details

### 💻 Client-Side Documentation
- [Frontend Overview](./client/overview.md) - Next.js application structure and key features
- [Components Guide](./client/components.md) - Detailed component documentation
- [State Management](./client/state-management.md) - Context providers and hooks
- [Authentication](./client/authentication.md) - NextAuth.js implementation
- [Real-time Features](./client/realtime-features.md) - Socket.IO client implementation

### 🔧 Server-Side Documentation
- [Backend Overview](./server/overview.md) - Express.js server architecture
- [API Routes](./server/api-routes.md) - REST API endpoints documentation
- [Controllers](./server/controllers.md) - Business logic implementation
- [Socket Events](./server/socket-events.md) - Real-time event handling
- [Database Models](./server/database-models.md) - MongoDB schema definitions

### 🔌 API Reference
- [Authentication API](./api/authentication.md) - Login, register, password reset endpoints
- [Workspace API](./api/workspace.md) - File and project management endpoints
- [AI Integration API](./api/ai-integration.md) - Cohere AI service integration
- [Notifications API](./api/notifications.md) - Notification system endpoints
- [Socket Events Reference](./api/socket-events.md) - Real-time communication events

### 🚀 Deployment
- [Setup Guide](./deployment/setup-guide.md) - Development environment setup
- [Production Deployment](./deployment/production.md) - Production deployment instructions
- [Environment Variables](./deployment/environment-variables.md) - Configuration reference
- [Docker Setup](./deployment/docker.md) - Containerization guide

### 🤝 Contributing
- [Development Workflow](./contributing/development-workflow.md) - Git workflow and coding standards
- [Code Style Guide](./contributing/code-style.md) - Coding conventions and best practices
- [Testing Guidelines](./contributing/testing.md) - Testing strategy and requirements
- [Pull Request Template](./contributing/pull-request-template.md) - PR submission guidelines

## 🚀 Quick Start

1. **Setup Development Environment**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd CodeFode-AI-code-editor
   
   # Install dependencies
   cd client && npm install
   cd ../server && npm install
   ```

2. **Environment Configuration**
   - Copy environment files from deployment documentation
   - Configure MongoDB connection
   - Set up AI service credentials

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## 📖 Key Features Documentation

### 🤖 AI-Powered Code Assistance
- Intelligent code completion and suggestions
- Real-time error detection and fixes
- Code optimization recommendations
- Documentation generation

### 👥 Real-time Collaboration
- Multi-user editing with conflict resolution
- Live cursor tracking and user presence
- Real-time chat and commenting
- Activity logging and history

### 🔐 Security & Authentication
- Multi-factor authentication (MFA)
- OAuth integration (Google)
- Secure session management
- Password reset functionality

### 🎨 User Experience
- Customizable themes and layouts
- Responsive design for all devices
- Keyboard shortcuts and accessibility
- File explorer and project management

## 🆘 Getting Help

- Check the [troubleshooting guide](./deployment/troubleshooting.md)
- Review [common issues](./contributing/common-issues.md)
- Submit [bug reports](./contributing/bug-reports.md)

## 📄 License

This project is licensed under the MIT License - see the main README for details.