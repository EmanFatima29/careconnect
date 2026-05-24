import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorAvailability,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/",                       authenticate, bookAppointment);
router.get("/",                        authenticate, getMyAppointments);
router.patch("/:id/status",            authenticate, updateAppointmentStatus);
router.get("/availability/:doctorId",  getDoctorAvailability);

export default router;
