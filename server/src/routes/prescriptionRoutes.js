import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listPrescriptions,
  getPrescriptionById,
  getPrescriptionsByUser,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", listPrescriptions);
router.get("/user/:userId", getPrescriptionsByUser);
router.get("/:id", getPrescriptionById);
router.post("/", createPrescription);
router.patch("/:id", updatePrescription);
router.delete("/:id", deletePrescription);

export default router;
