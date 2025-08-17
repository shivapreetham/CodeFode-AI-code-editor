import express from 'express';
import { 
  getWhiteboard, 
  saveWhiteboard, 
  deleteWhiteboard,
  getRecentWhiteboards,
  exportWhiteboard 
} from '../controllers/whiteboardController.js';

const router = express.Router();

// Get whiteboard data for a room
router.get('/:roomId', getWhiteboard);

// Save whiteboard data
router.post('/:roomId', saveWhiteboard);

// Delete whiteboard
router.delete('/:roomId', deleteWhiteboard);

// Get recent whiteboards for a user
router.get('/user/:username/recent', getRecentWhiteboards);

// Export whiteboard
router.post('/:roomId/export', exportWhiteboard);

export default router;