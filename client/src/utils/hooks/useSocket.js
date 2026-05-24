import logger from "@/lib/logger";
/**
 * Custom Hooks: Socket Management
 * Handles socket.io connection, listeners, and event handlers
 * Location: /client/src/utils/hooks/useSocket.js
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import socket from "@/lib/socket";
import {
  setupAnalyticsListeners,
  removeAnalyticsListeners,
} from "@/lib/socketAnalytics";

/**
 * Main Socket Hook - Central socket management
 */
export const useSocket = () => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [isConnected, setIsConnected] = useState(false);
  const socketStateRef = useRef({ connected: false, listeners: [] });

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!currentUser?._id || !socket) {
      logger.warn("[Socket] Missing user or socket instance");
      return false;
    }

    // Don't connect without a valid token - this prevents auth errors
    const token = session?.accessToken;
    if (!token) {
      logger.warn("[Socket] Missing access token, deferring connection");
      return false;
    }

    try {
      if (!socket.connected) {
        // Set user ID in query params (informational) and pass JWT in auth (verified server-side)
        socket.io.opts.query = { userId: currentUser._id };
        socket.auth = { token };
        socket.connect();
        logger.log("[Socket] Connection initialized with token");
      }
      return true;
    } catch (error) {
      logger.error("[Socket] Initialization error:", error);
      return false;
    }
  }, [currentUser?._id, session?.accessToken]);

  // Register event listener with cleanup
  const on = useCallback((event, callback) => {
    if (!socket) {
      logger.warn("[Socket] Socket not available");
      return;
    }

    socket.on(event, callback);
    socketStateRef.current.listeners.push({ event, callback });
    logger.log(`[Socket] Registered listener: ${event}`);

    return () => {
      socket.off(event, callback);
      socketStateRef.current.listeners =
        socketStateRef.current.listeners.filter(
          (listener) =>
            listener.event !== event || listener.callback !== callback,
        );
    };
  }, []);

  // Emit event to server
  const emit = useCallback((event, ...args) => {
    if (!socket || !socket.connected) {
      logger.warn("[Socket] Socket not connected, cannot emit:", event);
      return false;
    }

    try {
      socket.emit(event, ...args);
      logger.log(`[Socket] Emitted: ${event}`, ...args);
      return true;
    } catch (error) {
      logger.error(`[Socket] Error emitting ${event}:`, error);
      return false;
    }
  }, []);

  // Join room
  const joinRoom = useCallback(
    (roomId) => {
      return emit("joinRoom", roomId);
    },
    [emit],
  );

  // Leave room
  const leaveRoom = useCallback(
    (roomId) => {
      return emit("leaveRoom", roomId);
    },
    [emit],
  );

  // Cleanup listeners
  const cleanup = useCallback(() => {
    socketStateRef.current.listeners.forEach(({ event, callback }) => {
      socket.off(event, callback);
    });
    socketStateRef.current.listeners = [];
    logger.log("[Socket] Listeners cleaned up");
  }, []);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket && socket.connected) {
      cleanup();
      socket.disconnect();
      logger.log("[Socket] Disconnected");
    }
  }, [cleanup]);

  // Keep socket auth token in sync with session — reconnect if token changes
  const prevTokenRef = useRef(null);
  useEffect(() => {
    const token = session?.accessToken;
    if (!token || !socket) return;

    // Always keep socket.auth current
    socket.auth = { token };

    // If token changed while connected, force reconnect with the new token
    if (
      prevTokenRef.current &&
      prevTokenRef.current !== token &&
      socket.connected
    ) {
      logger.log("[Socket] Token refreshed — reconnecting with new token");
      socket.disconnect();
      socket.connect();
    }
    prevTokenRef.current = token;
  }, [session?.accessToken]);

  // Setup connection handlers
  useEffect(() => {
    if (!currentUser?._id) return;

    const handleConnect = () => {
      socketStateRef.current.connected = true;
      setIsConnected(true);
      logger.log("[Socket] Connected");
    };

    const handleDisconnect = () => {
      socketStateRef.current.connected = false;
      setIsConnected(false);
      logger.log("[Socket] Disconnected");
    };

    const handleConnectError = (error) => {
      if (error.message === "timeout" || error.message?.includes("timeout")) {
        logger.warn("[Socket] Connection timeout detected");
      } else {
        logger.error("[Socket] Connection error:", error);
      }

      // If auth failed, update token before next reconnect attempt
      if (
        error.message === "Authentication required" ||
        error.message === "Authentication error"
      ) {
        const token = session?.accessToken;
        if (token) {
          logger.log("[Socket] Updating auth token for reconnection");
          socket.auth = { token };
        } else {
          logger.warn(
            "[Socket] No token available for reconnection - stopping reconnect",
          );
          socket.disconnect(); // Stop reconnect attempts without valid token
        }
      }
    };

    const handleError = (error) => {
      logger.error("[Socket] Error:", error);
    };

    initializeSocket();
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("error", handleError);
      cleanup();
    };
  }, [currentUser?._id, session?.accessToken, initializeSocket, cleanup]);

  return {
    socket,
    isConnected,
    on,
    emit,
    joinRoom,
    leaveRoom,
    cleanup,
    disconnect,
    initializeSocket,
  };
};

/**
 * Hook for integrating analytics socket listeners
 */
export const useAnalyticsSocket = () => {
  const socketHook = useSocket();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const notify = useCallback(
    (variant, message, key) => {
      // Only show errors/warnings as toasts — success updates are too noisy
      if (variant === "error" || variant === "warning") {
        enqueueSnackbar(message, { variant, key, autoHideDuration: 4000 });
      }
    },
    [enqueueSnackbar],
  );

  useEffect(() => {
    if (!socketHook.isConnected || !socket) return;

    // Setup analytics listeners with notify callback
    setupAnalyticsListeners(socket, dispatch, notify);

    return () => {
      removeAnalyticsListeners(socket);
    };
  }, [socketHook.isConnected, dispatch, notify]);

  return socketHook;
};

/**
 * Hook for joining a chat room
 */
export const useChatRoom = (chatId) => {
  const { joinRoom, leaveRoom, on, emit, isConnected } = useSocket();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!chatId || joinedRef.current) return;

    joinRoom(chatId);
    joinedRef.current = true;
    logger.log(`[ChatRoom] Joined room: ${chatId}`);

    return () => {
      leaveRoom(chatId);
      joinedRef.current = false;
      logger.log(`[ChatRoom] Left room: ${chatId}`);
    };
  }, [chatId, joinRoom, leaveRoom]);

  const sendMessage = useCallback(
    (messageData) => {
      return emit("sendMessage", { ...messageData, chatId });
    },
    [emit, chatId],
  );

  const broadcastTyping = useCallback(
    (senderId) => {
      return emit("Typing", { chatId, senderId });
    },
    [emit, chatId],
  );

  const broadcastStopTyping = useCallback(
    (senderId) => {
      return emit("Stop-typing", { chatId, senderId });
    },
    [emit, chatId],
  );

  return {
    sendMessage,
    broadcastTyping,
    broadcastStopTyping,
    on,
    isConnected,
  };
};

/**
 * Hook for location sharing
 */
export const useLocationSocket = (userId, radius = 1000) => {
  const { emit, on } = useSocket();

  const subscribeToNearby = useCallback(() => {
    return emit("subscribe-to-nearby", userId, radius);
  }, [emit, userId, radius]);

  useEffect(() => {
    subscribeToNearby();

    return () => {
      emit("unsubscribe-from-nearby", userId);
    };
  }, [userId, radius, subscribeToNearby, emit]);

  return { subscribeToNearby, on };
};

/**
 * Hook for old status tracking
 */
export const useSocketForUpdatingStatus = () => {
  const { data: session } = useSession();
  const socketRef = useRef(null);
  const socketHook = useSocket();

  useEffect(() => {
    if (session?.user?.id && socketHook.isConnected) {
      socketRef.current = socketHook.socket;
    }
  }, [session?.user?.id, socketHook]);

  return socketRef.current;
};

export default useSocket;
