// src/routes/messageRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadMessage } from "../middleware/upload.js";
import {
  createMessage,
  getMessagesByChat,
  editMessage,
  deleteMessage,
  getUserSentiment,
  getChatSentiment,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", uploadMessage.single("media"), createMessage);
router.get("/chat/:chatId", getMessagesByChat);
// Sentiment endpoints
router.get("/sentiment/:userId", getUserSentiment);
router.get("/sentiment/:userId/chat/:chatId", getChatSentiment);
router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);

export default router;
