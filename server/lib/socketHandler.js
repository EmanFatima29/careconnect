import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../src/models/userModel.js";
import Group from "../src/models/groupModel.js";
import Chat from "../src/models/chatModel.js";
import Message from "../src/models/messageModel.js";
import logger from "./logger.js";

let _io; // Store the io instance for emitToUser

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId, event, data) => {
  if (_io) {
    _io.to(`user_${userId}`).emit(event, data);
  }
};

/**
 * Broadcast event to a room
 */
export const broadcastToRoom = (roomId, event, data) => {
  if (_io) {
    _io.to(roomId).emit(event, data);
  }
};

/**
 * Main socket handler
 */
export function handleSocket(io) {
  _io = io;

  // ---- Socket.IO authentication middleware ----
  io.use((socket, next) => {
    try {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) return next(new Error("Server auth misconfigured"));

      // Accept token from socket.handshake.auth.token (preferred) or query (legacy)
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.userId || decoded.sub || null;
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    socket.broadcast.emit("user-online", userId);
    logger.log(`[Socket] User connected: ${socket.id}`);
    logger.log("[Socket] User ID:", userId);

    socket.join(`user_${userId}`);
    logger.log(`[Socket] Socket joined room user_${userId}`);

    // Update user status to online
    try {
      await User.findByIdAndUpdate(userId, {
        status: "online",
        lastSeen: new Date(),
      });
    } catch (error) {
      logger.error("[Socket] Error updating user status:", error);
    }

    // ============ USER MANAGEMENT ============
    // Use socket.userId (JWT-verified) exclusively — never trust client payload
    socket.on("manual-disconnect", async () => {
      try {
        const lastSeen = new Date();

        // Update DB using trusted userId from JWT
        await User.findByIdAndUpdate(userId, { status: "offline", lastSeen });

        // Notify others
        socket.broadcast.emit("user-offline", { userId, lastSeen });

        logger.log(
          `[Socket] User ${userId} manually disconnected at ${lastSeen}`,
        );
      } catch (error) {
        logger.error("[Socket] Manual disconnect failed:", error);
      }
    });

    // ============ ROOM MANAGEMENT ============
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      logger.log(`[Socket] User ${socket.id} joined room: ${roomId}`);
      io.to(roomId).emit("userJoined", { userId, roomId });
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      logger.log(`[Socket] User ${socket.id} left room: ${roomId}`);
      io.to(roomId).emit("userLeft", { userId, roomId });
    });

    // ============ MESSAGE HANDLING ============
    socket.on("sendMessage", async (messageData) => {
      try {
        logger.log("[Socket] Message received:", messageData);
        const {
          chatId,
          content,
          senderId,
          receiverIds,
          messageType,
          replyTo,
        } = messageData;

        if (!chatId || !content || !senderId) {
          socket.emit("message:error", {
            error: "Missing required message fields",
          });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          socket.emit("message:error", { error: "Invalid chatId" });
          return;
        }
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
          socket.emit("message:error", { error: "Invalid senderId" });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("message:error", { error: "Chat not found" });
          return;
        }

        const trustedSenderId = String(senderId);
        const participants = (chat.participants || []).map(String);
        if (!participants.includes(trustedSenderId)) {
          socket.emit("message:error", {
            error: "Sender not part of the chat",
          });
          return;
        }

        const recipients = participants.filter((id) => id !== trustedSenderId);
        let parsedReceiverIds = receiverIds;
        if (typeof receiverIds === "string") {
          try {
            parsedReceiverIds = JSON.parse(receiverIds);
          } catch {
            parsedReceiverIds = recipients;
          }
        }
        if (!Array.isArray(parsedReceiverIds)) {
          parsedReceiverIds = recipients;
        }

        const normalizedType = (messageType || "text").toLowerCase();
        const normalizedContent = typeof content === "string" ? content.trim() : "";
        if (normalizedType === "text" && !normalizedContent) {
          socket.emit("message:error", {
            error: "Message content is required",
          });
          return;
        }

        const message = await Message.create({
          chatId,
          senderId: trustedSenderId,
          receiverIds: parsedReceiverIds,
          content: normalizedContent,
          messageType: normalizedType,
          status: "sent",
          replyTo: replyTo || null,
        });

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

        const messagePayload = {
          _id: message._id,
          chatId: message.chatId,
          senderId: message.senderId,
          receiverIds: message.receiverIds,
          content: message.content,
          messageType: message.messageType,
          status: message.status,
          replyTo: message.replyTo,
          createdAt: message.createdAt,
        };

        io.to(chatId).emit("receiveMessage", messagePayload);
        logger.log(`[Socket] Message persisted and broadcasted to room ${chatId}`);
      } catch (error) {
        logger.error("[Socket] Error sending message:", error);
        socket.emit("message:error", {
          error: "Failed to send message",
          details: error.message,
        });
      }
    });

    // ============ TYPING INDICATORS ============
    socket.on("Typing", ({ chatId, senderId }) => {
      logger.log(`[Socket] User ${senderId} typing in ${chatId}`);
      socket.to(chatId).emit("typing", { chatId, senderId });
    });

    socket.on("Stop-typing", ({ chatId, senderId }) => {
      logger.log(`[Socket] User ${senderId} stopped typing in ${chatId}`);
      socket.to(chatId).emit("stop-typing", { chatId, senderId });
    });

    // ============ LOCATION SHARING ============
    let locationInterval;

    socket.on("subscribe-to-nearby", async (_incomingUserId, radius = 1000) => {
      try {
        // Always use JWT-verified userId
        const trustedUserId = socket.userId;
        logger.log(
          `[Socket] Subscribed to nearby users for ${trustedUserId} within ${radius}m`,
        );

        const fetchNearby = async () => {
          // Fetch the user's current coordinates from DB (authoritative source)
          const self = await User.findById(trustedUserId).select("location");
          const coords = self?.location?.coordinates;
          if (!coords || (coords[0] === 0 && coords[1] === 0)) return [];

          return User.find({
            _id: { $ne: trustedUserId },
            "settings.locationSharing": true,
            "location.coordinates": {
              $near: {
                $geometry: { type: "Point", coordinates: coords },
                $maxDistance: radius,
              },
            },
          }).select("_id name email location status profilePic");
        };

        // Initial fetch
        const nearbyUsers = await fetchNearby();
        socket.emit("nearby-users-update", nearbyUsers || []);

        // Clear any existing interval before setting a new one
        if (locationInterval) clearInterval(locationInterval);

        // Set up periodic updates (every 30 seconds)
        locationInterval = setInterval(async () => {
          try {
            const updatedUsers = await fetchNearby();
            socket.emit("nearby-users-update", updatedUsers || []);
          } catch (error) {
            logger.error("[Socket] Error fetching nearby users:", error);
          }
        }, 30000);
      } catch (error) {
        logger.error("[Socket] Error subscribing to nearby users:", error);
        socket.emit("nearby-users-error", error.message);
      }
    });

    socket.on("unsubscribe-from-nearby", () => {
      if (locationInterval) {
        clearInterval(locationInterval);
        locationInterval = null;
        logger.log("[Socket] Unsubscribed from nearby users");
      }
    });

    // ============ LOCATION UPDATE ============
    socket.on("location-update", async (locationData) => {
      try {
        // Always use JWT-verified userId — never trust client payload
        const trustedUserId = socket.userId;
        const { latitude, longitude } = locationData;
        logger.log(
          `[Socket] Location update for ${trustedUserId}: ${latitude}, ${longitude}`,
        );

        if (!trustedUserId) return;

        // Update user location in DB
        await User.findByIdAndUpdate(trustedUserId, {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          lastLocationUpdate: new Date(),
        });

        // FIX: Only broadcast to nearby subscribers, NOT all users
        // Query nearby users who are sharing location and emit only to them
        try {
          const nearbySubscribers = await User.find({
            _id: { $ne: trustedUserId },
            "settings.locationSharing": true,
            "location.coordinates": {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                $maxDistance: 10000, // 10km max broadcast radius
              },
            },
          }).select("_id");

          nearbySubscribers.forEach((sub) => {
            io.to(`user_${sub._id}`).emit("user-location-updated", {
              userId: trustedUserId,
              latitude,
              longitude,
              timestamp: new Date(),
            });
          });
        } catch (queryErr) {
          // If geo query fails (e.g., no 2dsphere index), log but don't crash
          logger.error(
            "[Socket] Error querying nearby for broadcast:",
            queryErr.message,
          );
        }
      } catch (error) {
        logger.error("[Socket] Error updating location:", error);
        socket.emit("location:error", {
          error: "Failed to update location",
          details: error.message,
        });
      }
    });

    // ============ GROUP MANAGEMENT ============
    socket.on("group:create", async (groupData) => {
      try {
        // Always use JWT-verified userId
        const trustedUserId = socket.userId;
        if (!trustedUserId) {
          return socket.emit("group:error", {
            error: "Authentication required",
          });
        }
        logger.log("[Socket] Creating group:", groupData);
        const { name, members } = groupData;

        const newGroup = new Group({
          name,
          members,
          createdBy: trustedUserId,
        });

        await newGroup.save();

        // Notify all group members
        members.forEach((memberId) => {
          if (String(memberId) !== String(trustedUserId)) {
            io.to(`user_${memberId}`).emit("group:created", {
              group: newGroup,
              createdBy: trustedUserId,
            });
          }
        });

        socket.emit("group:created", { group: newGroup, success: true });
        logger.log(`[Socket] Group created: ${newGroup._id}`);
      } catch (error) {
        logger.error("[Socket] Error creating group:", error);
        socket.emit("group:error", {
          error: "Failed to create group",
          details: error.message,
        });
      }
    });

    socket.on("group:update", async (groupData) => {
      try {
        // Always use JWT-verified userId
        const trustedUserId = socket.userId;
        const { groupId, updates } = groupData;
        logger.log(`[Socket] Updating group ${groupId}:`, updates);

        // Verify requester is a group admin
        const group = await Group.findById(groupId).select(
          "admins createdBy members",
        );
        if (!group) {
          return socket.emit("group:error", { error: "Group not found" });
        }
        const isAllowed =
          String(group.createdBy) === String(trustedUserId) ||
          (group.admins || []).map(String).includes(String(trustedUserId));
        if (!isAllowed) {
          return socket.emit("group:error", {
            error: "Not authorized to update this group",
          });
        }

        const updatedGroup = await Group.findByIdAndUpdate(groupId, updates, {
          new: true,
        });

        // Notify all group members
        updatedGroup.members.forEach((memberId) => {
          io.to(`user_${memberId}`).emit("group:updated", {
            group: updatedGroup,
            updatedBy: trustedUserId,
          });
        });

        socket.emit("group:updated", { group: updatedGroup, success: true });
        logger.log(`[Socket] Group updated: ${groupId}`);
      } catch (error) {
        logger.error("[Socket] Error updating group:", error);
        socket.emit("group:error", {
          error: "Failed to update group",
          details: error.message,
        });
      }
    });

    // ============ DISCONNECT ============
    socket.on("disconnect", async () => {
      if (locationInterval) {
        clearInterval(locationInterval);
        locationInterval = null;
      }

      logger.log(`[Socket] User disconnected: ${socket.id}`);

      // Update user status in DB
      if (userId) {
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, {
            status: "offline",
            lastSeen,
          });
          socket.broadcast.emit("user-offline", { userId, lastSeen });
          logger.log(`[Socket] User ${userId} set offline at ${lastSeen}`);
        } catch (err) {
          logger.error(
            "[Socket] Error updating user status on disconnect:",
            err,
          );
        }
      }
    });
  });
}
