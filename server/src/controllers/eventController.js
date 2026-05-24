import { asyncHandler } from "../middleware/errorHandler.js";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";

/**
 * GET /api/events?month=3&year=2026
 * Returns personal events + group events the user can see.
 */
export const getEvents = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  // Build date range for the requested month (or default to current month)
  const m = month != null ? parseInt(month) : new Date().getMonth();
  const y = year != null ? parseInt(year) : new Date().getFullYear();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

  // Find groups where user is a member
  const userGroups = await Group.find({ members: userId }, "_id").lean();
  const groupIds = userGroups.map((g) => g._id);

  // Fetch personal events + group events the user belongs to
  const events = await Event.find({
    date: { $gte: start, $lte: end },
    $or: [
      { creatorId: userId },
      { groupId: { $in: groupIds } },
    ],
  })
    .populate("creatorId", "name email profilePic")
    .populate("groupId", "name")
    .sort({ date: 1, time: 1 })
    .lean();

  res.json({ success: true, events });
});

/**
 * POST /api/events
 * Create personal or group event.
 */
export const createEvent = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { title, description, date, time, duration, type, color, groupId } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!date) return res.status(400).json({ error: "Date is required" });

  // If group event, verify user is group admin
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isGroupAdmin =
      group.admins.map(String).includes(String(userId)) ||
      String(group.createdBy) === String(userId);

    if (!isGroupAdmin) {
      return res.status(403).json({ error: "Only group admins can create group events" });
    }
  }

  const event = await Event.create({
    title: title.trim(),
    description: description || "",
    date: new Date(date),
    time: time || "",
    duration: duration || "",
    type: type || "task",
    color: color || "#2e7d32",
    creatorId: userId,
    groupId: groupId || null,
  });

  const populated = await Event.findById(event._id)
    .populate("creatorId", "name email profilePic")
    .populate("groupId", "name");

  res.status(201).json({ success: true, event: populated });
});

/**
 * PATCH /api/events/:id
 * Update an event — only creator can edit.
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const event = await Event.findById(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });
  if (String(event.creatorId) !== String(userId)) {
    return res.status(403).json({ error: "Only the creator can edit this event" });
  }

  const { title, description, date, time, duration, type, color, completed, groupId } = req.body;
  if (title !== undefined) event.title = title.trim();
  if (description !== undefined) event.description = description;
  if (date !== undefined) event.date = new Date(date);
  if (time !== undefined) event.time = time;
  if (duration !== undefined) event.duration = duration;
  if (type !== undefined) event.type = type;
  if (color !== undefined) event.color = color;
  if (completed !== undefined) event.completed = completed;

  // Changing group assignment — verify admin
  if (groupId !== undefined) {
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });
      const isGroupAdmin =
        group.admins.map(String).includes(String(userId)) ||
        String(group.createdBy) === String(userId);
      if (!isGroupAdmin) {
        return res.status(403).json({ error: "Only group admins can assign events to groups" });
      }
    }
    event.groupId = groupId || null;
  }

  await event.save();

  const populated = await Event.findById(event._id)
    .populate("creatorId", "name email profilePic")
    .populate("groupId", "name");

  res.json({ success: true, event: populated });
});

/**
 * DELETE /api/events/:id
 * Delete an event — only creator can delete.
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const event = await Event.findById(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });
  if (String(event.creatorId) !== String(userId)) {
    return res.status(403).json({ error: "Only the creator can delete this event" });
  }

  await Event.findByIdAndDelete(event._id);
  res.json({ success: true, eventId: event._id });
});

/**
 * PATCH /api/events/:id/toggle
 * Quick toggle completed status.
 */
export const toggleEvent = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const event = await Event.findById(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });
  if (String(event.creatorId) !== String(userId)) {
    return res.status(403).json({ error: "Only the creator can update this event" });
  }

  event.completed = !event.completed;
  await event.save();

  res.json({ success: true, event });
});
