import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import logger from "../../lib/logger.js";
import { logActivity } from "../services/activityLogService.js";
import { sendPushNotification } from "../services/pushService.js";

/**
 * POST /api/friends/request
 * Send a friend request to another user.
 */
export const sendFriendRequest = asyncHandler(async (req, res) => {
  const senderId = req.user?.userId;
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ error: "recipientId is required" });
  }
  if (senderId === recipientId) {
    return res.status(400).json({ error: "Cannot send a request to yourself" });
  }
  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ error: "Invalid recipientId" });
  }

  const [sender, recipient] = await Promise.all([
    User.findById(senderId),
    User.findById(recipientId),
  ]);

  if (!sender || !recipient) {
    return res.status(404).json({ error: "User not found" });
  }

  // Already friends?
  if (sender.friends.map(String).includes(recipientId)) {
    return res.status(409).json({ error: "Already friends" });
  }

  // Already has a pending request from this sender?
  const existing = recipient.friendRequests.find(
    (r) => String(r.sender) === senderId && r.status === "pending",
  );
  if (existing) {
    return res.status(409).json({ error: "Friend request already sent" });
  }

  recipient.friendRequests.push({ sender: senderId, status: "pending" });
  await recipient.save();

  await logActivity({
    req,
    action: "friend.request_sent",
    entityType: "User",
    entityId: recipient._id,
    metadata: { senderId, recipientId },
  });

  // Real-time notification via Socket.IO
  if (global.io) {
    global.io.to(recipientId).emit("friendRequest", {
      type: "incoming",
      from: {
        _id: sender._id,
        name: sender.name,
        profilePic: sender.profilePic,
      },
    });
  }

  logger.log("[Friends] Request sent:", senderId, "→", recipientId);

  // Push notification
  sendPushNotification(recipientId, {
    title: "New Friend Request",
    body: `${sender.name} wants to be your friend`,
    url: "/home",
    tag: `friend-request-${senderId}`,
  }).catch((err) => logger.error("[Push] Friend request push error:", err));

  return res.status(200).json({ message: "Friend request sent" });
});

/**
 * POST /api/friends/accept
 * Accept a pending friend request.
 */
export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { senderId } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: "senderId is required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const requestIndex = user.friendRequests.findIndex(
    (r) => String(r.sender) === senderId && r.status === "pending",
  );

  if (requestIndex === -1) {
    return res.status(404).json({ error: "No pending request from this user" });
  }

  // Mark request as accepted
  user.friendRequests[requestIndex].status = "accepted";

  // Add each other as friends (if not already)
  if (!user.friends.map(String).includes(senderId)) {
    user.friends.push(senderId);
  }
  await user.save();

  // Add to sender's friend list too
  await User.findByIdAndUpdate(senderId, {
    $addToSet: { friends: userId },
  });

  await logActivity({
    req,
    action: "friend.request_accepted",
    entityType: "User",
    entityId: user._id,
    metadata: { senderId, acceptedBy: userId },
  });

  // Real-time notification
  if (global.io) {
    global.io.to(senderId).emit("friendRequest", {
      type: "accepted",
      by: { _id: user._id, name: user.name, profilePic: user.profilePic },
    });
  }

  logger.log("[Friends] Request accepted:", senderId, "←", userId);
  return res.status(200).json({ message: "Friend request accepted" });
});

/**
 * POST /api/friends/decline
 * Decline a pending friend request.
 */
export const declineFriendRequest = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { senderId } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: "senderId is required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const requestIndex = user.friendRequests.findIndex(
    (r) => String(r.sender) === senderId && r.status === "pending",
  );

  if (requestIndex === -1) {
    return res.status(404).json({ error: "No pending request from this user" });
  }

  user.friendRequests[requestIndex].status = "declined";
  await user.save();

  logger.log("[Friends] Request declined:", senderId, "←", userId);
  return res.status(200).json({ message: "Friend request declined" });
});

/**
 * GET /api/friends
 * Get current user's friend list (populated).
 */
export const getFriends = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  const user = await User.findById(userId)
    .populate("friends", "name email profilePic status lastSeen")
    .lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({ friends: user.friends || [] });
});

/**
 * GET /api/friends/requests
 * Get pending friend requests for the current user (populated).
 */
export const getFriendRequests = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  const user = await User.findById(userId)
    .populate("friendRequests.sender", "name email profilePic status")
    .lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const pending = (user.friendRequests || []).filter(
    (r) => r.status === "pending",
  );

  return res.status(200).json({ requests: pending });
});

/**
 * DELETE /api/friends/:friendId
 * Remove a friend from both users' lists.
 */
export const removeFriend = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { friendId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ error: "Invalid friendId" });
  }

  await Promise.all([
    User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
    User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
  ]);

  logger.log("[Friends] Removed:", userId, "↔", friendId);
  return res.status(200).json({ message: "Friend removed" });
});
