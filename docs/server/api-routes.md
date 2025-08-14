# API Routes Documentation

## 🌐 API Overview

CodeFode's backend provides RESTful API endpoints for workspace management, AI integration, user operations, and notifications.

## 🏗️ Route Structure

### Base URL
```
Development: http://localhost:8000
Production: https://your-domain.com
```

### API Versioning
All API endpoints are prefixed with `/api/` followed by the service category.

## 📁 Workspace API (`/api/workspace`)

### Create or Update Workspace

**Endpoint:** `POST /api/workspace`

**Description:** Creates a new workspace or updates an existing one with file structure, content, and metadata.

**Request Body:**
```json
{
  "roomId": "string (required)",
  "fileExplorerData": "object (optional)",
  "openFiles": [
    {
      "name": "string",
      "content": "string",
      "language": "string",
      "path": "string"
    }
  ],
  "activeFile": {
    "name": "string",
    "content": "string", 
    "language": "string",
    "path": "string"
  },
  "filesContent": [
    {
      "path": "string",
      "file": {
        "name": "string",
        "content": "string",
        "language": "string",
        "path": "string"
      }
    }
  ]
}
```

**Response:**
```json
{
  "_id": "string",
  "roomId": "string",
  "fileExplorerData": "object",
  "openFiles": "array",
  "activeFile": "object",
  "filesContent": "array",
  "lastUpdated": "string (ISO date)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Status Codes:**
- `200 OK` - Workspace updated successfully
- `400 Bad Request` - Missing or invalid room ID
- `500 Internal Server Error` - Database or validation error

### Get Workspace

**Endpoint:** `GET /api/workspace/:roomId`

**Description:** Retrieves workspace data for a specific room.

**Parameters:**
- `roomId` (path parameter) - Unique room identifier

**Response:**
```json
{
  "_id": "string",
  "roomId": "string", 
  "fileExplorerData": "object",
  "openFiles": "array",
  "activeFile": "object",
  "filesContent": "array",
  "lastUpdated": "string (ISO date)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Status Codes:**
- `200 OK` - Workspace found and returned
- `400 Bad Request` - Missing room ID
- `404 Not Found` - Workspace not found
- `500 Internal Server Error` - Database error

**Example Usage:**
```javascript
// Create/Update workspace
const response = await fetch('/api/workspace', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    roomId: 'room-123',
    fileExplorerData: fileStructure,
    openFiles: currentOpenFiles,
    activeFile: currentActiveFile,
    filesContent: allFilesContent
  })
});

// Get workspace
const workspace = await fetch('/api/workspace/room-123');
const data = await workspace.json();
```

## 🤖 AI Integration API (`/api/ai`)

### Process Code with AI

**Endpoint:** `POST /api/ai/code`

**Description:** Processes code with AI for suggestions, improvements, error detection, and explanations.

**Request Body:**
```json
{
  "code": "string (required)",
  "language": "string (required)",
  "requestType": "string (optional)", // "completion", "fix", "explain", "optimize"
  "context": "string (optional)"      // Additional context for AI processing
}
```

**Supported Languages:**
- `javascript`
- `typescript`
- `python`
- `java`
- `cpp`
- `c`
- `go`
- `rust`
- `html`
- `css`
- `sql`
- And more...

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "completion|fix|optimization|explanation",
        "description": "string",
        "code": "string",
        "confidence": "number (0-1)",
        "position": {
          "line": "number",
          "column": "number"
        }
      }
    ],
    "analysis": {
      "errors": ["array of error objects"],
      "warnings": ["array of warning objects"],
      "complexity": "string",
      "suggestions": ["array of improvement suggestions"]
    },
    "explanation": "string (if requested)"
  },
  "processingTime": "number (milliseconds)"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string",
  "message": "string",
  "code": "ERROR_CODE"
}
```

**Status Codes:**
- `200 OK` - Code processed successfully
- `400 Bad Request` - Missing code or language
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - AI service error

**Example Usage:**
```javascript
const response = await fetch('/api/ai/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'function hello() { console.log("Hello World"); }',
    language: 'javascript',
    requestType: 'completion'
  })
});

const result = await response.json();
console.log(result.data.suggestions);
```

## 👤 User Management API (`/api/user`)

### User Registration

**Endpoint:** `POST /api/user/register`

**Description:** Creates a new user account with email verification.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "name": "string", 
    "email": "string",
    "verified": false,
    "createdAt": "string (ISO date)"
  },
  "verificationSent": true
}
```

### User Profile

**Endpoint:** `GET /api/user/profile`

**Description:** Retrieves current user profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatar": "string (optional)",
    "verified": "boolean",
    "preferences": "object",
    "lastActive": "string (ISO date)"
  }
}
```

### Update User Profile

**Endpoint:** `PUT /api/user/profile`

**Description:** Updates user profile information.

**Request Body:**
```json
{
  "name": "string (optional)",
  "avatar": "string (optional)",
  "preferences": {
    "theme": "light|dark",
    "fontSize": "number",
    "language": "string"
  }
}
```

## 🔔 Notifications API (`/api/notifications`)

### Get Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Retrieves user notifications with pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `unread` - Filter unread only (default: false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "message": "string",
      "read": "boolean",
      "data": "object (optional)",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

### Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:notificationId/read`

**Description:** Marks a specific notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Create Notification

**Endpoint:** `POST /api/notifications`

**Description:** Creates a new notification for a user or room.

**Request Body:**
```json
{
  "userId": "string (optional)",
  "roomId": "string (optional)",
  "type": "info|warning|error|success",
  "title": "string",
  "message": "string",
  "data": "object (optional)"
}
```

## 🔒 Authentication Middleware

### Protected Routes

Many API endpoints require authentication via JWT tokens.

**Header Format:**
```
Authorization: Bearer <jwt-token>
```

**Protected Endpoints:**
- All `/api/user/*` routes (except registration)
- `/api/workspace/*` routes
- `/api/notifications/*` routes

**Unauthorized Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "code": "AUTH_REQUIRED"
}
```

## 🚦 Rate Limiting

### API Rate Limits

**Standard Endpoints:**
- 100 requests per minute per IP
- 1000 requests per hour per user

**AI Endpoints:**
- 10 requests per minute per user
- 100 requests per hour per user

**Code Execution:**
- 1 execution per second per user
- 30 executions per minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

## 📊 Response Format Standards

### Success Response Format

```json
{
  "success": true,
  "data": "object|array|string",
  "message": "string (optional)",
  "metadata": {
    "timestamp": "string (ISO date)",
    "version": "string",
    "requestId": "string"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "string",
  "message": "string",
  "code": "ERROR_CODE",
  "details": "object (optional)",
  "timestamp": "string (ISO date)"
}
```

### Standard HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🧪 Testing API Endpoints

### Example Test Cases

**Using curl:**
```bash
# Test workspace creation
curl -X POST http://localhost:8000/api/workspace \
  -H "Content-Type: application/json" \
  -d '{"roomId": "test-room", "openFiles": []}'

# Test AI code processing
curl -X POST http://localhost:8000/api/ai/code \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"hello\");", "language": "javascript"}'
```

**Using JavaScript fetch:**
```javascript
// Test workspace retrieval
const workspace = await fetch('/api/workspace/test-room');
const data = await workspace.json();

// Test AI suggestion
const aiResponse = await fetch('/api/ai/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'def hello_world():\n    print("Hello")',
    language: 'python'
  })
});
```

## 📝 API Documentation Tools

### OpenAPI/Swagger Integration

The API can be documented using OpenAPI specification for interactive documentation and testing.

### Postman Collection

A Postman collection is available for testing all API endpoints with example requests and responses.

### API Versioning Strategy

Future API versions will be handled through URL versioning:
- Current: `/api/`
- Future: `/api/v2/`, `/api/v3/`, etc.