# 🚀 Client Quick Start Guide

Get the CodeFode frontend up and running in minutes!

## ⚡ Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 📦 Installation

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd CodeFode-AI-code-editor/client
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create `.env.local` in the client root:
```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at: **http://localhost:3000**

## 🔧 Development Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── components/      # UI components
│   │   ├── room/           # Collaboration features
│   │   ├── (auth)/         # Authentication pages
│   │   ├── globals.css     # Global styles
│   │   └── layout.tsx      # Root layout
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── interfaces/         # TypeScript types
│   ├── services/           # API functions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── .env.local             # Environment variables
└── package.json           # Dependencies
```

## 🎯 Key Features to Explore

### 1. Real-time Code Editor
- Navigate to `/room/{roomId}?username={your-name}`
- Experience live code collaboration
- Try different programming languages

### 2. AI Integration
- Click the AI sidebar button
- Get code suggestions and fixes
- Ask for code explanations

### 3. File Management
- Use the file explorer to create/delete files
- Organize your code in folders
- Switch between multiple files

### 4. Chat System
- Communicate with other users
- Share code snippets
- Collaborate in real-time

## ⚙️ Configuration Options

### Theme Configuration
The app supports light/dark themes. Toggle using the theme button in the header.

### Editor Settings
- Font size adjustment
- Syntax highlighting
- Line numbers
- Auto-completion

### Collaboration Settings
- Real-time cursor tracking
- Live code synchronization  
- Chat notifications

## 🔌 API Integration

The client connects to the backend server for:

### REST API Calls
```typescript
// Example API call
import { workspaceApi } from '@/services/workspaceApi';

const workspace = await workspaceApi.getWorkspace(roomId);
```

### Socket.IO Connection
```typescript
// Socket connection
import { initSocket } from '@/socket';

const socket = initSocket();
socket.emit('join', { roomId, username });
```

## 🚨 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Environment variables not loading:**
- Ensure `.env.local` is in the client root
- Restart the development server
- Check variable names start with `NEXT_PUBLIC_`

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Socket connection failed:**
- Check backend server is running on port 8000
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check browser network tab for errors

### Development Tips

1. **Hot Reload**: Changes auto-refresh in development
2. **DevTools**: Use React Developer Tools extension  
3. **Network Tab**: Monitor API calls and WebSocket connections
4. **Console**: Check for JavaScript errors and warnings

## 🎨 Customization

### Adding New Components
```typescript
// src/app/components/MyComponent.tsx
import React from 'react';

export const MyComponent: React.FC = () => {
  return (
    <div className="p-4">
      My Custom Component
    </div>
  );
};
```

### Creating Custom Hooks
```typescript
// src/hooks/useMyFeature.ts
import { useState, useEffect } from 'react';

export const useMyFeature = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Custom logic here
  }, []);
  
  return { data };
};
```

### Styling with Tailwind
```jsx
<div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
    Welcome to CodeFode
  </h1>
</div>
```

## 📚 Next Steps

1. **[Components Guide](./components.md)** - Learn about UI components
2. **[State Management](./state-management.md)** - Understand contexts and hooks
3. **[Real-time Features](./realtime.md)** - Explore Socket.IO integration
4. **[API Integration](./api-integration.md)** - Work with backend services

## 🤝 Getting Help

- Check the [troubleshooting section](#troubleshooting) above
- Review browser console for errors
- Examine network requests in DevTools
- Look at existing component implementations for patterns