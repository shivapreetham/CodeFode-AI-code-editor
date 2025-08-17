import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  canvasData: {
    type: mongoose.Schema.Types.Mixed, // Fabric.js canvas JSON
    default: null
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  modifiedBy: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    width: {
      type: Number,
      default: 1200
    },
    height: {
      type: Number,
      default: 800
    },
    background: {
      type: String,
      default: '#ffffff'
    }
  },
  collaborators: [{
    username: String,
    lastActive: Date,
    permissions: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'write'
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
whiteboardSchema.index({ roomId: 1, lastModified: -1 });
whiteboardSchema.index({ 'collaborators.username': 1 });

// Instance methods
whiteboardSchema.methods.updateCanvas = function(canvasData, username) {
  this.canvasData = canvasData;
  this.lastModified = new Date();
  this.modifiedBy = username;
  this.version += 1;
  
  // Update collaborator last active time
  const collaborator = this.collaborators.find(c => c.username === username);
  if (collaborator) {
    collaborator.lastActive = new Date();
  } else {
    this.collaborators.push({
      username,
      lastActive: new Date(),
      permissions: 'write'
    });
  }
  
  return this.save();
};

whiteboardSchema.methods.addCollaborator = function(username, permissions = 'write') {
  const existingCollaborator = this.collaborators.find(c => c.username === username);
  
  if (!existingCollaborator) {
    this.collaborators.push({
      username,
      lastActive: new Date(),
      permissions
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

whiteboardSchema.methods.removeCollaborator = function(username) {
  this.collaborators = this.collaborators.filter(c => c.username !== username);
  return this.save();
};

// Static methods
whiteboardSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId }).exec();
};

whiteboardSchema.statics.createOrUpdate = async function(roomId, canvasData, username) {
  let whiteboard = await this.findByRoomId(roomId);
  
  if (!whiteboard) {
    whiteboard = new this({
      roomId,
      canvasData,
      modifiedBy: username,
      collaborators: [{
        username,
        lastActive: new Date(),
        permissions: 'write'
      }]
    });
  } else {
    await whiteboard.updateCanvas(canvasData, username);
  }
  
  return whiteboard.save();
};

whiteboardSchema.statics.getRecentWhiteboards = function(username, limit = 10) {
  return this.find({
    'collaborators.username': username
  })
  .sort({ lastModified: -1 })
  .limit(limit)
  .select('roomId lastModified modifiedBy metadata.width metadata.height')
  .exec();
};

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);
export default Whiteboard;