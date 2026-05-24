/**
 * Location & Group Async Thunks
 * Handles location sharing and group management API calls
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

// ============ LOCATION THUNKS ============

/**
 * Fetch nearby users within a certain radius
 */
export const fetchNearbyUsers = createAsyncThunk(
  "location/fetchNearby",
  async ({ latitude, longitude, radius = 5000 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/location/nearby`, {
        params: { latitude, longitude, radius },
      });

      // Server returns { success, count, users: [...] }
      const data = response.data.users || response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch nearby users",
      );
    }
  },
);

/**
 * Update user location
 */
export const updateUserLocation = createAsyncThunk(
  "location/update",
  async ({ userId, latitude, longitude }, { rejectWithValue }) => {
    try {
      // Backend expects coordinates as [longitude, latitude]
      const response = await api.post(`/api/location/update`, {
        userId,
        coordinates: [longitude, latitude],
      });

      // Server returns user object with location.coordinates: [lng, lat]
      // Normalize to { latitude, longitude } for Redux slice
      const data = response.data.data || response.data;
      const coords = data?.location?.coordinates;
      return {
        latitude: coords ? coords[1] : latitude,
        longitude: coords ? coords[0] : longitude,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update location",
      );
    }
  },
);

/**
 * Start location sharing
 */
export const startLocationSharing = createAsyncThunk(
  "location/startSharing",
  async ({ userId, latitude, longitude }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/location/start`, { userId });

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to start location sharing",
      );
    }
  },
);

/**
 * Stop location sharing
 */
export const stopLocationSharing = createAsyncThunk(
  "location/stopSharing",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/location/stop`, { userId });

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to stop location sharing",
      );
    }
  },
);

/**
 * Fetch user location history
 */
export const fetchLocationHistory = createAsyncThunk(
  "location/fetchHistory",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/location/history/${userId}`);

      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch location history",
      );
    }
  },
);

// ============ GROUP THUNKS ============

/**
 * Fetch all groups
 */
export const fetchGroups = createAsyncThunk(
  "group/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/groups`);

      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch groups",
      );
    }
  },
);

/**
 * Fetch a specific group by ID
 */
export const fetchGroupById = createAsyncThunk(
  "group/fetchById",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/groups/${groupId}`);

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch group",
      );
    }
  },
);

/**
 * Create a new group
 */
export const createGroup = createAsyncThunk(
  "group/create",
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/groups`, groupData);

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create group",
      );
    }
  },
);

/**
 * Update a group
 */
export const updateGroup = createAsyncThunk(
  "group/update",
  async ({ groupId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/groups/${groupId}`, updates);

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update group",
      );
    }
  },
);

/**
 * Add member to group
 */
export const addGroupMember = createAsyncThunk(
  "group/addMember",
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/members`, {
        memberId,
      });

      return { groupId, memberId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add member",
      );
    }
  },
);

/**
 * Remove member from group
 */
export const removeGroupMember = createAsyncThunk(
  "group/removeMember",
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/api/groups/${groupId}/members/${memberId}`,
      );

      return { groupId, memberId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove member",
      );
    }
  },
);

/**
 * Delete a group
 */
export const deleteGroup = createAsyncThunk(
  "group/delete",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/groups/${groupId}`);

      return groupId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete group",
      );
    }
  },
);
