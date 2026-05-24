import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed formats by category
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm"];
const DOCUMENT_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
];
const ALL_FORMATS = [...IMAGE_FORMATS, ...VIDEO_FORMATS, ...DOCUMENT_FORMATS];

// Profile pictures — square prescriptions with face detection
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "careconnect/profiles",
    allowed_formats: IMAGE_FORMATS,
    resource_type: "image",
  },
});

// Monitoring ward images/videos
const monitoringStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "careconnect/monitoring",
    allowed_formats: [...IMAGE_FORMATS, ...VIDEO_FORMATS],
    resource_type: "auto",
  },
});

// Message media — all types
const messageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "careconnect/messages",
    allowed_formats: ALL_FORMATS,
    resource_type: "auto",
  },
});

// General media storage — for any context
const generalStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "careconnect/media",
    allowed_formats: ALL_FORMATS,
    resource_type: "auto",
  },
});

// File size limits
const LIMITS = {
  profile: 5 * 1024 * 1024, // 5MB
  monitoring: 50 * 1024 * 1024, // 50MB (videos)
  message: 25 * 1024 * 1024, // 25MB
  general: 50 * 1024 * 1024, // 50MB
};

// Single file uploaders
export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: LIMITS.profile },
});

export const uploadMonitoring = multer({
  storage: monitoringStorage,
  limits: { fileSize: LIMITS.monitoring },
});

export const uploadMessage = multer({
  storage: messageStorage,
  limits: { fileSize: LIMITS.message },
});

export const uploadGeneral = multer({
  storage: generalStorage,
  limits: { fileSize: LIMITS.general },
});

// Export cloudinary instance for direct use
export { cloudinary };
