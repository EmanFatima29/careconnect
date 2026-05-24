import mongoose from "mongoose";

/**
 * Media Model
 * Stores all uploaded media (images, videos, files) with responsive variants.
 * Links to the uploading user and the context (monitoring, chat, profile, etc.)
 */
const mediaSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Original file info
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number }, // bytes

    // Media type classification
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document", "other"],
      required: true,
      index: true,
    },

    // Context where media was uploaded
    context: {
      type: String,
      enum: ["profile", "monitoring", "chat", "group", "prescription", "general"],
      default: "general",
      index: true,
    },

    // Reference to related entity (chatId, messageId, prescriptionId, etc.)
    relatedTo: {
      model: { type: String }, // "Message", "Chat", "Prescription", etc.
      id: { type: mongoose.Schema.Types.ObjectId },
    },

    // Cloudinary public_id for management (delete, transform)
    cloudinaryId: { type: String },

    // URLs for different sizes/variants
    urls: {
      // Original uploaded file
      original: { type: String, required: true },

      // Image variants (only for images)
      thumbnail: { type: String }, // 150x150 - for lists, avatars
      small: { type: String }, // 320px wide - mobile
      medium: { type: String }, // 640px wide - tablet
      large: { type: String }, // 1024px wide - desktop
      xlarge: { type: String }, // 1920px wide - full screen

      // Video variants (only for videos)
      videoThumb: { type: String }, // Video thumbnail image
      videoPreview: { type: String }, // Short preview clip (if supported)
    },

    // Image dimensions (original)
    dimensions: {
      width: { type: Number },
      height: { type: Number },
    },

    // Video duration in seconds
    duration: { type: Number },

    // AI analysis results (for monitoring)
    aiAnalysis: {
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
      },
      result: { type: String }, // "healthy", "issue", etc.
      confidence: { type: Number },
      details: { type: mongoose.Schema.Types.Mixed },
      analyzedAt: { type: Date },
    },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

// Compound indexes
mediaSchema.index({ uploadedBy: 1, context: 1, createdAt: -1 });
mediaSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 });
mediaSchema.index({ isDeleted: 1, createdAt: -1 });

export default mongoose.model("Media", mediaSchema);
