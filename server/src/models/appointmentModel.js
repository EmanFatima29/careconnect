import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: ObjectId, ref: "User", required: true, index: true },
    doctorId:  { type: ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 10, max: 240 },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending",
      index: true,
    },
    cancelledBy: { type: String, enum: ["patient", "doctor", null], default: null },
    cancelReason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: -1 });

export default mongoose.model("Appointment", appointmentSchema);
