// redux/chatSlice.js — Local-First Pattern
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchChats,
  restoreCachedChats,
  fetchChatById,
  createChat,
  getOrCreateChat,
  markChatRead,
  deleteChat,
} from "./thunks/chatThunks";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    currentChat: null,
    loading: false,
    syncing: false, // true while background sync is in progress
    restoredFromCache: false,
    error: null,
    success: false,
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    clearCurrentChat: (state) => {
      state.currentChat = null;
    },
    clearError: (state) => {
      state.error = null;
      state.success = false;
    },
    // Real-time chat list update (socket-driven)
    updateChatInList: (state, action) => {
      const { chatId, updates } = action.payload;
      const idx = state.chats.findIndex((c) => c._id === chatId);
      if (idx !== -1) {
        state.chats[idx] = { ...state.chats[idx], ...updates };
        // Move to top
        const [updated] = state.chats.splice(idx, 1);
        state.chats.unshift(updated);
      }
    },
  },
  extraReducers: (builder) => {
    // Restore from localStorage cache (warm startup — instant)
    builder
      .addCase(restoreCachedChats.fulfilled, (state, action) => {
        const { chats, isStale } = action.payload;
        if (chats.length > 0 && state.chats.length === 0) {
          state.chats = chats;
          state.restoredFromCache = true;
        }
        // If stale, the caller should also dispatch fetchChats({ force: true })
      });

    // Fetch All Chats (API sync — may run in background after cache restore)
    builder
      .addCase(fetchChats.pending, (state) => {
        // If we already have cached data, show syncing indicator instead of loading
        if (state.restoredFromCache && state.chats.length > 0) {
          state.syncing = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.syncing = false;
        state.chats = action.payload;
        state.success = true;
        state.restoredFromCache = false; // Now we have fresh data
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.syncing = false;
        state.error = action.payload;
        // Don't wipe cached chats on network error — keep showing stale data
        if (!state.restoredFromCache) {
          state.chats = [];
        }
      });

    // Fetch Chat by ID
    builder
      .addCase(fetchChatById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat = action.payload;
        state.success = true;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Chat
    builder
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        const existing = state.chats.find((c) => c._id === action.payload._id);
        if (!existing) {
          state.chats.unshift(action.payload); // Add to top
        }
        state.currentChat = action.payload;
        state.success = true;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get or Create Chat
    builder
      .addCase(getOrCreateChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateChat.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat = action.payload.chat;
        state.success = true;
      })
      .addCase(getOrCreateChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark Chat Read
    builder
      .addCase(markChatRead.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (chat) {
          chat.unreadMessages = chat.unreadMessages || {};
          chat.unreadMessages[action.payload.userId] = 0;
        }
        state.success = true;
      })
      .addCase(markChatRead.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Chat
    builder
      .addCase(deleteChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = state.chats.filter((c) => c._id !== action.payload);
        if (state.currentChat?._id === action.payload) {
          state.currentChat = null;
        }
        state.success = true;
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentChat, clearCurrentChat, clearError, updateChatInList } =
  chatSlice.actions;
export default chatSlice.reducer;
