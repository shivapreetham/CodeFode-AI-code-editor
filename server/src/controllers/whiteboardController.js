import Whiteboard from '../models/whiteboard.js';
import { Workspace } from '../models/workspace.js';

export const getWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    let whiteboard = await Whiteboard.findByRoomId(roomId);
    
    if (!whiteboard) {
      // Create a new whiteboard if none exists
      whiteboard = new Whiteboard({
        roomId,
        canvasData: null,
        modifiedBy: 'system'
      });
      await whiteboard.save();
    }
    
    return res.status(200).json({
      success: true,
      data: {
        roomId: whiteboard.roomId,
        canvasData: whiteboard.canvasData,
        lastModified: whiteboard.lastModified,
        modifiedBy: whiteboard.modifiedBy,
        version: whiteboard.version,
        metadata: whiteboard.metadata
      }
    });
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const saveWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { canvasData, username, metadata } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    const whiteboard = await Whiteboard.createOrUpdate(roomId, canvasData, username);
    
    // Update metadata if provided
    if (metadata) {
      whiteboard.metadata = { ...whiteboard.metadata.toObject(), ...metadata };
      await whiteboard.save();
    }
    
    return res.status(200).json({
      success: true,
      data: {
        roomId: whiteboard.roomId,
        version: whiteboard.version,
        lastModified: whiteboard.lastModified,
        modifiedBy: whiteboard.modifiedBy
      }
    });
  } catch (error) {
    console.error('Error saving whiteboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.body;
    
    const whiteboard = await Whiteboard.findByRoomId(roomId);
    
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }
    
    // Check if user has permission to delete (admin or creator)
    const collaborator = whiteboard.collaborators.find(c => c.username === username);
    if (!collaborator || (collaborator.permissions !== 'admin' && whiteboard.modifiedBy !== username)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete whiteboard'
      });
    }
    
    await Whiteboard.deleteOne({ roomId });
    
    return res.status(200).json({
      success: true,
      message: 'Whiteboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getRecentWhiteboards = async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 10 } = req.query;
    
    const recentWhiteboards = await Whiteboard.getRecentWhiteboards(username, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: recentWhiteboards
    });
  } catch (error) {
    console.error('Error fetching recent whiteboards:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const exportWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { format = 'json', username } = req.body;
    
    const whiteboard = await Whiteboard.findByRoomId(roomId);
    
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }
    
    // Check if user has access
    const collaborator = whiteboard.collaborators.find(c => c.username === username);
    if (!collaborator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    let exportData;
    let contentType;
    let filename;
    
    switch (format) {
      case 'json':
        exportData = {
          roomId: whiteboard.roomId,
          canvasData: whiteboard.canvasData,
          metadata: whiteboard.metadata,
          exportedAt: new Date().toISOString(),
          exportedBy: username
        };
        contentType = 'application/json';
        filename = `whiteboard-${roomId}-${Date.now()}.json`;
        break;
        
      case 'svg':
        // TODO: Implement SVG export
        return res.status(501).json({
          success: false,
          message: 'SVG export not yet implemented'
        });
        
      case 'pdf':
        // TODO: Implement PDF export
        return res.status(501).json({
          success: false,
          message: 'PDF export not yet implemented'
        });
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format'
        });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.status(200).json({
      success: true,
      data: exportData,
      filename
    });
  } catch (error) {
    console.error('Error exporting whiteboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to add whiteboard activity notification
export const addWhiteboardNotification = async (roomId, type, username, message, metadata = {}) => {
  try {
    const workspace = await Workspace.findOne({ roomId });
    
    if (workspace) {
      const notification = {
        type,
        message,
        username,
        timestamp: new Date(),
        metadata
      };
      
      workspace.notifications.push(notification);
      workspace.lastUpdated = new Date();
      
      await workspace.save();
      
      return notification;
    }
  } catch (error) {
    console.error('Error adding whiteboard notification:', error);
  }
  
  return null;
};