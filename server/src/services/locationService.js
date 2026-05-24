import logger from "../../lib/logger.js";
import User from "../models/userModel.js";
import { emitToUser } from "../../lib/socketHandler.js";
import mongoose from "mongoose";
class LocationService {
  static async startLocationSharing(userId) {
    try {
      // First enable sharing in settings
      logger.log("userId received from startSharing:", userId);

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "settings.locationSharing": true,
            // lastSeen: new Date(),
            "location.lastSeen": new Date(),
          },
        },
        { new: true }
      ).select("settings.locationSharing");

      return user;
    } catch (error) {
      throw new Error(`Failed to enable location sharing: ${error.message}`);
    }
  }

  static async stopLocationSharing(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    let coordinates = [0, 0];
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "settings.locationSharing": false,
          "location.coordinates": coordinates,
          "location.lastSeen": new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!user) {
      throw new Error("User not found");
    }

    emitToUser(userId, "location-sharing-changed", {
      userId,
      isSharing: false,
    });

    return { success: true };
  }

  static async updateUserLocation(userId, coordinates) {
    logger.log(
      "Updating userId and Coordinates in service:",
      userId,
      coordinates
    );

    try {
      const user = await User.findById(userId).select(
        "settings.locationSharing"
      );

      if (!user) {
        throw new Error("User not found");
      }
      if (!user.settings.locationSharing) {
        throw new Error("Location sharing is disabled in settings");
      }

      // Optional: Validate coordinates format
      if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
      ) {
        throw new Error("Invalid coordinates format");
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "location.coordinates": coordinates,
            "location.lastSeen": new Date(),
          },
        },
        { upsert: true, new: true }
      ).select("name email location settings.locationSharing");

      emitToUser(userId, "location-updated", {
        userId,
        coordinates,
        timestamp: new Date(),
      });

      return updatedUser;
    } catch (error) {
      throw new Error(`Location update failed: ${error.message}`);
    }
  }

  static async getNearbyUsers(userId, radius = 1000) {
    try {
      const currentUser = await User.findById(userId).select(
        "location.coordinates settings.visibleRange"
      );

      if (!currentUser?.location?.coordinates) {
        throw new Error("Your location is not available");
      }

      const searchRadius = Math.min(
        radius,
        currentUser.settings?.visibleRange || 1000
      );

      return await User.find({
        _id: { $ne: userId },
        "location.coordinates": {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: currentUser.location.coordinates,
            },
            $maxDistance: searchRadius,
          },
        },
        "settings.locationSharing": true,
        "settings.allowMessagesFrom": {
          $in: ["everyone", "friends"], // Respect privacy settings
        },
      })
        .select("name location profilePic status lastSeen roles ratingSummary doctorProfile pharmacyProfile")
        .lean();
    } catch (error) {
      throw new Error(`Failed to find nearby users: ${error.message}`);
    }
  }

  static async getLiveNearbyUsers(userId, radius = 1000) {
    try {
      const nearbyUsers = await this.getNearbyUsers(userId, radius);

      // Filter to only users who are currently online
      const liveUsers = nearbyUsers.filter((user) => {
        const lastSeenTime = new Date(user.lastSeen).getTime();
        return (
          user.status === "online" &&
          user.settings?.locationSharing &&
          !isNaN(lastSeenTime) &&
          Date.now() - lastSeenTime < 5 * 60 * 1000
        );
      });
      return liveUsers;
    } catch (error) {
      throw new Error(`Failed to find live nearby users: ${error.message}`);
    }
  }
}

export default LocationService;
