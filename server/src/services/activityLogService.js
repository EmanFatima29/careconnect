import mongoose from "mongoose";
import ActivityLog from "../models/activityLogModel.js";

const safeObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

export const logActivity = async ({
  req,
  action,
  entityType = null,
  entityId = null,
  status = "success",
  metadata = {},
}) => {
  try {
    if (!action || typeof action !== "string") return;

    const actorId = safeObjectId(req?.user?.userId);
    const actorEmail =
      typeof req?.user?.email === "string" ? req.user.email : null;

    await ActivityLog.create({
      actorId,
      actorEmail,
      action,
      entityType,
      entityId: safeObjectId(entityId),
      status,
      ip:
        typeof req?.ip === "string"
          ? req.ip
          : typeof req?.headers?.["x-forwarded-for"] === "string"
          ? req.headers["x-forwarded-for"].split(",")[0].trim()
          : null,
      userAgent:
        typeof req?.headers?.["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });
  } catch {
    // Best-effort audit trail; never block primary request.
  }
};
