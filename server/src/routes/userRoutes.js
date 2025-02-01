import express from "express";
import { addUser, getUsers } from "../controllers/userControllers.js";

const router = express.Router();

// Routes
router.get("/", getUsers);
router.post("/", addUser);

export default router;