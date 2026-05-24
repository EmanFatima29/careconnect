import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    isGroup: { type: Boolean, default: false },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    unreadMessages: {
      type: Map,
      of: Number,
      default: {},
    },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // if you choose to store message references here
  },
  { timestamps: true },
);

// Index for fetching all chats a user participates in
chatSchema.index({ participants: 1, updatedAt: -1 });
// Index for 1:1 duplicate-prevention queries
chatSchema.index({ participants: 1, isGroup: 1 });

export default mongoose.model("Chat", chatSchema);
