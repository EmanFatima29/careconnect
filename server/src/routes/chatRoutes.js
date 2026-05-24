// src/routes/chatRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createChat,
  getAllChats,
  getChatById,
  deleteChat,
  getOrCreateChat,
  markChatRead,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createChat);
router.post("/get-or-create-chat", getOrCreateChat);
router.post("/:id/mark-read", markChatRead);
router.get("/", getAllChats);
router.get("/:id", getChatById);
router.delete("/:id", deleteChat);

export default router;
