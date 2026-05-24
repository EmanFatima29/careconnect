import { createSlice } from "@reduxjs/toolkit";

let nextId = 1;

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      const { type = "info", message, metadata } = action.payload;
      state.notifications.unshift({
        id: nextId++,
        type,
        message,
        metadata,
        timestamp: Date.now(),
        read: false,
        dismissed: false,
      });
      state.unreadCount += 1;
      // Cap at 100 entries
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    dismissNotification: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.dismissed) {
        notif.dismissed = true;
        if (!notif.read) {
          notif.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    markRead: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  dismissNotification,
  markRead,
  markAllRead,
  clearAll,
} = notificationSlice.actions;

export default notificationSlice.reducer;
