import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendError } from "../../utils/responseHandler.js";
import logger from "../../lib/logger.js";
import {
  processAndSaveMedia,
  processMultipleMedia,
  getUserMedia,
  deleteMedia,
  formatMediaResponse,
} from "../services/mediaService.js";

/**
 * POST /api/media/upload
 * Upload a single file (image, video, document) with responsive variants.
 */
export const uploadSingleMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "No file provided", 400);
  }

  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const context = req.body.context || "general";
  const relatedModel = req.body.relatedModel;
  const relatedId = req.body.relatedId;

  try {
    const mediaResult = await processAndSaveMedia({
      file: req.file,
      userId,
      context,
      relatedTo:
        relatedModel && relatedId
          ? { model: relatedModel, id: relatedId }
          : null,
    });

    logger.log(`[Media] Uploaded ${mediaResult.mediaType} for user ${userId}`);

    return sendSuccess(res, formatMediaResponse(mediaResult));
  } catch (error) {
    logger.error("[Media] Single upload failed:", error);
    return sendError(res, "Failed to process upload", 500);
  }
});

/**
 * POST /api/media/upload-multiple
 * Upload multiple files at once with responsive variants.
 */
export const uploadMultipleMedia = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return sendError(res, "No files provided", 400);
  }

  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const context = req.body.context || "general";
  const relatedModel = req.body.relatedModel;
  const relatedId = req.body.relatedId;

  try {
    const results = await processMultipleMedia({
      files: req.files,
      userId,
      context,
      relatedTo:
        relatedModel && relatedId
          ? { model: relatedModel, id: relatedId }
          : null,
    });

    logger.log(
      `[Media] Uploaded ${results.successful.length} files for user ${userId}`,
    );

    return sendSuccess(res, {
      successful: results.successful.map(formatMediaResponse),
      failed: results.failed,
      totalUploaded: results.successful.length,
      totalFailed: results.failed.length,
    });
  } catch (error) {
    logger.error("[Media] Multiple upload failed:", error);
    return sendError(res, "Failed to process uploads", 500);
  }
});

/**
 * GET /api/media
 * Get all media for the current user, optionally filtered by context.
 */
export const listUserMedia = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const context = req.query.context || null;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const media = await getUserMedia(userId, context, limit);
    return sendSuccess(res, {
      media: media.map(formatMediaResponse),
      total: media.length,
    });
  } catch (error) {
    logger.error("[Media] Failed to fetch media:", error);
    return sendError(res, "Failed to fetch media", 500);
  }
});

/**
 * DELETE /api/media/:mediaId
 * Soft-delete a media item (marks as deleted, keeps in Cloudinary).
 */
export const deleteUserMedia = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const { mediaId } = req.params;

  try {
    const result = await deleteMedia(mediaId, userId);

    if (!result) {
      return sendError(
        res,
        "Media not found or you don't have permission",
        404,
      );
    }

    return sendSuccess(res, { message: "Media deleted successfully" });
  } catch (error) {
    logger.error("[Media] Delete failed:", error);
    return sendError(res, "Failed to delete media", 500);
  }
});
