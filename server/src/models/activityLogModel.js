import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorEmail: { type: String, trim: true, lowercase: true, default: null },

    action: { type: String, required: true, trim: true, index: true },

    entityType: { type: String, trim: true, default: null, index: true },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
      index: true,
    },

    ip: { type: String, trim: true, default: null },
    userAgent: { type: String, trim: true, default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
