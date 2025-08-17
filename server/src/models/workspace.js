import mongoose from "mongoose";

const fileExplorerNodeSchema = new mongoose.Schema({
  id: String,
  name: String,
  isFolder: Boolean,
  path: String,
  nodes: []
});

fileExplorerNodeSchema.add({ nodes: [fileExplorerNodeSchema] });

const fileSchema = new mongoose.Schema({
  name: String,
  content: String,
  language: String,
  path: String
});

const filesContentSchema = new mongoose.Schema({
  path: String,
  file: fileSchema
});

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'FILE_CREATE', 'FILE_UPDATE', 'FILE_DELETE', 'FILE_MOVE', 'FILE_OPEN', 
      'FILE_EDIT_START', 'FILE_EDIT_END', 'FOLDER_CREATE', 'FOLDER_DELETE', 
      'USER_JOIN', 'USER_LEAVE', 'CODE_EXECUTE', 'WHITEBOARD_DRAW', 
      'WHITEBOARD_TEXT', 'WHITEBOARD_CLEAR'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    path: String,                    // For file/folder operations
    language: String,                // For file operations
    executionStatus: String,         // For code execution
    action: String,                  // open, edit_start, edit_end, draw, text, clear
    duration: Number,                // For edit sessions in milliseconds
    coordinates: {                   // For whiteboard actions
      x: Number,
      y: Number
    }
  }
});

const workspaceSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  fileExplorerData: fileExplorerNodeSchema,
  openFiles: [fileSchema],
  activeFile: fileSchema,
  filesContent: [filesContentSchema],
  notifications: [notificationSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export const Workspace = mongoose.model("Workspace", workspaceSchema);