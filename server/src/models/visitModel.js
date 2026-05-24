import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    gpsVerified: { type: Boolean, default: false },
    proximityDistance: { type: Number, default: null },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    photos: [{ type: String }],
    duration: { type: Number, default: null },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true },
);

visitSchema.index({ visitorId: 1, createdAt: -1 });
visitSchema.index({ patientId: 1, createdAt: -1 });
visitSchema.index({ location: "2dsphere" });

export default mongoose.model("Visit", visitSchema);
