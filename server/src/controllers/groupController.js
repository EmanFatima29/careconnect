import { asyncHandler } from "../middleware/errorHandler.js";
import { isAdminRoles } from "../middleware/auth.js";
import logger from "../../lib/logger.js";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import { sendPushNotification, sendPushToMany } from "../services/pushService.js";

// ── Helper: check if user is group admin or platform admin ──
function isGroupOrPlatformAdmin(group, userId, userRoles) {
  if (isAdminRoles(userRoles)) return true;
  return (
    group.admins.map(String).includes(String(userId)) ||
    String(group.createdBy) === String(userId)
  );
}

// Create a new group
export const createGroup = asyncHandler(async (req, res) => {
  const { userId, groupName, name, description, members } = req.body;
  const creatorId = userId || req.user.userId;
  const gName = groupName || name;

  if (!gName?.trim()) {
    return res.status(400).json({ error: "Group name is required" });
  }

  try {
    const memberSet = [...new Set([...(members || []), creatorId])];

    const group = await Group.create({
      name: gName.trim(),
      bio: description || "",
      members: memberSet,
      createdBy: creatorId,
      admins: [creatorId],
    });

    await User.updateMany(
      { _id: { $in: memberSet } },
      { $addToSet: { groups: group._id } },
    );

    // Push notify added members (excluding creator)
    const otherMembers = memberSet.filter((id) => String(id) !== String(creatorId));
    if (otherMembers.length > 0) {
      sendPushToMany(
        otherMembers,
        {
          title: "New Group",
          body: `You were added to "${group.name}"`,
          url: "/groups",
          tag: `group-${group._id}`,
        },
        "group",
      ).catch((err) => logger.error("[Push] group create error:", err));
    }

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get Group by ID (populated)
export const getGroupById = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "name email profilePic status")
      .populate("admins", "name email profilePic")
      .populate("createdBy", "name email");
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Group by Name
export const getGroupByName = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findOne({ name: req.params.name })
      .populate("members", "name email profilePic status");
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL GROUPS — filtered by membership (platform admins see all)
export const getAllGroups = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRoles = req.user.roles;
    let query = {};

    if (!isAdminRoles(userRoles)) {
      query = { members: userId };
    }

    const groups = await Group.find(query)
      .populate("members", "name email profilePic status")
      .populate("admins", "name email")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update group — group admin or platform admin only
export const updateGroup = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isGroupOrPlatformAdmin(group, req.user.userId, req.user.roles)) {
      return res.status(403).json({ error: "Only group admins can update this group" });
    }

    const { name, description, bio, pic } = req.body;
    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.bio = description;
    if (bio !== undefined) group.bio = bio;
    if (pic !== undefined) group.pic = pic;

    await group.save();

    const updated = await Group.findById(group._id)
      .populate("members", "name email profilePic status")
      .populate("admins", "name email")
      .populate("createdBy", "name email");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete group — group admin or platform admin only
export const deleteGroup = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isGroupOrPlatformAdmin(group, req.user.userId, req.user.roles)) {
      return res.status(403).json({ error: "Only group admins can delete this group" });
    }

    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { groups: group._id } },
    );

    await Group.findByIdAndDelete(group._id);
    res.status(200).json({ message: "Group deleted", groupId: group._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member — group admin or platform admin only
export const addMember = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isGroupOrPlatformAdmin(group, req.user.userId, req.user.roles)) {
      return res.status(403).json({ error: "Only group admins can add members" });
    }

    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: "memberId is required" });

    if (group.members.map(String).includes(String(memberId))) {
      return res.status(400).json({ error: "User is already a member" });
    }

    group.members.push(memberId);
    await group.save();
    await User.findByIdAndUpdate(memberId, { $addToSet: { groups: group._id } });

    sendPushNotification(
      memberId,
      {
        title: "Group Invitation",
        body: `You were added to "${group.name}"`,
        url: "/groups",
        tag: `group-${group._id}`,
      },
      "group",
    ).catch((err) => logger.error("[Push] addMember error:", err));

    res.status(200).json({ message: "Member added", groupId: group._id, memberId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member — group admin or platform admin only
export const removeMember = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isGroupOrPlatformAdmin(group, req.user.userId, req.user.roles)) {
      return res.status(403).json({ error: "Only group admins can remove members" });
    }

    const { memberId } = req.params;

    group.members = group.members.filter((m) => String(m) !== String(memberId));
    group.admins = group.admins.filter((a) => String(a) !== String(memberId));
    await group.save();
    await User.findByIdAndUpdate(memberId, { $pull: { groups: group._id } });

    sendPushNotification(
      memberId,
      {
        title: "Removed from Group",
        body: `You were removed from "${group.name}"`,
        url: "/groups",
        tag: `group-removed-${group._id}`,
      },
      "group",
    ).catch((err) => logger.error("[Push] removeMember error:", err));

    res.status(200).json({ message: "Member removed", groupId: group._id, memberId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exit Group — any member can leave
export const leaveGroup = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.user.userId;
  const { groupId } = req.body;

  if (!groupId) return res.status(400).json({ error: "groupId is required" });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.members.map(String).includes(String(userId))) {
      return res.status(400).json({ error: "You are not a member of this group" });
    }

    group.members = group.members.filter((m) => String(m) !== String(userId));
    group.admins = group.admins.filter((a) => String(a) !== String(userId));
    await group.save();
    await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });

    res.status(200).json({ message: "Left group successfully", groupId });
  } catch (err) {
    res.status(500).json({ error: "Failed to exit group" });
  }
});

// Add Group to Chat History
export const addGroupToHistory = asyncHandler(async (req, res) => {
  const { userId, groupId } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { $addToSet: { groups: groupId } });
    res.status(200).json({ message: "Group added to chat history" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add group" });
  }
});
