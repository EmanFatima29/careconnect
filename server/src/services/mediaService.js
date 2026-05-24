import { v2 as cloudinary } from "cloudinary";
import Media from "../models/mediaModel.js";
import logger from "../../lib/logger.js";

// Configure Cloudinary (already configured in upload.js, but ensure it's set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Detect media type from MIME type
 */
export function getMediaType(mimeType) {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text/") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

/**
 * Generate responsive image variants using Cloudinary transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {string} originalUrl - Original uploaded URL
 * @returns {object} URLs for different sizes
 */
export function generateImageVariants(publicId, originalUrl) {
  if (!publicId) {
    return { original: originalUrl };
  }

  const baseUrl = originalUrl.split("/upload/")[0] + "/upload";
  const path = originalUrl.split("/upload/")[1];

  // Extract version and path properly
  const transformUrl = (transforms) => {
    return `${baseUrl}/${transforms}/${path}`;
  };

  return {
    original: originalUrl,
    thumbnail: transformUrl("c_fill,w_150,h_150,g_auto,q_auto,f_auto"),
    small: transformUrl("c_limit,w_320,q_auto,f_auto"),
    medium: transformUrl("c_limit,w_640,q_auto,f_auto"),
    large: transformUrl("c_limit,w_1024,q_auto,f_auto"),
    xlarge: transformUrl("c_limit,w_1920,q_auto,f_auto"),
  };
}

/**
 * Generate profile picture variants (square prescriptions)
 */
export function generateProfileVariants(publicId, originalUrl) {
  if (!publicId) {
    return { original: originalUrl };
  }

  const baseUrl = originalUrl.split("/upload/")[0] + "/upload";
  const path = originalUrl.split("/upload/")[1];

  const transformUrl = (transforms) => {
    return `${baseUrl}/${transforms}/${path}`;
  };

  return {
    original: originalUrl,
    thumbnail: transformUrl("c_fill,w_50,h_50,g_face,q_auto,f_auto"),
    small: transformUrl("c_fill,w_100,h_100,g_face,q_auto,f_auto"),
    medium: transformUrl("c_fill,w_200,h_200,g_face,q_auto,f_auto"),
    large: transformUrl("c_fill,w_400,h_400,g_face,q_auto,f_auto"),
  };
}

/**
 * Generate video thumbnail
 */
export function generateVideoVariants(publicId, originalUrl) {
  if (!publicId) {
    return { original: originalUrl };
  }

  const baseUrl = originalUrl.split("/upload/")[0] + "/upload";
  const path = originalUrl.split("/upload/")[1];

  // Replace extension with jpg for thumbnail
  const thumbPath = path.replace(/\.[^.]+$/, ".jpg");

  return {
    original: originalUrl,
    videoThumb: `${baseUrl}/c_fill,w_640,h_360,so_0,f_jpg/${thumbPath}`,
  };
}

/**
 * Process uploaded file and save to Media collection
 * @param {object} params
 * @param {object} params.file - Multer file object (with path from Cloudinary)
 * @param {string} params.userId - Uploading user's ID
 * @param {string} params.context - Upload context (profile, monitoring, chat, etc.)
 * @param {object} params.relatedTo - Optional related entity { model, id }
 * @returns {object} Saved media document
 */
export async function processAndSaveMedia({
  file,
  userId,
  context = "general",
  relatedTo = null,
}) {
  if (!file || !file.path) {
    throw new Error("No file provided");
  }

  const mimeType = file.mimetype || "";
  const mediaType = getMediaType(mimeType);
  const originalUrl = file.path;

  // Extract Cloudinary public_id from URL
  // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.ext
  let cloudinaryId = null;
  try {
    const urlParts = originalUrl.split("/upload/");
    if (urlParts[1]) {
      // Remove version prefix (v123/) and get the path
      const pathWithVersion = urlParts[1];
      cloudinaryId = pathWithVersion
        .replace(/^v\d+\//, "")
        .replace(/\.[^.]+$/, "");
    }
  } catch (e) {
    logger.warn("[MediaService] Could not extract cloudinaryId:", e.message);
  }

  // Generate variants based on media type
  let urls = { original: originalUrl };

  if (mediaType === "image") {
    if (context === "profile") {
      urls = generateProfileVariants(cloudinaryId, originalUrl);
    } else {
      urls = generateImageVariants(cloudinaryId, originalUrl);
    }
  } else if (mediaType === "video") {
    urls = generateVideoVariants(cloudinaryId, originalUrl);
  }

  // Create media document
  const mediaDoc = new Media({
    uploadedBy: userId,
    originalName: file.originalname || "unknown",
    mimeType,
    size: file.size,
    mediaType,
    context,
    relatedTo: relatedTo ? relatedTo : undefined,
    cloudinaryId,
    urls,
    aiAnalysis: context === "monitoring" ? { status: "pending" } : undefined,
  });

  await mediaDoc.save();
  logger.log(`[MediaService] Saved media: ${mediaDoc._id} (${mediaType})`);

  return mediaDoc;
}

/**
 * Process multiple files
 */
export async function processMultipleMedia({
  files,
  userId,
  context = "general",
  relatedTo = null,
}) {
  if (!files || files.length === 0) {
    return [];
  }

  const results = await Promise.all(
    files.map((file) =>
      processAndSaveMedia({ file, userId, context, relatedTo }),
    ),
  );

  return results;
}

/**
 * Get user's media by context
 */
export async function getUserMedia(userId, context = null, limit = 50) {
  const query = { uploadedBy: userId, isDeleted: false };
  if (context) {
    query.context = context;
  }

  return Media.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

/**
 * Soft delete media
 */
export async function deleteMedia(mediaId, userId) {
  const media = await Media.findOne({ _id: mediaId, uploadedBy: userId });
  if (!media) {
    throw new Error("Media not found or unauthorized");
  }

  media.isDeleted = true;
  media.deletedAt = new Date();
  await media.save();

  // Optionally delete from Cloudinary
  if (media.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(media.cloudinaryId, {
        resource_type: media.mediaType === "video" ? "video" : "image",
      });
      logger.log(
        `[MediaService] Deleted from Cloudinary: ${media.cloudinaryId}`,
      );
    } catch (err) {
      logger.warn(`[MediaService] Cloudinary delete failed: ${err.message}`);
    }
  }

  return media;
}

/**
 * Format media for API response
 */
export function formatMediaResponse(media) {
  return {
    id: media._id,
    mediaType: media.mediaType,
    urls: media.urls,
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
    context: media.context,
    dimensions: media.dimensions,
    duration: media.duration,
    aiAnalysis: media.aiAnalysis,
    createdAt: media.createdAt,
  };
}
