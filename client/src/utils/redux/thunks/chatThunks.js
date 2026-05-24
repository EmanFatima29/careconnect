/**
 * Chat Async Thunks — Local-First Pattern
 *
 * Flow:
 * 1. Warm startup: restore cached chat list from localStorage → render immediately
 * 2. Background sync: fetch fresh data from API → update Redux + cache
 * 3. Socket-driven updates: new messages update both Redux and cache in real-time
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import {
  getCachedChats,
  setCachedChats,
} from "@/lib/chatCache";

/**
 * Fetch all chats for current user.
 * Returns cached data immediately, then syncs from server.
 */
export const fetchChats = createAsyncThunk(
  "chat/fetchAll",
  async (arg, { rejectWithValue, getState }) => {
    try {
      const response = await api.get(`/api/chats`);
      const data = response.data.data || response.data;
      const chats = Array.isArray(data) ? data : [];

      // Persist to local cache for warm startup next time
      const userId = getState().user?.currentUser?._id;
      if (userId) {
        setCachedChats(userId, chats);
      }

      return chats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chats",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { chat } = getState();
      // Skip if we already have chats loaded and no error
      if (chat.chats.length > 0 && !chat.error) return false;
    },
  },
);

/**
 * Restore cached chat list from localStorage (synchronous warm startup).
 * Called before fetchChats to render instantly.
 */
export const restoreCachedChats = createAsyncThunk(
  "chat/restoreCached",
  async (userId) => {
    const { chats, isStale } = getCachedChats(userId);
    return { chats, isStale };
  },
);

/**
 * Fetch a specific chat by ID
 */
export const fetchChatById = createAsyncThunk(
  "chat/fetchById",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/chats/${chatId}`);
      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chat",
      );
    }
  },
);

/**
 * Create a new chat
 */
export const createChat = createAsyncThunk(
  "chat/create",
  async (chatData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/chats`, chatData);
      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create chat",
      );
    }
  },
);

/**
 * Get or create a chat with a specific user
 */
export const getOrCreateChat = createAsyncThunk(
  "chat/getOrCreate",
  async ({ currentUserId, searchedUserId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/chats/get-or-create-chat`, {
        currentUserId,
        searchedUserId,
      });
      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create chat",
      );
    }
  },
);

/**
 * Mark a chat as read
 */
export const markChatRead = createAsyncThunk(
  "chat/markRead",
  async ({ chatId, userId }, { rejectWithValue }) => {
    try {
      await api.post(`/api/chats/${chatId}/mark-read`, { userId });
      return { chatId, userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark chat as read",
      );
    }
  },
);

/**
 * Delete a chat
 */
export const deleteChat = createAsyncThunk(
  "chat/delete",
  async (chatId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/chats/${chatId}`);
      return chatId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete chat",
      );
    }
  },
);
