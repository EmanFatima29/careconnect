/**
 * Message Async Thunks — Local-First Pattern
 *
 * Flow:
 * 1. Opening a chat: restore cached messages from localStorage → render instantly
 * 2. Incremental sync: fetch only messages newer than the latest cached one
 * 3. Socket-driven: new messages arrive via socket → added to Redux + cache
 * 4. Lazy media: thumbnails render immediately; full media loads on demand
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import {
  getCachedMessages,
  setCachedMessages,
  appendCachedMessage,
  removeCachedMessage,
} from "@/lib/chatCache";

/**
 * Restore cached messages from localStorage (instant render).
 */
export const restoreCachedMessages = createAsyncThunk(
  "message/restoreCached",
  async (chatId) => {
    const { messages, lastTimestamp } = getCachedMessages(chatId);
    return { messages, lastTimestamp, chatId };
  },
);

/**
 * Fetch messages for a specific chat.
 *
 * Supports three modes:
 * - Full fetch:        fetchMessages({ chatId })
 * - Pagination:        fetchMessages({ chatId, before: <messageId> })
 * - Incremental sync:  fetchMessages({ chatId, since: <ISO timestamp> })
 */
export const fetchMessages = createAsyncThunk(
  "message/fetchByChat",
  async ({ chatId, before, since, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit });
      if (since) params.set("since", since);
      else if (before) params.set("before", before);

      const response = await api.get(`/api/messages/chat/${chatId}?${params}`);
      const payload = response.data;

      const messages = Array.isArray(payload)
        ? payload
        : payload.messages || [];
      const hasMore = payload.hasMore || false;

      // Persist to local cache
      if (!before && !since) {
        // Full fetch — replace cache
        setCachedMessages(chatId, messages);
      } else if (since && messages.length > 0) {
        // Incremental sync — append new messages to existing cache
        const { messages: cached } = getCachedMessages(chatId);
        const existingIds = new Set(cached.map((m) => m._id));
        const newMsgs = messages.filter((m) => !existingIds.has(m._id));
        if (newMsgs.length > 0) {
          setCachedMessages(chatId, [...cached, ...newMsgs]);
        }
      }

      return { messages, hasMore, isSync: !!since, chatId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages",
      );
    }
  },
);

/**
 * Create a new message.
 * Supports optional file attachment via messageData.file (File object).
 */
export const createMessage = createAsyncThunk(
  "message/create",
  async (messageData, { rejectWithValue }) => {
    try {
      let body;
      let config;

      if (messageData.file) {
        const formData = new FormData();
        formData.append("media", messageData.file);
        formData.append("chatId", messageData.chatId);
        formData.append("senderId", messageData.senderId);
        formData.append("messageType", messageData.messageType || "file");
        if (messageData.content)
          formData.append("content", messageData.content);
        if (messageData.replyTo)
          formData.append("replyTo", messageData.replyTo);
        if (messageData.receiverIds) {
          formData.append(
            "receiverIds",
            JSON.stringify(messageData.receiverIds),
          );
        }
        body = formData;
        config = { headers: { "Content-Type": "multipart/form-data" } };
      } else {
        body = messageData;
        config = undefined;
      }

      const response = await api.post(`/api/messages`, body, config);
      const data = response.data.data || response.data;

      // Persist to local cache
      if (data?._id && messageData.chatId) {
        appendCachedMessage(messageData.chatId, data);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message",
      );
    }
  },
);

/**
 * Delete a message
 */
export const deleteMessage = createAsyncThunk(
  "message/delete",
  async ({ messageId, chatId }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/messages/${messageId}`);

      // Remove from local cache
      if (chatId) {
        removeCachedMessage(chatId, messageId);
      }

      return messageId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete message",
      );
    }
  },
);

/**
 * Edit a message
 */
export const editMessage = createAsyncThunk(
  "message/edit",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/messages/${messageId}`, { content });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to edit message",
      );
    }
  },
);
