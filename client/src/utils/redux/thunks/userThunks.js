import logger from "@/lib/logger";
/**
 * User Async Thunks
 * Handles all user-related API calls and state management
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/**
 * Fetch current user profile from session/token
 * Skips fetch if user is already loaded (pass { force: true } to override)
 */
export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/users/profile`);

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(response.data.message || "Failed to fetch user");
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch user",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { user } = getState();
      // Skip if already loaded and not in error state
      if (user.currentUser && !user.error) return false;
    },
  },
);

/**
 * Fetch user by email
 */
export const fetchUserByEmail = createAsyncThunk(
  "user/fetchByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await api.get(`/api/users/email/${encodedEmail}`);

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(response.data.message || "User not found");
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "User not found");
    }
  },
);

/**
 * Search users by query
 */
export const searchUsers = createAsyncThunk(
  "user/search",
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/users/search`, {
        params: { query },
      });

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(response.data.message || "Search failed");
      }

      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  },
);

/**
 * Update user profile
 */
export const updateUserProfile = createAsyncThunk(
  "user/update",
  async ({ email, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/users/${encodeURIComponent(email)}`,
        updates,
      );

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(response.data.message || "Update failed");
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  },
);

/**
 * Sign up new user
 */
export const signupUser = createAsyncThunk(
  "user/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/users`, userData);

      if (!response.data.success && response.data.statusCode !== 201) {
        return rejectWithValue(response.data.message || "Signup failed");
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Signup failed",
      );
    }
  },
);

/**
 * Log user offline
 */
export const setUserOffline = createAsyncThunk(
  "user/setOffline",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/users/status-offline`, userData);

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(
          response.data.message || "Failed to set offline",
        );
      }

      return response.data.data || response.data;
    } catch (error) {
      // Don't reject, this endpoint uses sendBeacon
      logger.log(
        "Offline status update (may be from sendBeacon):",
        error.message,
      );
      return null;
    }
  },
);

/**
 * Fetch all users (for admin or specific cases)
 * Skips fetch if users are already loaded (pass { force: true } to override)
 */
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/users`);

      if (!response.data.success && response.data.statusCode !== 200) {
        return rejectWithValue(
          response.data.message || "Failed to fetch users",
        );
      }

      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { user } = getState();
      if (user.allUsers.length > 0 && !user.error) return false;
    },
  },
);
