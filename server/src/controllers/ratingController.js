import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import Rating from "../models/ratingModel.js";
import User from "../models/userModel.js";
import { logActivity } from "../services/activityLogService.js";
import logger from "../../lib/logger.js";

const isAdminRole = (role) => role === "admin" || role === "superadmin";

async function recalculateSummary(ratedUserId) {
  const [agg] = await Rating.aggregate([
    { $match: { ratedUserId: new mongoose.Types.ObjectId(ratedUserId) } },
    { $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
  ]);
  await User.updateOne(
    { _id: ratedUserId },
    {
      "ratingSummary.averageRating": agg ? Math.round(agg.avg * 10) / 10 : 0,
      "ratingSummary.totalRatings":  agg ? agg.count : 0,
    },
  );
}

export const submitRating = asyncHandler(async (req, res) => {
  try {
    const raterId = req.user?.userId;
    if (!raterId || !mongoose.Types.ObjectId.isValid(raterId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { ratedUserId, score, comment } = req.body;

    if (!ratedUserId || !mongoose.Types.ObjectId.isValid(ratedUserId)) {
      return res.status(400).json({ error: "Invalid ratedUserId" });
    }
    if (String(raterId) === String(ratedUserId)) {
      return res.status(400).json({ error: "Cannot rate yourself" });
    }

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      return res.status(400).json({ error: "Score must be 1–5" });
    }

    const targetUser = await User.findById(ratedUserId).select("roles name").lean();
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!["doctor", "pharmacy"].includes(targetUser.roles)) {
      return res.status(400).json({ error: "Can only rate doctors and pharmacies" });
    }

    const rating = await Rating.findOneAndUpdate(
      { ratedUserId, raterUserId: raterId },
      {
        score: parsedScore,
        comment: (comment || "").trim().slice(0, 500),
        ratedUserRole: targetUser.roles,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await recalculateSummary(ratedUserId);

    await logActivity({
      req,
      action: "rating.submit",
      entityType: "Rating",
      entityId: rating._id,
      metadata: { ratedUserId, score: parsedScore },
    });

    return res.status(200).json({ rating });
  } catch (error) {
    logger.error("[Rating] submitRating error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

export const getUserRatings = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const skip  = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      Rating.find({ ratedUserId: userId })
        .populate("raterUserId", "name profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments({ ratedUserId: userId }),
    ]);

    return res.status(200).json({ ratings, page, limit, total });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const getMyRating = asyncHandler(async (req, res) => {
  try {
    const raterId = req.user?.userId;
    const { userId: ratedUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ratedUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const rating = await Rating.findOne({
      ratedUserId,
      raterUserId: raterId,
    }).lean();

    return res.status(200).json({ rating: rating || null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const deleteRating = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const callerId = req.user?.userId;
    const callerRole = req.user?.roles;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid rating id" });
    }

    const rating = await Rating.findById(id);
    if (!rating) return res.status(404).json({ error: "Rating not found" });

    if (!isAdminRole(callerRole) && String(rating.raterUserId) !== String(callerId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { ratedUserId } = rating;
    await Rating.deleteOne({ _id: id });
    await recalculateSummary(ratedUserId);

    await logActivity({
      req,
      action: "rating.delete",
      entityType: "Rating",
      entityId: rating._id,
      metadata: { ratedUserId },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
