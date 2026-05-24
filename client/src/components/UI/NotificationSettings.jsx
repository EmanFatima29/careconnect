"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getPushPermissionStatus,
  registerServiceWorker,
} from "@/lib/pushNotifications";
import logger from "@/lib/logger";

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const check = async () => {
      const isSupported = isPushSupported();
      setSupported(isSupported);
      if (isSupported) {
        setPermission(getPushPermissionStatus());
        await registerServiceWorker();
      }
    };
    check();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await subscribeToPush();
      if (result.success) {
        setPermission("granted");
        setMessage({
          severity: "success",
          text: "Push notifications enabled!",
        });
      } else if (result.reason === "permission-denied") {
        setPermission("denied");
        setMessage({
          severity: "warning",
          text: "Notification permission was denied. Please enable it in your browser settings.",
        });
      } else {
        setMessage({
          severity: "error",
          text: `Failed to enable notifications: ${result.reason}`,
        });
      }
    } catch (err) {
      logger.error("[NotificationSettings] Subscribe error:", err);
      setMessage({ severity: "error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await unsubscribeFromPush();
      setMessage({ severity: "info", text: "Push notifications disabled" });
    } catch (err) {
      logger.error("[NotificationSettings] Unsubscribe error:", err);
      setMessage({ severity: "error", text: "Failed to unsubscribe" });
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Push notifications are not supported in this browser.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          {permission === "granted" ? (
            <NotificationsActiveIcon color="success" />
          ) : (
            <NotificationsOffIcon color="action" />
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Push Notifications
          </Typography>
          <Chip
            label={
              permission === "granted"
                ? "Enabled"
                : permission === "denied"
                  ? "Blocked"
                  : "Off"
            }
            color={
              permission === "granted"
                ? "success"
                : permission === "denied"
                  ? "error"
                  : "default"
            }
            size="small"
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Receive notifications for new messages, friend requests, and important
          updates even when the app is not open.
        </Typography>

        {message && <Alert severity={message.severity}>{message.text}</Alert>}

        <Stack direction="row" spacing={1}>
          {permission !== "granted" && (
            <Button
              variant="contained"
              onClick={handleSubscribe}
              disabled={loading || permission === "denied"}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <NotificationsActiveIcon />
                )
              }
            >
              Enable Notifications
            </Button>
          )}
          {permission === "granted" && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleUnsubscribe}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <NotificationsOffIcon />
                )
              }
            >
              Disable Notifications
            </Button>
          )}
        </Stack>

        {permission === "denied" && (
          <Alert severity="info">
            Notifications are blocked. To enable them, click the lock icon in
            your browser&apos;s address bar and allow notifications for this
            site.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
