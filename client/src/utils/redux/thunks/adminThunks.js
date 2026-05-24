/**
 * Admin Async Thunks
 * Handles all admin-only API calls (stats, logs, user management).
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "@/lib/adminApi";

// ── Statistics ─────────────────────────────────────────

/**
 * Fetch user statistics (totals, by role, by status, new users).
 * @param {{ from?: string, to?: string }} [dateRange]
 */
export const fetchUserStats = createAsyncThunk(
  "admin/fetchUserStats",
  async (dateRange = {}, { rejectWithValue }) => {
    try {
      return await adminApi.getUserStats(dateRange);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user statistics",
      );
    }
  },
);

/**
 * Fetch prescription summaries (totals, by status, area, top prescriptions).
 * @param {{ from?: string, to?: string }} [dateRange]
 */
export const fetchPrescriptionStats = createAsyncThunk(
  "admin/fetchPrescriptionStats",
  async (dateRange = {}, { rejectWithValue }) => {
    try {
      return await adminApi.getPrescriptionStats(dateRange);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch prescription statistics",
      );
    }
  },
);

/**
 * Fetch chat/message usage stats.
 * @param {{ from?: string, to?: string }} [dateRange]
 */
export const fetchChatStats = createAsyncThunk(
  "admin/fetchChatStats",
  async (dateRange = {}, { rejectWithValue }) => {
    try {
      return await adminApi.getChatStats(dateRange);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chat statistics",
      );
    }
  },
);

// ── Activity Logs ──────────────────────────────────────

/**
 * Fetch paginated/filtered activity logs.
 * @param {{ page?: number, limit?: number, action?: string, entityType?: string, status?: string, actorId?: string }} [params]
 */
export const fetchActivityLogs = createAsyncThunk(
  "admin/fetchActivityLogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await adminApi.getActivityLogs(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch activity logs",
      );
    }
  },
);

// ── User Management ────────────────────────────────────

/**
 * Fetch all users (admin view).
 */
export const fetchAllUsersAdmin = createAsyncThunk(
  "admin/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getAllUsers();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

/**
 * Delete a user by ID.
 * @param {string} userId
 */
export const deleteUserAdmin = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await adminApi.deleteUser(userId);
      return userId; // return ID for removal from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

/**
 * Update a user (admin can update any user).
 * @param {{ email: string, updates: Object }} payload
 */
export const updateUserAdmin = createAsyncThunk(
  "admin/updateUser",
  async ({ email, updates }, { rejectWithValue }) => {
    try {
      return await adminApi.updateUser(email, updates);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);
