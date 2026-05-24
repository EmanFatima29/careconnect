import { useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import socket from "@/lib/socket";
import {
  setupSocketEventHandlers,
  removeSocketEventHandlers,
} from "@/utils/socketNotificationHandler";
import { addNotification } from "@/utils/redux/notificationSlice";
import logger from "@/lib/logger";

/**
 * Global hook that wires socket event handlers to notistack toasts
 * and persists notifications in the Redux store.
 * Must be called inside SnackbarProvider and Redux Provider.
 */
export function useGlobalSocketNotifications() {
  const { status } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const setupDoneRef = useRef(false);

  // Bridge object that setupSocketEventHandlers expects:
  // each handler calls notify?.success(msg, opts) / notify?.error(msg, opts) etc.
  const notify = useCallback(
    () => ({
      success: (message, opts) => {
        enqueueSnackbar(message, { variant: "success", autoHideDuration: opts?.autoHideDuration ?? 3000 });
        dispatch(addNotification({ type: "success", message }));
      },
      error: (message, opts) => {
        enqueueSnackbar(message, { variant: "error", autoHideDuration: opts?.autoHideDuration ?? 4000 });
        dispatch(addNotification({ type: "error", message }));
      },
      warning: (message, opts) => {
        enqueueSnackbar(message, { variant: "warning", autoHideDuration: opts?.autoHideDuration ?? 4000 });
        dispatch(addNotification({ type: "warning", message }));
      },
      info: (message, opts) => {
        enqueueSnackbar(message, { variant: "info", autoHideDuration: opts?.autoHideDuration ?? 3000 });
        dispatch(addNotification({ type: "info", message }));
      },
    }),
    [enqueueSnackbar, dispatch],
  );

  useEffect(() => {
    if (status !== "authenticated" || !socket || setupDoneRef.current) return;

    const notifyObj = notify();
    setupSocketEventHandlers(socket, notifyObj);
    setupDoneRef.current = true;
    logger.log("[GlobalNotifications] Socket event handlers wired");

    return () => {
      removeSocketEventHandlers(socket);
      setupDoneRef.current = false;
      logger.log("[GlobalNotifications] Socket event handlers removed");
    };
  }, [status, notify]);
}
