import express from "express";
import { createOrUpdateWorkspace, getWorkspace, deleteWorkspace, listWorkspaces, saveNotes, getNotes, getAllNotes, deleteNotes } from "../controllers/workspaceController.js";
import { validate, workspaceSchema, roomIdSchema } from "../middleware/validation.js";
import { workspaceCache, invalidateWorkspaceCache } from "../middleware/cache.js";
import { strictLimiter } from "../middleware/security.js";

const router = express.Router();

// Create or update workspace (with validation and cache invalidation)
router.post('/', 
  strictLimiter,
  validate(workspaceSchema),
  async (req, res, next) => {
    // Invalidate cache before update
    invalidateWorkspaceCache(req.body.roomId);
    next();
  },
  createOrUpdateWorkspace
);

// Get workspace (with caching)
router.get('/:roomId', 
  workspaceCache,
  getWorkspace
);

// Delete workspace
router.delete('/:roomId',
  strictLimiter,
  async (req, res, next) => {
    // Invalidate cache before deletion
    invalidateWorkspaceCache(req.params.roomId);
    next();
  },
  deleteWorkspace
);

// List workspaces (paginated)
router.get('/',
  listWorkspaces
);

// Notes routes
router.post('/:roomId/notes', 
  strictLimiter,
  async (req, res, next) => {
    invalidateWorkspaceCache(req.params.roomId);
    next();
  },
  saveNotes
);

router.get('/:roomId/notes/:filePath', 
  getNotes
);

router.get('/:roomId/notes', 
  getAllNotes
);

router.delete('/:roomId/notes/:filePath',
  strictLimiter,
  async (req, res, next) => {
    invalidateWorkspaceCache(req.params.roomId);
    next();
  },
  deleteNotes
);

export default router;