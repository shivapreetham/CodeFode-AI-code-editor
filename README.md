# CodeFode AI Code Editor

A scalable, reliable AI-powered code editor with real-time collaboration features.

## Architecture

### Backend (Server)
- **Framework**: Express.js with Socket.IO for real-time features
- **Database**: MongoDB for data persistence  
- **Caching**: In-memory caching with TTL expiration
- **AI Integration**: Cohere and Google Generative AI support
- **Security**: Rate limiting, CORS, input validation, compression
- **Authentication**: Relies on NextAuth from client
- **Deployment**: Optimized for Render free service (no containers/Redis)

### Frontend (Client)
- **Framework**: Next.js with TypeScript
- **Authentication**: NextAuth.js for session management
- **UI Components**: Material-UI, DaisyUI, Tailwind CSS
- **Code Editor**: Monaco Editor
- **Real-time**: Socket.IO client
- **Drawing**: Perfect Freehand for whiteboard

## Deployment on Render

### Environment Variables Required

**Server `.env` file** based on `server/.env.example`:

```bash
# Database - Use MongoDB Atlas (free tier)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codefode

# Server
PORT=8080
NODE_ENV=production

# AI Services (at least one required)
COHERE_API_KEY=your-cohere-api-key
GOOGLE_AI_API_KEY=your-google-api-key

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS - Update with your domain
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000

# File & AI Limits
MAX_FILE_SIZE=10485760
MAX_CODE_LENGTH=100000
AI_REQUEST_TIMEOUT=120000

# Socket.IO
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

**Client `.env.local` file** based on `client/.env.example`:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# Server URLs
NEXT_PUBLIC_SERVER_URL=https://your-backend-render-url.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-render-url.com

# Feature Flags
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_FEATURE_WHITEBOARD=true
NEXT_PUBLIC_FEATURE_AI_CHAT=true
NEXT_PUBLIC_FEATURE_REALTIME=true
```

### Render Deployment Steps

1. **Backend Deployment** (Web Service):
   - Connect your GitHub repo to Render
   - Service type: Web Service
   - Root directory: `server/`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add all server environment variables from above

2. **Frontend Deployment** (Static Site or Web Service):
   - Create separate Render service for client
   - Service type: Static Site (recommended) or Web Service
   - Root directory: `client/`
   - Build command: `npm install && npm run build`
   - Publish directory: `out/` (for static) or Start command: `npm start` (for web service)
   - Add all client environment variables from above

### Key Differences from Development

- **No Docker**: Uses native Node.js deployment
- **No Redis**: Uses in-memory caching 
- **No JWT server-side**: NextAuth handles authentication
- **Compression enabled**: Automatic gzip for better performance
- **Environment validation**: Strict config validation on startup

## Features

- **Code Editor**: Monaco-based editor with syntax highlighting
- **AI Assistance**: Code generation and suggestions
- **Real-time Collaboration**: Multi-user editing with Socket.IO
- **Whiteboard**: Drawing and diagramming capabilities
- **Workspace Management**: Project organization
- **Security**: Rate limiting, input validation, secure headers

## Local Development

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)

### Setup

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd CodeFode-AI-code-editor
   ```

2. **Backend setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend setup**:
   ```bash
   cd client
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/stats` - System statistics
- `POST /api/user/*` - User management
- `POST /api/workspace/*` - Workspace operations
- `POST /api/ai/*` - AI interactions
- `GET /api/notifications/*` - Notifications
- `POST /api/whiteboard/*` - Whiteboard operations

## Performance Optimizations

- **Request compression**: Gzip compression for responses > 1KB
- **In-memory caching**: TTL-based cache with automatic cleanup
- **Response size monitoring**: Alerts for large responses
- **Memory usage tracking**: Built-in monitoring for Render limits
- **Graceful shutdown handling**: Clean process termination
- **Rate limiting**: Configurable API protection
- **Automatic cache invalidation**: Smart cache management

## Security Features

- **Input sanitization**: Request validation and cleaning
- **CORS configuration**: Environment-based origin control
- **Security headers**: CSP, XSS protection, clickjacking prevention
- **Rate limiting**: Configurable limits (API: 100/15min, Code execution: 10/min)
- **Password hashing**: Bcrypt with configurable rounds
- **Request size limits**: Protection against large payloads
- **Client detection**: Automatic compression support detection

## Monitoring & Logging

- **Health check endpoint**: `/health` with system stats
- **Cache statistics**: `/api/stats` for cache monitoring  
- **Memory usage tracking**: Process memory monitoring
- **Request logging**: Winston-based structured logging
- **Error handling**: Centralized error logging and responses
- **Response size monitoring**: Alerts for large responses
- **Compression statistics**: Tracks compression ratios

