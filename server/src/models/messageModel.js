import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    content: { type: String, trim: true },
    messageType: {
      type: String,
      enum: ["text", "voice", "image", "video", "file", "audio", "document"],
      default: "text",
    },
    // Legacy ward - kept for backwards compatibility
    fileUrl: { type: String, default: "" },
    // New media ward with responsive variants
    media: {
      mediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      cloudinaryId: { type: String, default: null },
      mediaType: {
        type: String,
        enum: ["image", "video", "audio", "document", "other"],
        default: null,
      },
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: null },
      urls: {
        original: { type: String, default: null },
        thumbnail: { type: String, default: null },
        small: { type: String, default: null },
        medium: { type: String, default: null },
        large: { type: String, default: null },
        xlarge: { type: String, default: null },
        videoThumb: { type: String, default: null },
        videoPreview: { type: String, default: null },
      },
      duration: { type: Number, default: null }, // For video/audio in seconds
      dimensions: {
        width: { type: Number, default: null },
        height: { type: Number, default: null },
      },
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen", "failed"],
      default: "sent",
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    sentiment: {
      score: { type: Number, default: null },
      label: { type: String, enum: ["positive", "negative", "neutral", null], default: null },
      language: { type: String, default: null },
    },
  },
  { timestamps: true },
);

// Indexes for common query patterns
messageSchema.index({ chatId: 1, createdAt: 1 }); // Fetch messages in a chat ordered by time
messageSchema.index({ senderId: 1, createdAt: -1 }); // Messages by a sender
messageSchema.index({ chatId: 1, status: 1 }); // Unread message queries

export default mongoose.model("Message", messageSchema);
