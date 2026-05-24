import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadGeneral } from "../middleware/upload.js";
import {
  uploadSingleMedia,
  uploadMultipleMedia,
  listUserMedia,
  deleteUserMedia,
} from "../controllers/mediaController.js";

const router = express.Router();

// POST /api/media/upload — upload a single file (image, video, document)
router.post(
  "/upload",
  requireAuth,
  uploadGeneral.single("file"),
  uploadSingleMedia,
);

// POST /api/media/upload-multiple — upload multiple files at once (max 10)
router.post(
  "/upload-multiple",
  requireAuth,
  uploadGeneral.array("files", 10),
  uploadMultipleMedia,
);

// GET /api/media — list user's media (optional ?context=profile|chat|monitoring)
router.get("/", requireAuth, listUserMedia);

// DELETE /api/media/:mediaId — soft-delete a media item
router.delete("/:mediaId", requireAuth, deleteUserMedia);

export default router;
