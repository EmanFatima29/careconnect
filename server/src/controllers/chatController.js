import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
// src/controllers/chatController.js
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { logActivity } from "../services/activityLogService.js";
import redis from "../../lib/redis.js";

const CHAT_LIST_TTL = 300; // 5 min cache for chat list
const CHAT_CACHE_PREFIX = "cache:chats:";

/**
 * Invalidate chat list cache for all participants of a chat
 */
async function invalidateChatListCache(participantIds) {
  try {
    const keys = participantIds.map((id) => `${CHAT_CACHE_PREFIX}${id}`);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.error("[ChatCache] Invalidation error:", err.message);
  }
}
// Create a new chat
export const createChat = asyncHandler(async (req, res) => {
  try {
    const { participants, isGroup = false } = req.body;

    if (!Array.isArray(participants) || participants.length < 2) {
      return res
        .status(400)
        .json({ error: "participants must be an array of at least 2 users" });
    }

    const normalizedParticipants = [...new Set(participants.map(String))];
    const invalidId = normalizedParticipants.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidId) {
      return res
        .status(400)
        .json({ error: `Invalid participant id: ${invalidId}` });
    }

    // For one-to-one chats, prevent accidental duplicates.
    if (!isGroup && normalizedParticipants.length === 2) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: normalizedParticipants },
        $expr: { $eq: [{ $size: "$participants" }, 2] },
      });
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    const unreadMessages = {};
    for (const id of normalizedParticipants) unreadMessages[id] = 0;

    const chat = await Chat.create({
      participants: normalizedParticipants,
      isGroup: Boolean(isGroup),
      unreadMessages,
    });

    await User.updateMany(
      { _id: { $in: normalizedParticipants } },
      { $addToSet: { chats: chat._id } },
    );

    await logActivity({
      req,
      action: "chat.create",
      entityType: "Chat",
      entityId: chat._id,
      metadata: {
        isGroup: Boolean(isGroup),
        participants: normalizedParticipants,
      },
    });

    // Invalidate chat list cache for all participants
    await invalidateChatListCache(normalizedParticipants);

    return res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get chats for the authenticated user only — with Redis cache
export const getAllChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cacheKey = `${CHAT_CACHE_PREFIX}${userId}`;

    // Try Redis cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      // Redis down — fall through to DB
    }

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email profilePic status lastSeen")
      .populate("lastMessage", "content senderId createdAt edited messageType")
      .sort({ updatedAt: -1 });

    // Cache in Redis
    try {
      await redis.setex(cacheKey, CHAT_LIST_TTL, JSON.stringify(chats));
    } catch (err) {
      // ignore cache write failure
    }

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a chat by ID
export const getChatById = asyncHandler(async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate(
      "participants",
      "name email",
    );
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat — only a participant can delete it
export const deleteChat = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    const chat = await Chat.findById(req.params.id).select("participants");
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isParticipant = chat.participants
      .map(String)
      .includes(String(userId));
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this chat" });
    }

    // Invalidate cache for all participants before deleting
    await invalidateChatListCache(chat.participants.map(String));

    await Chat.findByIdAndDelete(req.params.id);
    // Cascade: remove all messages in this chat
    await Message.deleteMany({ chatId: req.params.id });

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark chat as read for a user (resets unread counter)
export const markChatRead = asyncHandler(async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid userId is required" });
    }

    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isParticipant = chat.participants
      .map(String)
      .includes(String(userId));
    if (!isParticipant) {
      return res.status(403).json({ error: "User not part of the chat" });
    }

    await Chat.updateOne(
      { _id: chatId },
      { $set: { [`unreadMessages.${String(userId)}`]: 0 } },
    );

    // Best-effort: mark messages as read by this user
    await Message.updateMany(
      { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId }, $set: { status: "seen" } },
    );

    // Optional realtime hint
    global.io?.to(chatId)?.emit?.("unread-updated", {
      chatId,
      userId,
      unread: 0,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// @desc Check chat history or create new chat
export const getOrCreateChat = asyncHandler(async (req, res) => {
  try {
    const { currentUserId, searchedUserId } = req.body;
    if (!currentUserId || !searchedUserId) {
      return res
        .status(400)
        .json({ error: "Missing currentUserId or searchedUserId" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(currentUserId) ||
      !mongoose.Types.ObjectId.isValid(searchedUserId)
    ) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    // Find existing chat (for one-to-one chats only)
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, searchedUserId] },
    });

    // If chat doesn't exist, create a new one
    if (!chat) {
      chat = await Chat.create({
        participants: [currentUserId, searchedUserId],
        isGroup: false,
        unreadMessages: {
          [String(currentUserId)]: 0,
          [String(searchedUserId)]: 0,
        },
      });

      await User.updateMany(
        { _id: { $in: [currentUserId, searchedUserId] } },
        { $addToSet: { chats: chat._id } },
      );

      await logActivity({
        req,
        action: "chat.create",
        entityType: "Chat",
        entityId: chat._id,
        metadata: {
          isGroup: false,
          participants: [currentUserId, searchedUserId],
        },
      });
    }

    // Optionally, fetch messages for this chat
    const messages = await Message.find({ chatId: chat._id }).sort({
      createdAt: 1,
    });

    res.status(200).json({ chat, messages });
  } catch (error) {
    logger.error("Error in getOrCreateChat:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});
