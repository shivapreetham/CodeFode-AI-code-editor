import express from "express";
import { createOrUpdateWorkspace, getWorkspace } from "../controllers/workspaceController.js";


const router = express.Router();

router.post('/', createOrUpdateWorkspace);
router.get('/:roomId', getWorkspace);

export default router;