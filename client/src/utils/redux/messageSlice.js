// redux/messageSlice.js — Local-First Pattern
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMessages,
  restoreCachedMessages,
  createMessage,
  deleteMessage,
  editMessage,
} from "./thunks/messageThunks";
import {
  appendCachedMessage,
  updateCachedMessage,
} from "@/lib/chatCache";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    currentChatId: null, // track which chat's messages are loaded
    hasMore: false,
    loading: false,
    syncing: false, // background incremental sync in progress
    restoredFromCache: false,
    error: null,
    success: false,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      // Prevent duplicates
      const messageExists = state.messages.some(
        (msg) => msg._id === action.payload._id,
      );
      if (!messageExists) {
        state.messages.push(action.payload);
        // Also persist to cache
        if (state.currentChatId) {
          appendCachedMessage(state.currentChatId, action.payload);
        }
      }
    },
    updateMessage: (state, action) => {
      const { messageId, content, editedAt } = action.payload;
      const idx = state.messages.findIndex((m) => m._id === messageId);
      if (idx !== -1) {
        state.messages[idx].content = content;
        state.messages[idx].edited = true;
        state.messages[idx].editedAt = editedAt;
        // Also update cache
        if (state.currentChatId) {
          updateCachedMessage(state.currentChatId, messageId, {
            content,
            edited: true,
            editedAt,
          });
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentChatId = null;
      state.restoredFromCache = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Restore from localStorage (instant render)
    builder.addCase(restoreCachedMessages.fulfilled, (state, action) => {
      const { messages, chatId } = action.payload;
      if (messages.length > 0) {
        state.messages = messages;
        state.currentChatId = chatId;
        state.restoredFromCache = true;
        state.loading = false;
      }
    });

    // Fetch Messages (full fetch or incremental sync)
    builder
      .addCase(fetchMessages.pending, (state) => {
        if (state.restoredFromCache && state.messages.length > 0) {
          state.syncing = true; // background sync
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.syncing = false;
        const { messages, hasMore, isSync, chatId } = action.payload;

        if (isSync) {
          // Incremental sync — merge new messages into existing
          const existingIds = new Set(state.messages.map((m) => m._id));
          const newMsgs = messages.filter((m) => !existingIds.has(m._id));
          if (newMsgs.length > 0) {
            state.messages = [...state.messages, ...newMsgs];
          }
        } else {
          // Full fetch — replace
          state.messages = messages;
        }

        state.currentChatId = chatId || state.currentChatId;
        state.hasMore = hasMore;
        state.success = true;
        state.restoredFromCache = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.syncing = false;
        state.error = action.payload;
        // Don't wipe cached messages on network error
        if (!state.restoredFromCache) {
          state.messages = [];
        }
      });

    // Create Message
    builder
      .addCase(createMessage.fulfilled, (state, action) => {
        const messageExists = state.messages.some(
          (msg) => msg._id === action.payload._id,
        );
        if (!messageExists) {
          state.messages.push(action.payload);
        }
        state.success = true;
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter((m) => m._id !== action.payload);
        state.success = true;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Edit Message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.messages.findIndex((m) => m._id === updated._id);
        if (idx !== -1) state.messages[idx] = updated;
        state.success = true;
      })
      .addCase(editMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setMessages,
  addMessage,
  updateMessage,
  clearMessages,
  clearError,
} = messageSlice.actions;
export default messageSlice.reducer;
