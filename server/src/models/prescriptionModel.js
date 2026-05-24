import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    duration: {
      type: Number,
      default: null,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Prescribed", "Active", "Completed", "Archived"],
      default: "Prescribed",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    // Patient location / clinic location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    // AI health analysis history
    healthHistory: [
      {
        date: { type: Date, default: Date.now },
        vitals: { type: Number, default: null },
        healthStatus: {
          type: String,
          enum: ["healthy", "stable", "worsening", "critical", null],
          default: null,
        },
        symptomAnalysis: { type: String, default: null },
        confidence: { type: Number, default: null },
        recommendations: [{ type: String }],
        source: { type: String, enum: ["diagnostic", "photo", "manual"], default: "manual" },
      },
    ],
    // Latest health snapshot
    currentHealth: {
      status: {
        type: String,
        enum: ["healthy", "stable", "worsening", "critical", null],
        default: null,
      },
      lastChecked: { type: Date, default: null },
      vitals: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ location: "2dsphere" });

export default mongoose.model("Prescription", prescriptionSchema);
