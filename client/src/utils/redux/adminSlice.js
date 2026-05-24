/**
 * Admin Slice
 * Manages admin-only state: platform stats, activity logs, user management.
 */

import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserStats,
  fetchPrescriptionStats,
  fetchChatStats,
  fetchActivityLogs,
  fetchAllUsersAdmin,
  deleteUserAdmin,
  updateUserAdmin,
} from "./thunks/adminThunks";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    // ── Statistics ────────────────────────────────────
    userStats: null,
    prescriptionStats: null,
    chatStats: null,

    // ── Activity Logs (paginated) ────────────────────
    activityLogs: {
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    },

    // ── User Management ──────────────────────────────
    users: [],

    // ── Meta ─────────────────────────────────────────
    loading: false,
    error: null,
    lastUpdated: null,
  },

  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    resetAdminState: () => adminSlice.getInitialState(),
  },

  extraReducers: (builder) => {
    // ── User Statistics ──────────────────────────────
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Prescription Statistics ──────────────────────────────
    builder
      .addCase(fetchPrescriptionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptionStats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPrescriptionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Chat Statistics ──────────────────────────────
    builder
      .addCase(fetchChatStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatStats.fulfilled, (state, action) => {
        state.loading = false;
        state.chatStats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchChatStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Activity Logs ────────────────────────────────
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = {
          items: action.payload.items || [],
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
        };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Fetch All Users (Admin) ──────────────────────
    builder
      .addCase(fetchAllUsersAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsersAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.users = Array.isArray(action.payload) ? action.payload : [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAllUsersAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Delete User ──────────────────────────────────
    builder
      .addCase(deleteUserAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((u) => u._id !== action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteUserAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Update User ──────────────────────────────────
    builder
      .addCase(updateUserAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.users.findIndex((u) => u._id === updated?._id);
        if (idx !== -1) state.users[idx] = updated;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateUserAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError, resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
