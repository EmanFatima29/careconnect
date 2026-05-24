import { asyncHandler } from "../middleware/errorHandler.js";
import LocationService from "../services/locationService.js";
import User from "../models/userModel.js";

export const getLocationHistory = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const callerId = req.user?.userId;
    const callerRole = req.user?.roles;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Authorization: only allow own data or admin access
    const isAdmin = callerRole === "admin" || callerRole === "superadmin";
    if (!isAdmin && String(callerId) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized to view this user's location history" });
    }

    const user = await User.findById(userId).select(
      "location name email profilePic",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      userId,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      location: user.location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export const startSharing = asyncHandler(async (req, res) => {
  // Derive userId from verified JWT — never trust the request body for identity
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const user = await LocationService.startLocationSharing(userId);
    res.json({
      success: true,
      isSharing: user.settings.locationSharing,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export const stopSharing = asyncHandler(async (req, res) => {
  try {
    // Derive userId from verified JWT
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await LocationService.stopLocationSharing(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export const updateLocation = asyncHandler(async (req, res) => {
  // Derive userId from verified JWT — never trust userId from request body
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { coordinates } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: "Invalid coordinates format" });
    }

    const updatedUser = await LocationService.updateUserLocation(
      userId,
      coordinates,
    );

    res.json(updatedUser);
  } catch (error) {
    if (error.message.includes("disabled in settings")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export const getNearbyUsers = asyncHandler(async (req, res) => {
  try {
    const radius = parseInt(req.query.radius) || 1000;
    // Always require JWT-verified userId — never trust query params for identity
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const nearbyUsers = await LocationService.getNearbyUsers(userId, radius);
    res.json({
      success: true,
      count: nearbyUsers.length,
      users: nearbyUsers.map((user) => ({
        _id: user._id,
        id: user._id,
        name: user.name,
        coordinates: user.location.coordinates,
        profilePic: user.profilePic,
        status: user.status,
        lastSeen: user.lastSeen,
        roles: user.roles || "patient",
        ratingSummary: user.ratingSummary || { averageRating: 0, totalRatings: 0 },
        doctorProfile: user.roles === "doctor" ? {
          specialty: user.doctorProfile?.specialty || null,
          verified: user.doctorProfile?.verified || false,
        } : undefined,
        pharmacyProfile: user.roles === "pharmacy" ? {
          operatingHours: user.pharmacyProfile?.operatingHours || {},
          verified: user.pharmacyProfile?.verified || false,
        } : undefined,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
