"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ChatIcon from "@mui/icons-material/Chat";
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/utils/redux/thunks/friendThunks";
import { addIncomingRequest, friendAccepted } from "@/utils/redux/friendSlice";
import { getOrCreateChat } from "@/utils/redux/thunks/chatThunks";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import { setLeftComponent } from "@/utils/redux/layoutSlice";
import socket from "@/lib/socket";
import logger from "@/lib/logger";

export default function FriendsPanel() {
  const dispatch = useDispatch();
  const { friends, requests, loading, error } = useSelector(
    (state) => state.friend,
  );
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [tab, setTab] = useState(0); // 0 = Friends, 1 = Requests
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [actionLoading, setActionLoading] = useState(null); // tracks which button is loading

  // Fetch friends and requests on mount
  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
  }, [dispatch]);

  // Socket.IO listeners for real-time friend events
  useEffect(() => {
    if (!currentUser?._id) return;

    const handleFriendEvent = (data) => {
      logger.log("[Friends] Socket event:", data);
      if (data.type === "incoming") {
        dispatch(addIncomingRequest(data));
      } else if (data.type === "accepted") {
        dispatch(friendAccepted(data));
        // Refresh full list
        dispatch(fetchFriends());
      }
    };

    socket.on("friendRequest", handleFriendEvent);
    return () => socket.off("friendRequest", handleFriendEvent);
  }, [currentUser?._id, dispatch]);

  const handleAccept = useCallback(
    async (senderId) => {
      setActionLoading(senderId);
      try {
        await dispatch(acceptFriendRequest(senderId)).unwrap();
        dispatch(fetchFriends()); // Refresh friend list
        setSnackbar({
          open: true,
          message: "Friend request accepted!",
          severity: "success",
        });
      } catch (err) {
        setSnackbar({ open: true, message: err, severity: "error" });
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch],
  );

  const handleDecline = useCallback(
    async (senderId) => {
      setActionLoading(senderId);
      try {
        await dispatch(declineFriendRequest(senderId)).unwrap();
        setSnackbar({
          open: true,
          message: "Friend request declined",
          severity: "info",
        });
      } catch (err) {
        setSnackbar({ open: true, message: err, severity: "error" });
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch],
  );

  const handleRemove = useCallback(
    async (friendId) => {
      setActionLoading(friendId);
      try {
        await dispatch(removeFriend(friendId)).unwrap();
        setSnackbar({
          open: true,
          message: "Friend removed",
          severity: "info",
        });
      } catch (err) {
        setSnackbar({ open: true, message: err, severity: "error" });
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch],
  );

  const handleStartChat = useCallback(
    async (user) => {
      if (!currentUser?._id) return;
      try {
        const result = await dispatch(
          getOrCreateChat({
            currentUserId: currentUser._id,
            searchedUserId: user._id,
          }),
        ).unwrap();
        dispatch(setCurrentChat(result.chat));
        dispatch(
          setLeftComponent({ name: "user-chat", props: { userId: user._id } }),
        );
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Failed to open chat",
          severity: "error",
        });
      }
    },
    [currentUser?._id, dispatch],
  );

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Friends
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={`Friends (${friends.length})`} />
        <Tab
          label={
            <Badge badgeContent={requests.length} color="error" max={99}>
              <span>Requests</span>
            </Badge>
          }
        />
      </Tabs>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {/* Friends Tab */}
      {tab === 0 && !loading && (
        <List sx={{ flex: 1, overflow: "auto" }}>
          {friends.length === 0 ? (
            <ListItem>
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", width: "100%" }}
              >
                No friends yet. Search for users to add friends!
              </Typography>
            </ListItem>
          ) : (
            friends.map((friend) => (
              <ListItemButton
                key={friend._id}
                sx={{ py: 1.5 }}
                onClick={() => handleStartChat(friend)}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color={friend.status === "online" ? "success" : "default"}
                  >
                    <Avatar src={getProfilePicUrl(friend.profilePic, "small")}>
                      {friend.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {friend.name}
                    </Typography>
                  }
                  secondary={friend.status === "online" ? "Online" : "Offline"}
                />
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Chat">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChat(friend);
                      }}
                    >
                      <ChatIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove friend">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={actionLoading === friend._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(friend._id);
                      }}
                    >
                      {actionLoading === friend._id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PersonRemoveIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ListItemButton>
            ))
          )}
        </List>
      )}

      {/* Requests Tab */}
      {tab === 1 && !loading && (
        <List sx={{ flex: 1, overflow: "auto" }}>
          {requests.length === 0 ? (
            <ListItem>
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", width: "100%" }}
              >
                No pending friend requests
              </Typography>
            </ListItem>
          ) : (
            requests.map((req) => {
              const sender = req.sender || {};
              const senderId = sender._id || req.sender;
              return (
                <ListItem key={senderId} sx={{ py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar src={getProfilePicUrl(sender.profilePic, "small")}>
                      {sender.name?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sender.name || "Unknown"}
                      </Typography>
                    }
                    secondary="Wants to be your friend"
                  />
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Accept">
                      <IconButton
                        size="small"
                        color="success"
                        disabled={actionLoading === senderId}
                        onClick={() => handleAccept(senderId)}
                      >
                        {actionLoading === senderId ? (
                          <CircularProgress size={16} />
                        ) : (
                          <CheckIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Decline">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={actionLoading === senderId}
                        onClick={() => handleDecline(senderId)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              );
            })
          )}
        </List>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
