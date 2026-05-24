import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/**
 * Fetch current user's friends list
 */
export const fetchFriends = createAsyncThunk(
  "friend/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/friends");
      return response.data.friends || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch friends",
      );
    }
  },
);

/**
 * Fetch pending friend requests
 */
export const fetchFriendRequests = createAsyncThunk(
  "friend/fetchRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/friends/requests");
      return response.data.requests || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch friend requests",
      );
    }
  },
);

/**
 * Send a friend request
 */
export const sendFriendRequest = createAsyncThunk(
  "friend/sendRequest",
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/friends/request", { recipientId });
      return { recipientId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to send friend request",
      );
    }
  },
);

/**
 * Accept a friend request
 */
export const acceptFriendRequest = createAsyncThunk(
  "friend/acceptRequest",
  async (senderId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/friends/accept", { senderId });
      return { senderId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to accept friend request",
      );
    }
  },
);

/**
 * Decline a friend request
 */
export const declineFriendRequest = createAsyncThunk(
  "friend/declineRequest",
  async (senderId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/friends/decline", { senderId });
      return { senderId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to decline friend request",
      );
    }
  },
);

/**
 * Remove a friend
 */
export const removeFriend = createAsyncThunk(
  "friend/remove",
  async (friendId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/friends/${friendId}`);
      return friendId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to remove friend",
      );
    }
  },
);
