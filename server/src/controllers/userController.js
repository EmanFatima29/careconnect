import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
// src/controllers/userController.js
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Group from "../models/groupModel.js";
import Prescription from "../models/prescriptionModel.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod"; // Zod (Schema Validation)
import { hashPassword } from "../../utility/auth.js"; //Password Hashing
import { logActivity } from "../services/activityLogService.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import { processAndSaveMedia } from "../services/mediaService.js";
import { blacklistToken } from "../services/tokenBlacklist.js";
import jwt from "jsonwebtoken";
import {
  sendSuccess,
  sendError,
  sendConflict,
  sendNotFound,
} from "../../utils/responseHandler.js";

// ── Password strength validation ──
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_RULES = "Password must be at least 8 characters with uppercase, lowercase, number, and special character";

// ── Account lockout constants ──
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const ALLOWED_SIGNUP_ROLES = ["patient", "doctor", "pharmacy"];

// Create or update a user
export const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, profilePic, password, socialAccounts, roles: rawRoles, doctorProfile, pharmacyProfile } =
      req.body;

    // Normalize email to lowercase (DB stores emails as lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    //IF USER ALREADY EXISTS RETURN 409
    if (user) {
      return sendConflict(res, "User already exists. Please log in.");
    }

    // Validate password strength for credentials signup
    if (password && !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ error: PASSWORD_RULES });
    }

    // CREATE NEW USER
    // Only hash password if provided (credentials signup)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    // Always ensure socialAccounts is an array
    let socialAccountsArr = [];
    if (Array.isArray(socialAccounts)) {
      socialAccountsArr = socialAccounts;
    } else if (socialAccounts) {
      socialAccountsArr = [socialAccounts];
    }

    // OAuth users are auto-verified; credentials users need email verification
    const isOAuth = socialAccountsArr.length > 0;

    // Validate and coerce role — only allow patient/doctor/pharmacy on self-signup
    const requestedRole = ALLOWED_SIGNUP_ROLES.includes(rawRoles) ? rawRoles : "patient";

    user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      password: hashedPassword,
      socialAccounts: socialAccountsArr,
      profilePic: profilePic ? profilePic : null,
      emailVerified: isOAuth,
      roles: requestedRole,
      ...(requestedRole === "doctor" && doctorProfile ? {
        doctorProfile: {
          specialty: doctorProfile.specialty?.trim() || null,
          licenseNumber: doctorProfile.licenseNumber?.trim() || null,
          verified: false,
        },
      } : {}),
      ...(requestedRole === "pharmacy" && pharmacyProfile ? {
        pharmacyProfile: {
          licenseNumber: pharmacyProfile.licenseNumber?.trim() || null,
          verified: false,
        },
      } : {}),
    });

    // Generate email verification token for credentials signup
    if (!isOAuth) {
      const verifyToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verifyToken)
        .digest("hex");
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await user.save();

      // Send verification email
      const clientUrl =
        process.env.CLIENT_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      const verifyUrl = `${clientUrl}/api/auth/verify-email?token=${verifyToken}`;

      try {
        await sendVerificationEmail(normalizedEmail, verifyUrl);
        logger.log("[Signup] Verification email sent to:", normalizedEmail);
      } catch (emailErr) {
        logger.error("[Signup] Failed to send verification email:", emailErr);
        logger.log("[Signup] Verify URL (manual):", verifyUrl);
      }
    } else {
      await user.save();
    }

    return sendSuccess(res, user, "User created successfully", 201);
  } catch (error) {
    logger.error("Signup error:", error);
    return sendError(res, error.message, 500);
  }
});

// ── Email Verification ──
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired verification link" });
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  logger.log("[VerifyEmail] Email verified for:", user.email);
  return res.status(200).json({ message: "Email verified successfully. You can now log in." });
});

// ── Resend Verification Email ──
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return 200 to prevent enumeration
  if (!user || user.emailVerified) {
    return res.status(200).json({
      message: "If the account exists and is unverified, a new link has been sent.",
    });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const clientUrl =
    process.env.CLIENT_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${clientUrl}/api/auth/verify-email?token=${verifyToken}`;

  try {
    await sendVerificationEmail(user.email, verifyUrl);
  } catch (err) {
    logger.error("[ResendVerification] Failed:", err);
    logger.log("[ResendVerification] Verify URL (manual):", verifyUrl);
  }

  return res.status(200).json({
    message: "If the account exists and is unverified, a new link has been sent.",
  });
});

// ── Validate Reset Token (GET) ──
export const validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ valid: false, error: "Token is required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("email");

  if (!user) {
    return res.status(400).json({ valid: false, error: "Invalid or expired reset token" });
  }

  return res.status(200).json({ valid: true });
});

// ── Logout (blacklist token) ──
export const logoutUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const decoded = jwt.decode(token);
      blacklistToken(token, decoded?.exp);
    } catch (_) {
      // Token decode failed, still proceed with logout
    }
  }

  return res.status(200).json({ message: "Logged out successfully" });
});

// ── Record Failed Login (called from NextAuth) ──
export const recordFailedLogin = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return;

    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      logger.warn(`[Auth] Account locked for: ${email} (${MAX_LOGIN_ATTEMPTS} failed attempts)`);
    }
    await user.save();
  } catch (err) {
    logger.error("[Auth] Failed to record login attempt:", err);
  }
};

// ── Reset Login Attempts (called on successful login) ──
export const resetLoginAttempts = async (email) => {
  try {
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { loginAttempts: 0, lockUntil: null } },
    );
  } catch (err) {
    logger.error("[Auth] Failed to reset login attempts:", err);
  }
};

// ── Check Account Lock Status ──
export const isAccountLocked = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "loginAttempts lockUntil",
    );
    if (!user) return false;

    if (user.lockUntil && user.lockUntil > new Date()) {
      return true;
    }

    // Lock expired, reset
    if (user.lockUntil && user.lockUntil <= new Date()) {
      await User.updateOne(
        { email: email.toLowerCase() },
        { $set: { loginAttempts: 0, lockUntil: null } },
      );
    }

    return false;
  } catch (err) {
    logger.error("[Auth] Failed to check lock status:", err);
    return false;
  }
};

// Get all users - Returns limited data for regular users, full data for admins
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Check admin role
    const userRole = req.user.roles;
    const isAdmin = userRole === "admin" || userRole === "superadmin";

    // For non-admins, return limited user data (for chat, contacts, etc.)
    // For admins, return full user data (except password)
    const selectFields = isAdmin
      ? "-password -__v -resetPasswordToken -resetPasswordExpires"
      : "name email profilePic status lastSeen _id";

    const users = await User.find().select(selectFields);

    // Match the frontend's expected response structure
    res.status(200).json({
      success: true,
      data: users,
      statusCode: 200,
    });
  } catch (error) {
    logger.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
// Get a user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const user = await User.findById(req.params._id).select(
      "-password -__v -resetPasswordToken -resetPasswordExpires",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Get User by Email — internal use by NextAuth; returns safe wards only (no password)
export const getUserByEmail = asyncHandler(async (req, res) => {
  try {
    // Normalize email to lowercase (DB stores emails as lowercase)
    const decodedEmail = decodeURIComponent(req.params.email).toLowerCase();

    // Internal server-to-server calls (e.g. NextAuth credential verify) may need
    // the password hash for bcrypt.compare; all other callers get it stripped.
    const selectFields = req.isInternalCall ? "-__v" : "-password -__v";
    const user = await User.findOne({ email: decodedEmail }).select(
      selectFields,
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    logger.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get User by Name
export const getUserByName = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name.trim() }).select(
      "-password -__v -resetPasswordToken -resetPasswordExpires",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//GET USER BY PHONE
export const getUserByPhone = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone.trim() }).select(
      "-password -__v -resetPasswordToken -resetPasswordExpires",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Escape special regex characters to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Search User by any ward
export const searchUser = asyncHandler(async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }
    if (query.length > 100) {
      return res.status(400).json({ error: "Query too long" });
    }

    // Escape user input before creating RegExp to prevent ReDoS
    const safeRegex = new RegExp(escapeRegex(query.trim()), "i");

    const users = await User.find({
      $or: [
        { name: safeRegex },
        { email: safeRegex },
        { phone: safeRegex },
        { _id: mongoose.Types.ObjectId.isValid(query) ? query : undefined },
      ],
    })
      .select("-password -__v")
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user — cascades to messages, chats, groups, prescriptions
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.params;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ---- Cascade deletes ----
    // 1. Delete all messages sent by this user
    await Message.deleteMany({ senderId: _id });

    // 2. Find all chats where this user is the only other participant and delete them;
    //    for multi-party chats just remove the user from participants
    const userChats = await Chat.find({ participants: _id });
    for (const chat of userChats) {
      const remaining = chat.participants.filter(
        (p) => String(p) !== String(_id),
      );
      if (remaining.length === 0) {
        // Last participant — delete the chat entirely
        await Chat.findByIdAndDelete(chat._id);
        await Message.deleteMany({ chatId: chat._id });
      } else {
        await Chat.findByIdAndUpdate(chat._id, {
          $pull: { participants: _id },
        });
      }
    }

    // 3. Remove from groups
    await Group.updateMany(
      { members: _id },
      { $pull: { members: _id, admins: _id } },
    );
    // Delete groups where this user is the sole creator and there are no other members
    const ownedGroups = await Group.find({ createdBy: _id });
    for (const grp of ownedGroups) {
      if (
        !grp.members ||
        grp.members.filter((m) => String(m) !== String(_id)).length === 0
      ) {
        await Group.findByIdAndDelete(grp._id);
      }
    }

    // 4. Delete all prescriptions
    await Prescription.deleteMany({ ownerId: _id });

    // 5. Finally delete the user
    await User.findByIdAndDelete(_id);

    await logActivity({
      req,
      action: "user.delete",
      entityType: "User",
      entityId: _id,
      metadata: { email: user.email },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("deleteUser error:", error);
    res.status(500).json({ error: error.message });
  }
});
//

// Update a User

// Define the validation schema using Zod
const updatesSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(["online", "offline"]).optional(),

    // ADDRESS
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        zipCode: z.string().optional(),
      })
      .optional(),

    gender: z.enum(["male", "female", "other"]).optional(),
    age: z.number().optional(),
    dob: z.coerce.date().optional(),
    relationship: z.enum(["single", "relationship", "complicated"]).optional(),
    workStatus: z.enum(["employed", "unemployed", "freelance"]).optional(),
    bio: z.string().optional(),
    story: z.array(z.any()).optional(),
    interests: z.string().optional(),
    education: z.string().optional(),

    location: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.array(z.number()).length(2).optional(), // [lng, lat]
      })
      .optional(),

    userType: z.enum(["friend", "admin", "groupMember", "unknown"]).optional(),
    user: z.enum(["user", "admin", "superadmin"]).optional(),

    lastSeen: z.coerce.date().optional(),
    accountType: z.enum(["private", "limited", "public"]).optional(),
    lastLogin: z.coerce.date().optional(),

    socialAccounts: z.array(z.any()).optional(),
    password: z.string().optional(),

    profilePic: z.string().optional(),
    account: z.enum(["active", "locked", "blocked"]).optional(),

    settings: z
      .object({
        chatNotifications: z.boolean().optional(),
        showReadReceipts: z.boolean().optional(),
        locationSharing: z.boolean().optional(),
        visibleRange: z.number().optional(),
        allowMessagesFrom: z
          .enum(["everyone", "friends", "selected", "no one"])
          .optional(),
        theme: z.enum(["light", "dark"]).optional(),
        showSentiment: z.boolean().optional(),
      })
      .optional(),
  })
  .strict(); // Prevent unknown wards;

export const updateUser = asyncHandler(async (req, res) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1. Get authenticated user from middleware
    const { user } = req; // Added by authenticate middleware

    const role = user?.roles;
    const isAdmin = role === "admin" || role === "superadmin";

    // 2. Validate target email from URL (support /me alias)
    let targetEmail;
    if (!req.params.email || req.params.email === "me") {
      // Self-update via /me or when no param given
      targetEmail = user?.email?.toLowerCase();
    } else {
      targetEmail = z
        .string()
        .email()
        .parse(decodeURIComponent(req.params.email))
        .toLowerCase(); // Normalize to lowercase (DB stores emails as lowercase)
    }

    // 3. Authorization check (simplified since we already have the user)
    if (user?.email !== targetEmail && !isAdmin) {
      return res.status(403).json({
        error: "Unauthorized to update this account",
      });
    }

    // 4. Validate and sanitize updates
    const updates = updatesSchema.parse(req.body);

    // Prevent privilege/account-state escalation by non-admins
    const adminOnlyTopLevelFields = ["roles", "userType", "account"];
    const requestedTopLevelFields = Object.keys(updates);
    const hasAdminOnlyField = requestedTopLevelFields.some((k) =>
      adminOnlyTopLevelFields.includes(k),
    );
    if (hasAdminOnlyField && !isAdmin) {
      return res.status(403).json({
        error: "Insufficient role for requested update",
      });
    }

    // 5. Special handling for sensitive wards (e.g., password)
    // Special password handling
    if ("password" in req.body) {
      try {
        updates.password = await hashPassword(req.body.password);
      } catch (error) {
        // Handle password validation errors from hashPassword
        return res.status(400).json({ error: error.message });
      }
    }

    // 6. Update user
    const updatedUser = await User.findOneAndUpdate(
      { email: targetEmail },
      { $set: updates },
      { new: true, runValidators: true }, // Return updated doc and run schema validators
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 7. Remove sensitive data before sending response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.__v; // Remove version key
    //8. Emit event to all users
    const io = global.io;
    if (io) {
      io.emit("userUpdated", {
        email: targetEmail,
        updates: userResponse,
        updatedFields: Object.keys(updates),
      });
    }
    // 9. Return response
    await logActivity({
      req,
      action: "user.update",
      entityType: "User",
      entityId: updatedUser?._id,
      metadata: {
        targetEmail,
        updatedFields: Object.keys(updates),
      },
    });

    return res.status(200).json({
      success: true,
      updatedUser: userResponse,
      updatedFields: Object.keys(updates),
    });
  } catch (err) {
    // Handle errors
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: err.errors.map((e) => ({
          ward: e.path.join("."),
          message: e.message,
        })),
      });
    }
    logger.error("Update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function for audit logging
// async function logUpdate(performedBy, targetEmail, changedFields) {
//   await AuditLog.create({
//     action: "user_update",
//     performedBy,
//     targetUser: targetEmail,
//     changedFields,
//     timestamp: new Date()
//   });
// }

// Get current user profile by JWT token
export const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!userId && !email) {
      return res
        .status(401)
        .json({ error: "Unauthorized - no user info in token" });
    }
    const query = userId ? { _id: userId } : { email: email.toLowerCase() };

    const user = await User.findOne(query)
      // Populate essential related data
      .populate({
        path: "friends",
        select: "name email profilePic.thumbnail status lastSeen",
        match: { status: "online" }, // Optional: filter online friends
      })
      .populate({
        path: "friendRequests.sender",
        select: "name email profilePic.thumbnail",
      })
      .populate({
        path: "chats",
        options: { sort: { updatedAt: -1 }, limit: 10 }, // Last 10 chats
        populate: {
          path: "participants",
          select: "name email profilePic.thumbnail",
        },
      })
      .populate({
        path: "groups",
        options: { sort: { updatedAt: -1 }, limit: 10 },
        populate: {
          path: "members",
          select: "name email profilePic.thumbnail",
        },
      })
      .populate("prescriptions")
      // Exclude sensitive data
      .select("-password -resetPasswordToken -resetPasswordExpires -__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update last login and status
    user.lastLogin = new Date();
    user.status = "online"; // Optionally set user as online
    await user.save();

    // Optional: Count pending friend requests
    const pendingRequests =
      user.friendRequests?.filter((req) => req.status === "pending").length ||
      0;

    const userData = user.toObject();
    userData.pendingRequestsCount = pendingRequests;

    return sendSuccess(res, userData, "Current user fetched successfully", 200);
  } catch (error) {
    logger.error("getCurrentUser error:", error);
    return sendError(res, error.message, 500);
  }
});

// Self-service profile update with optional Cloudinary profile picture upload
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowedFields = [
      "name",
      "phone",
      "bio",
      "education",
      "interests",
      "gender",
      "dob",
      "relationship",
      "workStatus",
      "address",
      "settings",
    ];

    const updates = {};
    for (const ward of allowedFields) {
      if (req.body[ward] !== undefined) {
        if (ward === "settings" && typeof req.body.settings === "object") {
          // Merge settings instead of replacing
          updates["settings"] = req.body.settings;
        } else {
          updates[ward] = req.body[ward];
        }
      }
    }

    // Handle Cloudinary profile picture upload with responsive variants
    if (req.file) {
      try {
        const mediaResult = await processAndSaveMedia({
          file: req.file,
          userId,
          context: "profile",
          relatedTo: { model: "User", id: userId },
        });

        // Store responsive variants in profilePic ward
        updates.profilePic = {
          original: mediaResult.urls.original,
          thumbnail: mediaResult.urls.thumbnail,
          small: mediaResult.urls.small,
          medium: mediaResult.urls.medium,
          large: mediaResult.urls.large,
          cloudinaryId: mediaResult.cloudinaryId,
          mediaId: mediaResult._id,
        };
      } catch (uploadError) {
        logger.error("Profile picture upload failed:", uploadError);
        return res
          .status(500)
          .json({ error: "Failed to upload profile picture" });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid wards to update" });
    }

    // For nested settings, use $set with dot notation
    const setUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "settings" && typeof value === "object") {
        for (const [sk, sv] of Object.entries(value)) {
          setUpdates[`settings.${sk}`] = sv;
        }
      } else {
        setUpdates[key] = value;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: setUpdates },
      { new: true, runValidators: true },
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Emit update event
    const io = global.io;
    if (io) {
      io.emit("userUpdated", {
        email: updatedUser.email,
        updates: updatedUser.toObject(),
        updatedFields: Object.keys(updates),
      });
    }

    await logActivity({
      req,
      action: "user.updateProfile",
      entityType: "User",
      entityId: updatedUser._id,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return res.status(200).json({
      success: true,
      updatedUser: updatedUser.toObject(),
    });
  } catch (error) {
    logger.error("updateUserProfile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete profile picture
export const deleteProfilePic = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Clear profile pic wards
    user.profilePic = {
      original: null,
      thumbnail: null,
      small: null,
      medium: null,
      large: null,
      cloudinaryId: null,
      mediaId: null,
    };
    await user.save();

    const io = global.io;
    if (io) {
      io.emit("userUpdated", { email: user.email, updates: { profilePic: user.profilePic }, updatedFields: ["profilePic"] });
    }

    return res.json({ success: true, message: "Profile picture removed" });
  } catch (error) {
    logger.error("deleteProfilePic error:", error);
    return res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

// Set user offline (for sendBeacon)
// sendBeacon cannot send Authorization headers, so we validate via:
// 1. Rate limiting (applied in routes)
// 2. Only allows "offline" status
// 3. Requires valid email that exists in DB
// 4. Optional HMAC token validation for extra security
export const setUserOffline = asyncHandler(async (req, res) => {
  try {
    const { email, status, lastSeen, token } = req.body;
    if (!email || !status || !lastSeen) {
      return res.status(400).json({ error: "Missing required wards" });
    }

    // Only allow setting status to offline
    if (status !== "offline") {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Validate HMAC token — mandatory for security
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      if (!token) {
        return res.status(403).json({ error: "Authentication token required" });
      }
      const { createHmac } = await import("crypto");
      const expected = createHmac("sha256", secret)
        .update(`${email}:offline`)
        .digest("hex");
      if (token !== expected) {
        return res.status(403).json({ error: "Invalid token" });
      }
    }

    const parsedLastSeen = new Date(lastSeen);
    if (Number.isNaN(parsedLastSeen.getTime())) {
      return res.status(400).json({ error: "Invalid lastSeen" });
    }
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { status: "offline", lastSeen: parsedLastSeen } },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const io = global.io;
    if (io) {
      io.emit("userUpdated", {
        email,
        updates: { status: "offline", lastSeen: parsedLastSeen },
        updatedFields: ["status", "lastSeen"],
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("setUserOffline error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ========== FORGOT / RESET PASSWORD ==========

/**
 * POST /api/users/forgot-password
 * Generates a reset token, stores it on the user, and sends an email.
 * Always returns 200 to avoid email enumeration.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond with success to prevent email enumeration
  if (!user) {
    logger.log("[ForgotPassword] No user found for:", email);
    return res.status(200).json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  }

  // Social-only accounts can't reset a password
  if (user.socialAccounts?.length > 0 && !user.password) {
    logger.log("[ForgotPassword] Social-only account:", email);
    return res.status(200).json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Build reset URL
  const clientUrl =
    process.env.CLIENT_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
    logger.log("[ForgotPassword] Reset email sent for:", email);
  } catch (err) {
    logger.error("[ForgotPassword] Failed to send email:", err);
    // Still log the link so developers can use it
    logger.log("[ForgotPassword] Reset link (manual):", resetUrl);
  }

  return res.status(200).json({
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
});

/**
 * POST /api/users/reset-password/:token
 * Validates the token and sets a new password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ error: PASSWORD_RULES });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  // Hash and save the new password
  user.password = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  await logActivity({
    req,
    action: "user.password_reset",
    entityType: "User",
    entityId: user._id,
    metadata: { email: user.email },
  });

  logger.log("[ResetPassword] Password reset successful for:", user.email);
  return res
    .status(200)
    .json({ message: "Password has been reset successfully" });
});
