import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    date: { type: Date, required: true, index: true },
    time: { type: String, default: "" }, // e.g. "09:00"
    duration: { type: String, default: "" }, // e.g. "1 hour", "30 min"
    type: {
      type: String,
      enum: ["task", "meeting", "monitoring", "review", "reminder", "other"],
      default: "task",
    },
    color: { type: String, default: "#2e7d32" },
    completed: { type: Boolean, default: false },

    // Creator — always set
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional group — if set, event is visible to all group members
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

// Compound index for efficient calendar queries
eventSchema.index({ creatorId: 1, date: 1 });
eventSchema.index({ groupId: 1, date: 1 });

export default mongoose.model("Event", eventSchema);
