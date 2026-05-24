import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
// src/controllers/messageController.js
import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import mongoose from "mongoose";
import { logActivity } from "../services/activityLogService.js";
import { sendPushToMany } from "../services/pushService.js";
import { processAndSaveMedia, getMediaType } from "../services/mediaService.js";
import redis from "../../lib/redis.js";
import { analyzeSentiment } from "../services/sentimentService.js";

/**
 * GET /api/messages/sentiment/:userId
 * Get overall sentiment for a user based on ALL their messages.
 * Cached in Redis for 10 minutes.
 */
export const getUserSentiment = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId required" });

  // Permission check: admins always see sentiment; regular users only if target has showSentiment enabled
  const callerRole = req.user?.roles;
  const isAdmin = callerRole === "admin" || callerRole === "superadmin";
  if (!isAdmin) {
    const targetUser = await (await import("../models/userModel.js")).default
      .findById(userId)
      .select("settings.showSentiment")
      .lean();
    if (!targetUser?.settings?.showSentiment) {
      return res.json({ score: 0, label: "neutral", messageCount: 0, restricted: true });
    }
  }

  const cacheKey = `sentiment:user:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch {}

  // Get last 100 text messages from this user
  const messages = await Message.find({
    senderId: userId,
    messageType: "text",
    content: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("content")
    .lean();

  if (messages.length === 0) {
    const result = { score: 0, label: "neutral", messageCount: 0 };
    try { await redis.setex(cacheKey, 600, JSON.stringify(result)); } catch {}
    return res.json(result);
  }

  // Analyze all messages and average the scores
  const texts = messages.map((m) => m.content).filter(Boolean);
  let totalScore = 0;
  let analyzed = 0;

  // Batch analyze for efficiency
  for (const text of texts) {
    const result = await analyzeSentiment(text);
    if (result) {
      totalScore += result.score;
      analyzed++;
    }
  }

  const avgScore = analyzed > 0 ? totalScore / analyzed : 0;
  const label = avgScore > 0.1 ? "positive" : avgScore < -0.1 ? "negative" : "neutral";

  const sentiment = { score: Math.round(avgScore * 100) / 100, label, messageCount: analyzed };
  try { await redis.setex(cacheKey, 600, JSON.stringify(sentiment)); } catch {}

  res.json(sentiment);
});

/**
 * GET /api/messages/sentiment/:userId/chat/:chatId
 * Get sentiment for a user in a specific chat (last 50 messages).
 * Cached in Redis for 5 minutes.
 */
export const getChatSentiment = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.params;
  if (!userId || !chatId) return res.status(400).json({ error: "userId and chatId required" });

  const cacheKey = `sentiment:chat:${chatId}:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch {}

  const messages = await Message.find({
    chatId,
    senderId: userId,
    messageType: "text",
    content: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("content")
    .lean();

  if (messages.length === 0) {
    const result = { score: 0, label: "neutral", messageCount: 0 };
    try { await redis.setex(cacheKey, 300, JSON.stringify(result)); } catch {}
    return res.json(result);
  }

  const texts = messages.map((m) => m.content).filter(Boolean);
  let totalScore = 0;
  let analyzed = 0;

  for (const text of texts) {
    const result = await analyzeSentiment(text);
    if (result) {
      totalScore += result.score;
      analyzed++;
    }
  }

  const avgScore = analyzed > 0 ? totalScore / analyzed : 0;
  const label = avgScore > 0.1 ? "positive" : avgScore < -0.1 ? "negative" : "neutral";

  const sentiment = { score: Math.round(avgScore * 100) / 100, label, messageCount: analyzed };
  try { await redis.setex(cacheKey, 300, JSON.stringify(sentiment)); } catch {}

  res.json(sentiment);
});

// Create a new message
export const createMessage = asyncHandler(async (req, res) => {
  const {
    chatId,
    content,
    senderId,
    receiverIds,
    messageType,
    fileUrl,
    replyTo,
  } = req.body;

  try {
    if (!chatId || !senderId) {
      return res.status(400).json({ error: "Missing required wards" });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: "Invalid senderId" });
    }

    // Use uploaded file URL from Cloudinary if present, otherwise fall back to body
    const uploadedFileUrl = req.file?.path || "";
    let mediaData = null;

    // Process file upload with responsive variants if file present
    if (req.file) {
      try {
        const mediaResult = await processAndSaveMedia({
          file: req.file,
          userId: senderId,
          context: "chat",
          relatedTo: { model: "Chat", id: chatId },
        });

        mediaData = {
          mediaId: mediaResult._id,
          cloudinaryId: mediaResult.cloudinaryId,
          mediaType: mediaResult.mediaType,
          originalName: mediaResult.originalName,
          mimeType: mediaResult.mimeType,
          size: mediaResult.size,
          urls: mediaResult.urls,
          duration: mediaResult.duration,
          dimensions: mediaResult.dimensions,
        };
      } catch (uploadError) {
        logger.error("Message media upload failed:", uploadError);
        // Continue without media if upload fails
      }
    }

    const normalizedType = (
      messageType ||
      (uploadedFileUrl || mediaData
        ? getMediaType(req.file?.mimetype || "") || "file"
        : "text")
    ).toLowerCase();
    const normalizedContent = typeof content === "string" ? content.trim() : "";
    const normalizedFileUrl =
      uploadedFileUrl || (typeof fileUrl === "string" ? fileUrl.trim() : "");

    // Require content for text messages; allow fileUrl-only for non-text
    if (normalizedType === "text" && !normalizedContent) {
      return res.status(400).json({ error: "Message content is required" });
    }
    if (normalizedType !== "text" && !normalizedContent && !normalizedFileUrl) {
      return res.status(400).json({
        error: "content or fileUrl is required for non-text messages",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const senderInChat = chat.participants
      .map(String)
      .includes(String(senderId));
    if (!senderInChat) {
      return res.status(403).json({ error: "Sender not part of the chat" });
    }

    const recipients = chat.participants
      .map(String)
      .filter((id) => id !== String(senderId));

    // Parse receiverIds (may come as JSON string from FormData)
    let parsedReceiverIds = receiverIds;
    if (typeof receiverIds === "string") {
      try {
        parsedReceiverIds = JSON.parse(receiverIds);
      } catch {
        parsedReceiverIds = [];
      }
    }

    // Validate replyTo belongs to the same chat
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo)
        .select("chatId")
        .lean();
      if (!replyMessage || String(replyMessage.chatId) !== String(chatId)) {
        return res
          .status(400)
          .json({ error: "Reply-to message not found in this chat" });
      }
    }

    const messageData = {
      chatId,
      senderId,
      receiverIds: Array.isArray(parsedReceiverIds)
        ? parsedReceiverIds
        : recipients,
      content: normalizedContent,
      messageType: normalizedType,
      fileUrl: normalizedFileUrl, // Keep for backwards compatibility
      media: mediaData, // New media object with responsive variants
      status: "sent",
      replyTo: replyTo || null,
    };

    const message = await Message.create(messageData);

    await logActivity({
      req,
      action: "message.create",
      entityType: "Message",
      entityId: message._id,
      metadata: { chatId, senderId, messageType: normalizedType },
    });

    // Update chat pointers and unread counts atomically
    const inc = {};
    for (const recipientId of recipients) {
      inc[`unreadMessages.${recipientId}`] = 1;
    }

    await Chat.updateOne(
      { _id: chatId },
      {
        $set: { lastMessage: message._id },
        $addToSet: { messages: message._id },
        ...(recipients.length ? { $inc: inc } : {}),
      },
    );

    // Invalidate chat list cache for all participants (lastMessage changed)
    try {
      const keys = chat.participants.map((id) => `cache:chats:${id}`);
      if (keys.length) await redis.del(...keys);
    } catch (err) {
      // ignore cache invalidation failure
    }

    logger.log("Message creating in controller:", message);
    // Emit message to all users in the chat room
    global.io.to(chatId).emit("receiveMessage", {
      _id: message._id,
      chatId: message.chatId,
      senderId: message.senderId,
      receiverIds: message.receiverIds,
      content: message.content, // Ensure content exists
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      media: message.media, // Include media with responsive URLs
      status: message.status,
      replyTo: message.replyTo,
      createdAt: message.createdAt,
    });

    // Send push notifications to offline recipients
    if (recipients.length > 0) {
      const sender = await import("../models/userModel.js").then((m) =>
        m.default.findById(senderId).select("name").lean(),
      );
      const senderName = sender?.name || "Someone";
      const pushBody =
        normalizedType === "text"
          ? normalizedContent.slice(0, 100)
          : `Sent ${normalizedType === "image" ? "an image" : normalizedType === "video" ? "a video" : "a file"}`;

      sendPushToMany(recipients, {
        title: `New message from ${senderName}`,
        body: pushBody,
        url: "/home",
        tag: `chat-${chatId}`,
      }).catch((err) => logger.error("[Push] Error sending push:", err));
    }
    //FOR GROUP CHAT
    // if (receiverIds.length > 1) {
    //   // Group chat: send to all in the chat room (including sender)
    //   global.io.to(chatId).emit("receiveMessage", message);
    // } else {
    //   // One-on-one chat: send to the receiver AND sender
    //   receiverIds.forEach((receiverId) => {
    //     global.io.to(receiverId).emit("receiveMessage", message);
    //   });
    //   global.io.to(senderId).emit("receiveMessage", message); // Send to sender as well
    // }

    res.status(201).json(message);
  } catch (error) {
    logger.error("Error creating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get messages by chat ID — requester must be a chat participant
export const getMessagesByChat = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }

    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isParticipant = chat.participants
      .map(String)
      .includes(String(userId));
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these messages" });
    }

    // Cursor-based pagination: ?limit=50&before=<message_id>
    // Incremental sync:       ?since=<ISO timestamp> — only fetch newer messages
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before; // cursor: last known message _id
    const since = req.query.since; // incremental sync timestamp

    const filter = { chatId };

    if (since) {
      // Incremental sync — fetch only messages created after `since`
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        filter.createdAt = { $gt: sinceDate };
      }
    } else if (before && mongoose.Types.ObjectId.isValid(before)) {
      const cursor = await Message.findById(before).select("createdAt").lean();
      if (cursor) filter.createdAt = { $lt: cursor.createdAt };
    }

    const messages = await Message.find(filter)
      .populate("senderId", "name email profilePic")
      .populate("receiverIds", "name email")
      .sort({ createdAt: since ? 1 : -1 }) // ascending for sync, desc for pagination
      .limit(limit)
      .lean();

    // Return in ascending order so UI renders oldest→newest
    const ordered = since ? messages : messages.reverse();
    res
      .status(200)
      .json({ messages: ordered, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a message — only the sender can edit it
export const editMessage = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (String(message.senderId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this message" });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    // Broadcast the edit so open chat rooms see the update immediately
    if (global.io) {
      global.io.to(String(message.chatId)).emit("message-edited", {
        messageId: message._id,
        content: message.content,
        editedAt: message.editedAt,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a message — only the sender can delete it (soft-delete via deletedFor)
export const deleteMessage = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (String(message.senderId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    // Soft-delete: mark as deleted for the sender
    await Message.findByIdAndUpdate(req.params.id, {
      $addToSet: { deletedFor: userId },
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
