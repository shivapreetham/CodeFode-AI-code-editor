# 📡 API Reference

Complete reference for CodeFode's REST API endpoints.

## 🌐 Base URL

**Development**: `http://localhost:8000`  
**Production**: `https://your-domain.com`

All API endpoints are prefixed with `/api`

## 🔒 Authentication

Currently, most endpoints don't require authentication, but user-specific endpoints may require session tokens in the future.

## 📁 Workspace API

### Get Workspace
Retrieve workspace data for a specific room.

```http
GET /api/workspace/:roomId
```

**Parameters:**
- `roomId` (string, required) - Unique room identifier

**Response:**
```json
{
  "success": true,
  "message": "Workspace retrieved successfully",
  "data": {
    "_id": "ObjectId",
    "roomId": "room-123",
    "fileExplorerData": {
      "id": "root",
      "name": "root",
      "isFolder": true,
      "path": "/root",
      "nodes": [...]
    },
    "openFiles": [
      {
        "name": "index.js",
        "content": "console.log('Hello World');",
        "language": "javascript",
        "path": "/root/index.js"
      }
    ],
    "activeFile": {
      "name": "index.js",
      "content": "console.log('Hello World');",
      "language": "javascript",
      "path": "/root/index.js"
    },
    "filesContent": [
      {
        "path": "/root/index.js",
        "file": {...}
      }
    ],
    "notifications": [...],
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Workspace found
- `404 Not Found` - Workspace doesn't exist
- `400 Bad Request` - Invalid roomId format
- `500 Internal Server Error` - Server error

### Save Workspace
Create or update workspace data.

```http
POST /api/workspace
```

**Request Body:**
```json
{
  "roomId": "room-123",
  "fileExplorerData": {
    "id": "root",
    "name": "root",
    "isFolder": true,
    "path": "/root",
    "nodes": [...]
  },
  "openFiles": [
    {
      "name": "index.js",
      "content": "console.log('Hello World');",
      "language": "javascript",
      "path": "/root/index.js"
    }
  ],
  "activeFile": {
    "name": "index.js",
    "content": "console.log('Hello World');",
    "language": "javascript",
    "path": "/root/index.js"
  },
  "filesContent": [
    {
      "path": "/root/index.js",
      "file": {...}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workspace saved successfully",
  "data": {
    "_id": "ObjectId",
    "roomId": "room-123",
    // ... workspace data
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Workspace updated
- `201 Created` - New workspace created
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

## 🤖 AI API

### Analyze Code
Get AI-powered code analysis, suggestions, and best practices.

```http
POST /api/ai/code
```

**Request Body:**
```json
{
  "code": "console.log('Hello World');",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code analysis completed successfully",
  "data": {
    "errors": [
      {
        "title": "Missing semicolon",
        "line": "1",
        "code": "console.log('Hello World')",
        "fixedCode": "console.log('Hello World');",
        "description": "JavaScript statements should end with semicolons for clarity"
      }
    ],
    "suggestions": [
      {
        "title": "Use template literals",
        "code": "console.log(`Hello World`);",
        "explanation": "Template literals provide better string formatting capabilities"
      }
    ],
    "bestPractices": [
      {
        "title": "Use const for constants",
        "code": "const message = 'Hello World';\nconsole.log(message);",
        "explanation": "Use const for values that won't be reassigned"
      }
    ],
    "metadata": {
      "language": "javascript",
      "codeLength": 25,
      "processedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Status Codes:**
- `200 OK` - Analysis completed
- `400 Bad Request` - Missing code or language
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - AI service error

**Rate Limits:**
- 10 requests per minute per IP
- Maximum code length: 50,000 characters

## 🔔 Notifications API

### Get Notifications
Retrieve notifications for a workspace.

```http
GET /api/notifications/:roomId
```

**Parameters:**
- `roomId` (string, required) - Room identifier

**Response:**
```json
{
  "notifications": [
    {
      "_id": "ObjectId",
      "type": "FILE_CREATE",
      "message": "user@example.com created file: index.js",
      "username": "user@example.com",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "path": "/root/index.js",
        "language": "javascript"
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Notifications retrieved
- `404 Not Found` - Workspace not found
- `500 Internal Server Error` - Server error

### Add Notification
Add a new notification to the workspace.

```http
POST /api/notifications/:roomId
```

**Request Body:**
```json
{
  "type": "FILE_CREATE",
  "message": "user@example.com created file: index.js",
  "username": "user@example.com",
  "metadata": {
    "path": "/root/index.js",
    "language": "javascript"
  }
}
```

**Response:**
```json
{
  "notification": {
    "_id": "ObjectId",
    "type": "FILE_CREATE",
    "message": "user@example.com created file: index.js",
    "username": "user@example.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "metadata": {...}
  }
}
```

**Notification Types:**
- `FILE_CREATE` - File created
- `FILE_UPDATE` - File modified
- `FILE_DELETE` - File deleted
- `FILE_MOVE` - File moved/renamed
- `FOLDER_CREATE` - Folder created
- `FOLDER_DELETE` - Folder deleted
- `FOLDER_MOVE` - Folder moved/renamed
- `USER_JOIN` - User joined workspace
- `USER_LEAVE` - User left workspace
- `CODE_EXECUTE` - Code executed

### Clean Old Notifications
Remove notifications older than 7 days.

```http
DELETE /api/notifications/:roomId/cleanup
```

**Response:**
```json
{
  "message": "Cleaned up 5 old notifications"
}
```

### Get Filtered Notifications
Get notifications with filters.

```http
GET /api/notifications/:roomId/filter
```

**Query Parameters:**
- `type` (string, optional) - Filter by notification type
- `username` (string, optional) - Filter by username
- `startDate` (string, optional) - Filter from date (ISO string)
- `endDate` (string, optional) - Filter to date (ISO string)

**Example:**
```http
GET /api/notifications/room-123/filter?type=FILE_CREATE&username=john@example.com
```

## 👤 User API

### Register User
Create a new user account.

```http
POST /api/user/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "ObjectId",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login User
Authenticate user credentials.

```http
POST /api/user/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "ObjectId",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

## 🏥 Health Check

### Health Status
Check server health and status.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "memory": {
    "rss": 45678912,
    "heapTotal": 23456789,
    "heapUsed": 12345678,
    "external": 1234567,
    "arrayBuffers": 123456
  },
  "environment": "development",
  "version": "1.0.0"
}
```

### System Stats
Get system statistics and cache information.

```http
GET /api/stats
```

**Response:**
```json
{
  "cache": {
    "size": 10,
    "hits": 150,
    "misses": 25,
    "hitRate": 0.857
  },
  "memory": {
    "rss": 45678912,
    "heapTotal": 23456789,
    "heapUsed": 12345678
  },
  "uptime": 12345.67
}
```

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details (development only)",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

**400 Bad Request**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": {
    "field": "roomId",
    "issue": "Required field missing"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "API endpoint not found",
  "path": "/api/invalid-endpoint",
  "method": "GET"
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Rate Limiting

### Default Limits
- **General API**: 100 requests per 15 minutes per IP
- **AI Endpoints**: 10 requests per minute per IP
- **File Upload**: 5 MB maximum file size
- **Code Analysis**: 50,000 characters maximum

### Headers
Rate limit information is included in response headers:
```
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 12345
```

## 📚 Code Examples

### JavaScript/Node.js
```javascript
// Using fetch API
const response = await fetch('http://localhost:8000/api/workspace/room-123');
const data = await response.json();

if (data.success) {
  console.log('Workspace:', data.data);
} else {
  console.error('Error:', data.message);
}
```

### cURL Examples
```bash
# Get workspace
curl -X GET http://localhost:8000/api/workspace/room-123

# Save workspace
curl -X POST http://localhost:8000/api/workspace \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-123","openFiles":[]}'

# Analyze code with AI
curl -X POST http://localhost:8000/api/ai/code \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"test\");","language":"javascript"}'
```

### Python Requests
```python
import requests

# Get workspace
response = requests.get('http://localhost:8000/api/workspace/room-123')
data = response.json()

if data['success']:
    print('Workspace:', data['data'])
else:
    print('Error:', data['message'])
```

## 📚 Related Documentation

- **[Socket Events](./sockets.md)** - Real-time communication
- **[Database](./database.md)** - Data models and schemas
- **[Middleware](./middleware.md)** - Request processing pipeline