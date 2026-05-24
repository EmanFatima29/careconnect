import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import Appointment from "../models/appointmentModel.js";
import User from "../models/userModel.js";

// Book a new appointment (patients only)
export const bookAppointment = asyncHandler(async (req, res) => {
  const { userId, roles } = req.user;
  if (roles !== "patient") return res.status(403).json({ error: "Only patients can book appointments" });

  const { doctorId, date, durationMinutes, reason } = req.body;
  if (!doctorId || !date) return res.status(400).json({ error: "doctorId and date are required" });

  const doctor = await User.findById(doctorId).select("roles").lean();
  if (!doctor || doctor.roles !== "doctor") return res.status(404).json({ error: "Doctor not found" });

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate) || appointmentDate < new Date()) {
    return res.status(400).json({ error: "Invalid or past appointment date" });
  }

  // Simple conflict check: doctor already has an overlapping appointment
  const slotEnd = new Date(appointmentDate.getTime() + (durationMinutes || 30) * 60_000);
  const conflict = await Appointment.findOne({
    doctorId,
    status: { $in: ["pending", "confirmed"] },
    date: { $lt: slotEnd, $gte: appointmentDate },
  });
  if (conflict) return res.status(409).json({ error: "Doctor already has an appointment at that time" });

  const appointment = await Appointment.create({
    patientId: userId,
    doctorId,
    date: appointmentDate,
    durationMinutes: durationMinutes || 30,
    reason: reason || "",
  });

  const populated = await appointment.populate([
    { path: "doctorId",  select: "name email profilePic" },
    { path: "patientId", select: "name email profilePic" },
  ]);

  return res.status(201).json(populated);
});

// Get appointments for the current user (patient sees own, doctor sees theirs)
export const getMyAppointments = asyncHandler(async (req, res) => {
  const { userId, roles } = req.user;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const skip  = (page - 1) * limit;
  const status = req.query.status;

  const filter = roles === "doctor" ? { doctorId: userId } : { patientId: userId };
  if (status) filter.status = status;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("doctorId",  "name email profilePic doctorProfile")
      .populate("patientId", "name email profilePic")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return res.status(200).json({ appointments, total, page, limit });
});

// Update appointment status (doctor confirms/completes, either cancels)
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { userId, roles } = req.user;
  const { id } = req.params;
  const { status, cancelReason } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) return res.status(404).json({ error: "Appointment not found" });

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor  = appointment.doctorId.toString()  === userId;
  const isAdmin   = ["admin", "superadmin"].includes(roles);

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({ error: "Not authorised" });
  }

  const allowed = {
    patient: ["cancelled"],
    doctor:  ["confirmed", "cancelled", "completed", "no-show"],
    admin:   ["pending", "confirmed", "cancelled", "completed", "no-show"],
  };
  const role = isAdmin ? "admin" : isDoctor ? "doctor" : "patient";
  if (!allowed[role].includes(status)) {
    return res.status(400).json({ error: `Cannot set status '${status}' as ${role}` });
  }

  appointment.status = status;
  if (status === "cancelled") {
    appointment.cancelledBy = role === "admin" ? "doctor" : role;
    appointment.cancelReason = cancelReason || "";
  }
  await appointment.save();

  const populated = await appointment.populate([
    { path: "doctorId",  select: "name email profilePic" },
    { path: "patientId", select: "name email profilePic" },
  ]);

  return res.status(200).json(populated);
});

// Get a doctor's available slots for a given date (public)
export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date query param required (YYYY-MM-DD)" });

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedSlots = await Appointment.find({
    doctorId,
    status: { $in: ["pending", "confirmed"] },
    date: { $gte: dayStart, $lte: dayEnd },
  }).select("date durationMinutes").lean();

  return res.status(200).json({ date, bookedSlots });
});
