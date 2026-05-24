import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  submitRating,
  getUserRatings,
  getMyRating,
  deleteRating,
} from "../controllers/ratingController.js";

const router = express.Router();

router.post("/",              authenticate, submitRating);
router.get("/:userId",                      getUserRatings);   // public — profile page
router.get("/my/:userId",     authenticate, getMyRating);
router.delete("/:id",         authenticate, deleteRating);

export default router;
