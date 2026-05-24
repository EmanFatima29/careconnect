import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import userReducer from "./userSlice";
import chatReducer from "./chatSlice";
import messageReducer from "./messageSlice";
import groupReducer from "./groupSlice";
import layoutSlice from "./layoutSlice";
import analyticsReducer from "./analyticsSlice";
import prescriptionReducer from "./prescriptionSlice";
import adminReducer from "./adminSlice";
import friendReducer from "./friendSlice";
import notificationReducer from "./notificationSlice";

// Only use localStorage on client
const createNoopStorage = () => ({
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
});

const storage =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default
    : createNoopStorage();

const persistConfig = {
  key: "careconnect",
  storage,
  // Only persist slices that benefit from offline caching
  whitelist: ["user", "chat", "prescription", "group", "friend", "layout"],
  // Skip large/transient slices: message, analytics, admin
};

const rootReducer = combineReducers({
  layout: layoutSlice,
  user: userReducer,
  chat: chatReducer,
  message: messageReducer,
  group: groupReducer,
  analytics: analyticsReducer,
  prescription: prescriptionReducer,
  admin: adminReducer,
  friend: friendReducer,
  notification: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
