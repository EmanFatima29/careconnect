/**
 * Redux Slice for Analytics State Management
 * Location: /client/src/utils/redux/analyticsSlice.js
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import analyticsApi from "@/lib/analyticsApi";

// ============================================================
// ASYNC THUNKS
// ============================================================

export const fetchAnalyticsMetrics = createAsyncThunk(
  "analytics/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsApi.getMetrics();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchUserActivity = createAsyncThunk(
  "analytics/fetchUserActivity",
  async (days = 7, { rejectWithValue }) => {
    try {
      const data = await analyticsApi.getUserActivity(days);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMessageStats = createAsyncThunk(
  "analytics/fetchMessageStats",
  async (days = 7, { rejectWithValue }) => {
    try {
      const data = await analyticsApi.getMessageStats(days);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchLocationStats = createAsyncThunk(
  "analytics/fetchLocationStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsApi.getLocationStats();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchGroupStats = createAsyncThunk(
  "analytics/fetchGroupStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsApi.getGroupStats();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  metrics: {
    totalUsers: 0,
    onlineUsers: 0,
    messageCount: 0,
    groupCount: 0,
    sharingLocation: 0,
  },
  userActivity: [],
  messageStats: [],
  locationStats: [],
  groupStats: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// ============================================================
// SLICE DEFINITION
// ============================================================

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    // Synchronous actions
    updateMetrics: (state, action) => {
      state.metrics = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateUserActivity: (state, action) => {
      state.userActivity = action.payload;
    },
    updateMessageStats: (state, action) => {
      state.messageStats = action.payload;
    },
    updateLocationStats: (state, action) => {
      state.locationStats = action.payload;
    },
    updateGroupStats: (state, action) => {
      state.groupStats = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Metrics
    builder
      .addCase(fetchAnalyticsMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAnalyticsMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // User Activity
    builder
      .addCase(fetchUserActivity.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.userActivity = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Message Stats
    builder
      .addCase(fetchMessageStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessageStats.fulfilled, (state, action) => {
        state.loading = false;
        state.messageStats = action.payload;
      })
      .addCase(fetchMessageStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Location Stats
    builder
      .addCase(fetchLocationStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.locationStats = action.payload;
      })
      .addCase(fetchLocationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Group Stats
    builder
      .addCase(fetchGroupStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroupStats.fulfilled, (state, action) => {
        state.loading = false;
        state.groupStats = action.payload;
      })
      .addCase(fetchGroupStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  updateMetrics,
  updateUserActivity,
  updateMessageStats,
  updateLocationStats,
  updateGroupStats,
  clearError,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
