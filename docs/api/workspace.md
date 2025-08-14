# Workspace API

## 📁 Workspace Management

The Workspace API provides endpoints for managing collaborative coding workspaces, file structures, and content synchronization.

## 📍 Base URL
```
Development: http://localhost:8000/api/workspace
Production: https://your-api-domain.com/api/workspace
```

## 🔐 Authentication

All workspace endpoints require authentication via JWT token:

```
Authorization: Bearer <jwt_token>
```

## 📂 Workspace Operations

### Create or Update Workspace

**Endpoint:** `POST /api/workspace`

**Description:** Creates a new workspace or updates an existing workspace with complete file structure, content, and metadata.

**Request Body:**
```json
{
  "roomId": "string (required, 3-100 chars)",
  "fileExplorerData": {
    "type": "object (optional)",
    "description": "Hierarchical file/folder structure",
    "example": {
      "src": {
        "type": "folder",
        "children": {
          "index.js": {
            "type": "file",
            "language": "javascript"
          },
          "components": {
            "type": "folder",
            "children": {}
          }
        }
      }
    }
  },
  "openFiles": [
    {
      "name": "string (required)",
      "content": "string (required)",
      "language": "string (required)",
      "path": "string (required, unique file path)"
    }
  ],
  "activeFile": {
    "name": "string (optional)",
    "content": "string (optional)",
    "language": "string (optional)",
    "path": "string (optional)"
  },
  "filesContent": [
    {
      "path": "string (required, file system path)",
      "file": {
        "name": "string (required)",
        "content": "string (required)",
        "language": "string (required)",
        "path": "string (required)"
      }
    }
  ]
}
```

**Supported Languages:**
- `javascript` - JavaScript files
- `typescript` - TypeScript files
- `python` - Python files
- `java` - Java files
- `cpp` - C++ files
- `c` - C files
- `html` - HTML files
- `css` - CSS files
- `json` - JSON files
- `markdown` - Markdown files
- `yaml` - YAML files
- `sql` - SQL files
- `bash` - Shell scripts
- `go` - Go files
- `rust` - Rust files
- `php` - PHP files

**Success Response (200 OK):**
```json
{
  "_id": "string (MongoDB ObjectId)",
  "roomId": "string",
  "fileExplorerData": "object",
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
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
```json
// 400 Bad Request - Missing Room ID
{
  "error": "Room ID is required",
  "message": "roomId field is mandatory for workspace operations"
}

// 413 Payload Too Large - Content Size Limit
{
  "error": "Payload too large",
  "message": "Workspace content exceeds maximum size limit",
  "maxSize": "10MB"
}

// 500 Internal Server Error - Database Error
{
  "error": "Database operation failed",
  "message": "Failed to save workspace data",
  "stack": "Error stack trace (development only)"
}
```

### Get Workspace

**Endpoint:** `GET /api/workspace/:roomId`

**Description:** Retrieves complete workspace data for a specific room including all files, structure, and metadata.

**Path Parameters:**
- `roomId` (string, required): Unique workspace/room identifier

**Success Response (200 OK):**
```json
{
  "_id": "string",
  "roomId": "string",
  "fileExplorerData": "object",
  "openFiles": "array",
  "activeFile": "object",
  "filesContent": "array",
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "collaborators": [
    {
      "userId": "string",
      "username": "string",
      "role": "owner|editor|viewer",
      "lastActive": "2024-01-01T00:00:00.000Z"
    }
  ],
  "statistics": {
    "totalFiles": "number",
    "totalLines": "number",
    "lastModified": "2024-01-01T00:00:00.000Z",
    "fileTypes": {
      "javascript": 5,
      "typescript": 3,
      "css": 2
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Missing Room ID
{
  "error": "Room ID required",
  "message": "Room ID parameter is missing from the request"
}

// 404 Not Found - Workspace Not Found
{
  "error": "Workspace not found",
  "message": "No workspace exists with the specified room ID",
  "roomId": "requested-room-id"
}

// 403 Forbidden - Access Denied
{
  "error": "Access denied",
  "message": "You don't have permission to access this workspace",
  "requiredRole": "editor"
}
```

### Delete Workspace

**Endpoint:** `DELETE /api/workspace/:roomId`

**Description:** Permanently deletes a workspace and all associated data.

**Path Parameters:**
- `roomId` (string, required): Workspace identifier to delete

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Workspace deleted successfully",
  "roomId": "deleted-room-id",
  "deletedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Workspace not found",
  "message": "Cannot delete non-existent workspace"
}

// 403 Forbidden - Insufficient Permissions
{
  "error": "Insufficient permissions",
  "message": "Only workspace owners can delete workspaces"
}
```

## 📁 File Operations

### Create File

**Endpoint:** `POST /api/workspace/:roomId/files`

**Description:** Creates a new file in the workspace.

**Request Body:**
```json
{
  "path": "string (required, file path)",
  "name": "string (required, file name)",
  "content": "string (optional, default: '')",
  "language": "string (required, programming language)",
  "type": "file"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "file": {
    "path": "string",
    "name": "string",
    "content": "string",
    "language": "string",
    "size": "number (bytes)",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "File created successfully"
}
```

### Update File Content

**Endpoint:** `PUT /api/workspace/:roomId/files`

**Description:** Updates the content of an existing file.

**Request Body:**
```json
{
  "path": "string (required)",
  "content": "string (required)",
  "version": "number (optional, for conflict detection)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "file": {
    "path": "string",
    "content": "string",
    "size": "number",
    "lastModified": "2024-01-01T00:00:00.000Z",
    "version": "number"
  },
  "message": "File updated successfully"
}
```

**Error Responses:**
```json
// 409 Conflict - Version Mismatch
{
  "error": "Version conflict",
  "message": "File has been modified by another user",
  "currentVersion": 5,
  "providedVersion": 3
}
```

### Delete File

**Endpoint:** `DELETE /api/workspace/:roomId/files`

**Description:** Deletes a file from the workspace.

**Request Body:**
```json
{
  "path": "string (required, file path to delete)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "path": "deleted/file/path"
}
```

### Rename File

**Endpoint:** `PATCH /api/workspace/:roomId/files/rename`

**Description:** Renames or moves a file within the workspace.

**Request Body:**
```json
{
  "oldPath": "string (required)",
  "newPath": "string (required)",
  "newName": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "File renamed successfully",
  "oldPath": "old/path/file.js",
  "newPath": "new/path/file.js"
}
```

## 📂 Folder Operations

### Create Folder

**Endpoint:** `POST /api/workspace/:roomId/folders`

**Description:** Creates a new folder in the workspace.

**Request Body:**
```json
{
  "path": "string (required, folder path)",
  "name": "string (required, folder name)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "folder": {
    "path": "string",
    "name": "string",
    "type": "folder",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Folder created successfully"
}
```

### Delete Folder

**Endpoint:** `DELETE /api/workspace/:roomId/folders`

**Description:** Deletes a folder and all its contents.

**Request Body:**
```json
{
  "path": "string (required, folder path)",
  "recursive": "boolean (optional, default: false)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Folder deleted successfully",
  "path": "deleted/folder/path",
  "deletedFiles": 5
}
```

## 👥 Collaboration Features

### Get Workspace Collaborators

**Endpoint:** `GET /api/workspace/:roomId/collaborators`

**Description:** Retrieves list of users with access to the workspace.

**Success Response (200 OK):**
```json
{
  "collaborators": [
    {
      "userId": "string",
      "username": "string",
      "email": "string",
      "role": "owner|editor|viewer",
      "avatar": "string (optional)",
      "lastActive": "2024-01-01T00:00:00.000Z",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "permissions": {
        "read": true,
        "write": true,
        "delete": false,
        "invite": false
      }
    }
  ],
  "totalCollaborators": "number"
}
```

### Add Collaborator

**Endpoint:** `POST /api/workspace/:roomId/collaborators`

**Description:** Invites a user to collaborate on the workspace.

**Request Body:**
```json
{
  "email": "string (required)",
  "role": "editor|viewer (required)",
  "message": "string (optional, invitation message)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "invitation": {
    "email": "string",
    "role": "string",
    "invitedBy": "string",
    "invitedAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  },
  "message": "Invitation sent successfully"
}
```

### Update Collaborator Role

**Endpoint:** `PUT /api/workspace/:roomId/collaborators/:userId`

**Description:** Updates a collaborator's role and permissions.

**Request Body:**
```json
{
  "role": "owner|editor|viewer (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "collaborator": {
    "userId": "string",
    "role": "string",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Collaborator role updated successfully"
}
```

### Remove Collaborator

**Endpoint:** `DELETE /api/workspace/:roomId/collaborators/:userId`

**Description:** Removes a collaborator from the workspace.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Collaborator removed successfully",
  "removedUser": "string (userId)"
}
```

## 📊 Workspace Analytics

### Get Workspace Statistics

**Endpoint:** `GET /api/workspace/:roomId/stats`

**Description:** Retrieves workspace usage statistics and metrics.

**Success Response (200 OK):**
```json
{
  "statistics": {
    "files": {
      "total": 25,
      "byLanguage": {
        "javascript": 10,
        "typescript": 8,
        "css": 4,
        "html": 3
      }
    },
    "content": {
      "totalLines": 1250,
      "totalCharacters": 45000,
      "totalSize": "156KB"
    },
    "activity": {
      "lastModified": "2024-01-01T00:00:00.000Z",
      "editsToday": 15,
      "activeCollaborators": 3
    },
    "performance": {
      "loadTime": "120ms",
      "syncTime": "45ms"
    }
  },
  "trends": {
    "dailyEdits": [12, 15, 8, 20, 15],
    "popularFiles": [
      {
        "path": "src/index.js",
        "edits": 25,
        "views": 100
      }
    ]
  }
}
```

## 🔍 Search and Discovery

### Search Workspace Content

**Endpoint:** `GET /api/workspace/:roomId/search`

**Description:** Searches for content within workspace files.

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): File type filter
- `case` (boolean, optional): Case sensitive search
- `regex` (boolean, optional): Use regex pattern
- `limit` (number, optional): Max results (default: 50)

**Success Response (200 OK):**
```json
{
  "results": [
    {
      "file": "src/components/Header.js",
      "matches": [
        {
          "line": 15,
          "column": 10,
          "text": "function Header() {",
          "preview": "function Header() { return <div>..."
        }
      ],
      "matchCount": 3
    }
  ],
  "totalResults": 12,
  "searchTime": "25ms",
  "query": "Header"
}
```

## 🔄 Version Control

### Get File History

**Endpoint:** `GET /api/workspace/:roomId/files/history`

**Description:** Retrieves version history for a specific file.

**Query Parameters:**
- `path` (string, required): File path
- `limit` (number, optional): Number of versions (default: 10)

**Success Response (200 OK):**
```json
{
  "history": [
    {
      "version": 5,
      "content": "file content at version 5",
      "size": 1024,
      "modifiedBy": "user123",
      "modifiedAt": "2024-01-01T00:00:00.000Z",
      "changes": {
        "linesAdded": 10,
        "linesRemoved": 2,
        "charactersChanged": 150
      }
    }
  ],
  "currentVersion": 5,
  "totalVersions": 5
}
```

## 🧪 Testing Workspace API

### Example Usage

```javascript
// Create a new workspace
const createWorkspace = async () => {
  const response = await fetch('/api/workspace', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      roomId: 'my-project-123',
      fileExplorerData: {
        src: {
          type: 'folder',
          children: {
            'index.js': {
              type: 'file',
              language: 'javascript'
            }
          }
        }
      },
      openFiles: [{
        name: 'index.js',
        content: 'console.log("Hello World");',
        language: 'javascript',
        path: 'src/index.js'
      }],
      filesContent: [{
        path: 'src/index.js',
        file: {
          name: 'index.js',
          content: 'console.log("Hello World");',
          language: 'javascript',
          path: 'src/index.js'
        }
      }]
    })
  });
  
  return await response.json();
};

// Get workspace data
const getWorkspace = async (roomId) => {
  const response = await fetch(`/api/workspace/${roomId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Update file content
const updateFile = async (roomId, path, content) => {
  const response = await fetch(`/api/workspace/${roomId}/files`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      path: path,
      content: content
    })
  });
  
  return await response.json();
};
```

## 🛡️ Security Considerations

### Access Control
- All endpoints require valid JWT authentication
- Role-based permissions for workspace operations
- Owner permissions required for destructive operations

### Input Validation
- File paths are validated to prevent directory traversal
- Content size limits to prevent abuse
- File name sanitization to prevent security issues

### Rate Limiting
- File operations: 100 requests per minute per user
- Search operations: 20 requests per minute per user
- Content updates: 50 requests per minute per workspace