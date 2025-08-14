# Development Setup Guide

## 🚀 Getting Started

This guide will help you set up CodeFode for local development on your machine.

## 📋 Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **MongoDB**: Version 5.0+ (local or cloud)

### Recommended Tools

- **Code Editor**: VS Code, WebStorm, or similar
- **Terminal**: Command Prompt, PowerShell, Terminal, or iTerm2
- **Database GUI**: MongoDB Compass (optional)
- **API Testing**: Postman or Insomnia (optional)

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/CodeFode-AI-code-editor.git

# Navigate to project directory
cd CodeFode-AI-code-editor

# Verify the project structure
ls -la
```

Expected structure:
```
CodeFode-AI-code-editor/
├── client/          # Next.js frontend
├── server/          # Express.js backend
├── docs/            # Documentation
├── README.md
└── .gitignore
```

### 2. Database Setup

#### Option A: Local MongoDB Installation

**Windows:**
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

**macOS:**
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Whitelist your IP address

### 3. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env  # If available, or create new .env file
```

#### Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/codefode
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/codefode

# AI Service Configuration
COHERE_API_KEY=your_cohere_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Security Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
BCRYPT_ROUNDS=12

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Get AI API Keys

**Cohere AI:**
1. Visit [Cohere AI](https://cohere.ai/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

**Google Generative AI (optional):**
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create a project and enable the API
3. Generate an API key

#### Test Backend Setup

```bash
# Start the development server
npm run dev

# You should see output similar to:
# Server is running on http://localhost:8000
# MongoDB connected successfully
```

Verify the backend is working:
```bash
curl http://localhost:8000/
# Should return: "Hello, TypeScript with Node.js!"
```

### 4. Frontend Setup

Open a new terminal window/tab:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
touch .env.local  # Linux/macOS
# or create .env.local manually on Windows
```

#### Environment Configuration

Create a `.env.local` file in the `client` directory:

```env
# Next.js Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_minimum_32_characters

# Database Configuration (for NextAuth.js)
MONGODB_URL=mongodb://localhost:27017/codefode

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_SECURE=false

# Development Configuration
NODE_ENV=development
```

#### Get OAuth Credentials (Optional)

**Google OAuth:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

#### Test Frontend Setup

```bash
# Start the development server
npm run dev

# You should see output similar to:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
# - Ready in 2.3s
```

Visit `http://localhost:3000` in your browser. You should see the CodeFode landing page.

## 🔗 Connect Frontend and Backend

### Test Real-time Connection

1. Open your browser to `http://localhost:3000`
2. Create an account or login
3. Create a new room or join an existing one
4. Open browser developer tools and check the Console/Network tabs
5. You should see Socket.IO connection messages

### Verify Database Connection

Check your MongoDB instance:

```bash
# Using MongoDB shell (if installed locally)
mongosh
use codefode
show collections

# You should see collections like 'users', 'workspaces', etc.
```

## 🧪 Development Workflow

### Running Both Servers

**Option 1: Separate Terminals**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

**Option 2: Using tmux (Linux/macOS)**
```bash
# Create tmux session
tmux new-session -d -s codefode

# Split window
tmux split-window -h

# Run backend in first pane
tmux send-keys -t 0 'cd server && npm run dev' Enter

# Run frontend in second pane
tmux send-keys -t 1 'cd client && npm run dev' Enter

# Attach to session
tmux attach -t codefode
```

**Option 3: Using Concurrently (Alternative)**
```bash
# Install concurrently globally
npm install -g concurrently

# Create package.json script in root directory
{
  "scripts": {
    "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm run dev\""
  }
}

# Run both servers
npm run dev
```

### Code Quality Tools

**Backend (server):**
```bash
# Install development dependencies
npm install --save-dev eslint prettier nodemon

# Run linting
npx eslint src/

# Format code
npx prettier --write src/
```

**Frontend (client):**
```bash
# Linting (already configured)
npm run lint

# Type checking
npm run typecheck

# Build for production (test)
npm run build
```

## 🛠️ IDE Configuration

### VS Code Setup

**Recommended Extensions:**
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- MongoDB for VS Code
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### WebStorm Setup

1. Enable ESLint: File → Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable Prettier: File → Settings → Languages & Frameworks → JavaScript → Prettier
3. Configure Node.js: File → Settings → Languages & Frameworks → Node.js and NPM

## 🔍 Debugging

### Backend Debugging

**Using VS Code:**
1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/server/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["--inspect"],
      "cwd": "${workspaceFolder}/server"
    }
  ]
}
```

**Using Node.js Inspector:**
```bash
# Start server with debugging
node --inspect src/index.js

# Open chrome://inspect in Chrome
```

### Frontend Debugging

**Browser DevTools:**
- React Developer Tools extension
- Redux DevTools (if using Redux)
- Network tab for API calls
- Console for errors and logs

**VS Code:**
```json
{
  "type": "node",
  "request": "launch", 
  "name": "Next.js: debug full stack",
  "program": "${workspaceFolder}/client/node_modules/.bin/next",
  "args": ["dev"],
  "cwd": "${workspaceFolder}/client",
  "console": "integratedTerminal"
}
```

## 📊 Monitoring and Logging

### Development Logs

**Backend Logging:**
```javascript
// Add to server/src/index.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'debug.log' })
  ]
});

// Use in your code
logger.info('Server started');
logger.error('Database connection failed', error);
```

**Frontend Logging:**
```javascript
// Use React DevTools and browser console
console.log('Component rendered');
console.error('API call failed', error);

// For production, consider a logging service like LogRocket
```

### Performance Monitoring

**Monitor Bundle Size:**
```bash
# Analyze Next.js bundle
cd client
npm run build
npx @next/bundle-analyzer
```

**Monitor API Performance:**
```bash
# Use curl to test API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/workspace/test
```

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**MongoDB Connection Issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Check connection
mongosh mongodb://localhost:27017/codefode
```

**Node.js Version Issues:**
```bash
# Use Node Version Manager
nvm install 18
nvm use 18

# Or update Node.js directly
```

**Module Not Found Errors:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Checklist

- [ ] Node.js version 18+ installed
- [ ] MongoDB running and accessible
- [ ] Environment variables configured
- [ ] API keys valid and active
- [ ] Ports 3000 and 8000 available
- [ ] Both frontend and backend running
- [ ] Browser console shows no errors
- [ ] Database collections created

## 📚 Next Steps

After successful setup:

1. **Read the Documentation**: Explore `/docs` folder for detailed guides
2. **Study the Code**: Familiarize yourself with the codebase structure
3. **Run Tests**: Set up and run the test suites
4. **Make Changes**: Start with small modifications to understand the workflow
5. **Join Community**: Connect with other contributors

For production deployment, see the [Production Deployment Guide](./production.md).