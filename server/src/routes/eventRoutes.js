import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getEvents);
router.post("/", createEvent);
router.patch("/:id", updateEvent);
router.patch("/:id/toggle", toggleEvent);
router.delete("/:id", deleteEvent);

export default router;
