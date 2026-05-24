// src/routes/userRoutes.js
import express from "express";
import { authenticate, requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../models/userModel.js";
import {
  authRateLimiter,
  forgotPasswordRateLimiter,
} from "../middleware/rateLimiter.js";
import {
  createUser,
  getUserByName,
  getUserByPhone,
  getAllUsers,
  getUserById,
  getUserByEmail,
  searchUser,
  deleteUser,
  updateUser,
  updateUserProfile,
  deleteProfilePic,
  setUserOffline,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  validateResetToken,
  logoutUser,
} from "../controllers/userController.js";
import { uploadProfile } from "../middleware/upload.js";

const router = express.Router();

/**
 * Allows access via a valid user JWT OR the shared INTERNAL_API_KEY header.
 * NextAuth server-side calls use the API key so the password hash can be
 * returned for credential verification. Browser callers use JWT (password stripped).
 */
function allowInternalOrAuthenticated(req, res, next) {
  const internalKey = process.env.INTERNAL_API_KEY;
  const sentKey = req.headers["x-api-key"];
  if (internalKey && sentKey === internalKey) {
    req.isInternalCall = true;
    return next();
  }
  return authenticate(req, res, next);
}
// Self-service profile update with optional profile picture upload
router.patch(
  "/me",
  requireAuth,
  uploadProfile.single("profilePic"),
  updateUserProfile,
);
router.delete("/me/profile-pic", requireAuth, deleteProfilePic);

// Public routes — rate-limited
router.post("/", authRateLimiter, createUser);
router.post("/status-offline", authRateLimiter, setUserOffline);
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/reset-password/:token", authRateLimiter, resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authRateLimiter, resendVerification);
router.get("/validate-reset-token/:token", validateResetToken);

// Logout — blacklists the current token
router.post("/logout", authenticate, logoutUser);

// Internal-only: update login attempts (called from NextAuth authorize)
router.patch("/internal/login-attempts/:email", (req, res, next) => {
  const internalKey = process.env.INTERNAL_API_KEY;
  const sentKey = req.headers["x-api-key"];
  if (!internalKey || sentKey !== internalKey) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}, asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { loginAttempts, lockUntil } = req.body;
  const update = {};
  if (loginAttempts !== undefined) update.loginAttempts = loginAttempts;
  if (lockUntil !== undefined) update.lockUntil = lockUntil;
  await User.updateOne({ email: email.toLowerCase() }, { $set: update });
  return res.status(200).json({ success: true });
}));

// getUserByEmail: NextAuth (internal key) gets full user; JWT callers get -password
router.get("/email/:email", allowInternalOrAuthenticated, getUserByEmail);

// Authenticated routes
router.get("/profile", authenticate, getCurrentUser);
router.get("/search", authenticate, searchUser);
router.get("/name/:name", authenticate, getUserByName);
router.get("/phone/:phone", authenticate, getUserByPhone);
router.get("/", authenticate, getAllUsers);
router.get("/id/:_id", authenticate, getUserById);
router.patch("/:email", authenticate, updateUser);

// Admin only
router.delete("/:_id", authenticate, requireAdmin, deleteUser);
export default router;
