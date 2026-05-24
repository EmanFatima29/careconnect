"use client";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { format } from "date-fns";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Popover,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { CheckCheck } from "lucide-react";

// Lazy-load emoji picker to avoid SSR issues
const EmojiPicker = lazy(() => import("@emoji-mart/react"));

import {
  fetchMessages,
  restoreCachedMessages,
  createMessage,
  deleteMessage,
  editMessage,
} from "@/utils/redux/thunks/messageThunks";
import { addMessage, updateMessage } from "@/utils/redux/messageSlice";
import { setLeftComponent } from "@/utils/redux/layoutSlice";
import { useChatRoom } from "@/utils/hooks/useSocket";
import { getCachedMessages } from "@/lib/chatCache";
import { LazyImage, LazyVideo, FileAttachment } from "./LazyMedia";
import SentimentIndicator from "./SentimentIndicator";
import { VoiceRecorder, MessageTTS } from "./VoiceRecorder";
import logger from "@/lib/logger";

// socket import removed — messages are sent via HTTP thunk;
// server controller broadcasts to socket room after persisting.

dayjs.extend(relativeTime);

/**
 * Extract sender ID string from a message.
 * `senderId` can be either a raw ObjectId string (from createMessage / socket)
 * or a populated object { _id, name, email, ... } (from fetchMessages).
 */
const extractSenderId = (msg) => {
  if (!msg?.senderId) return null;
  if (typeof msg.senderId === "object" && msg.senderId !== null) {
    return msg.senderId._id?.toString() || msg.senderId.toString();
  }
  return msg.senderId.toString();
};

// Allowed media types for message attachments
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
];
const MAX_MEDIA_SIZE = 20 * 1024 * 1024; // 20 MB

const getMessageTypeFromMime = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
};

// ============ MESSAGE LOADING SKELETON ============
function MessageSkeleton() {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
      </Box>
    </Box>
  );
}

// ============ MAIN CHAT COMPONENT ============
function Chat({ userId }) {
  const dispatch = useDispatch();
  const { data: session } = useSession();

  // Redux State
  const currentChat = useSelector((state) => state.chat?.currentChat);
  const messages = useSelector((state) => state.message?.messages || []);
  const messageLoading = useSelector((state) => state.message?.loading);
  const messageError = useSelector((state) => state.message?.error);
  const currentUser = useSelector((state) => state.user?.currentUser);
  const allUsers = useSelector((state) => state.user?.usersData || []);

  // Mood of the other user — based on their last 50 messages in this chat
  const [otherUserMood, setOtherUserMood] = useState(null);

  // Socket Hook
  const {
    sendMessage: socketSendMessage,
    broadcastTyping,
    broadcastStopTyping,
    on,
    isConnected,
  } = useChatRoom(currentChat?._id);

  // Local State
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null); // { _id, content }
  const [editContent, setEditContent] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const emojiDataRef = useRef(null);
  const fileInputRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());

  // Check if group chat — server uses `isGroup` boolean on the Chat model
  const isGroupChat =
    currentChat?.isGroup ||
    currentChat?.type === "group" ||
    (Array.isArray(currentChat?.participants) &&
      currentChat.participants.length > 2);

  // Resolve participant — can be populated { _id, name, ... } or raw ObjectId string
  const resolveParticipantId = (p) =>
    typeof p === "object" && p?._id ? p._id.toString() : String(p);

  const groupMembers = isGroupChat
    ? (currentChat?.participants || [])
        .map((p) => {
          const pid = resolveParticipantId(p);
          // If already populated, use directly
          if (typeof p === "object" && p?._id) return p;
          return allUsers.find((u) => u._id === pid);
        })
        .filter(Boolean)
    : [];

  // Receiver info - get from currentChat participants for 1-on-1 chats
  const getReceiverId = () => {
    if (!currentChat || isGroupChat) return userId;

    // For 1-on-1 chats, find the other participant
    const otherParticipantId = (currentChat.participants || []).find(
      (p) => resolveParticipantId(p) !== currentUser?._id?.toString(),
    );

    return otherParticipantId
      ? resolveParticipantId(otherParticipantId)
      : userId;
  };

  const receiverId = getReceiverId();
  const receiver = allUsers.find((u) => u._id === receiverId);

  // ============ FETCH OTHER USER'S MOOD ============
  // Shows mood of the other user based on their last 50 messages in this chat
  useEffect(() => {
    if (!currentChat?._id || !receiverId || isGroupChat) {
      setOtherUserMood(null);
      return;
    }
    let cancelled = false;
    import("@/lib/api").then(({ default: api }) => {
      api
        .get(`/api/messages/sentiment/${receiverId}/chat/${currentChat._id}`)
        .then((res) => {
          if (!cancelled) setOtherUserMood(res.data);
        })
        .catch(() => {
          if (!cancelled) setOtherUserMood(null);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [currentChat?._id, receiverId, isGroupChat]);

  // ============ SOCKET LISTENERS ============
  useEffect(() => {
    if (!currentChat?._id) return;

    const handleReceiveMessage = (message) => {
      if (
        message.chatId === currentChat?._id ||
        message.room === currentChat?._id
      ) {
        if (message._id && message.senderId) {
          const alreadyHasMessage = messages.some(
            (msg) => msg._id === message._id,
          );
          if (!alreadyHasMessage) {
            dispatch(addMessage(message));
            setTimeout(() => {
              chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
              });
            }, 100);
          }
        }
      }
    };

    const handleTyping = ({ chatId, senderId, userName }) => {
      if (
        (chatId === currentChat?._id || chatId === currentChat?._id) &&
        senderId !== currentUser?._id
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ chatId, senderId }) => {
      if (
        (chatId === currentChat?._id || chatId === currentChat?._id) &&
        senderId !== currentUser?._id
      ) {
        setIsTyping(false);
      }
    };

    const handleMessageError = ({ error }) => {
      setSnackbar({
        open: true,
        message: error || "Failed to send message",
        severity: "error",
      });
    };

    const handleMessageEdited = ({ messageId, content, editedAt }) => {
      dispatch(updateMessage({ messageId, content, editedAt }));
    };

    const cleanupReceive = on("receiveMessage", handleReceiveMessage);
    const cleanupTyping = on("typing", handleTyping);
    const cleanupStopTyping = on("stop-typing", handleStopTyping);
    const cleanupError = on("message-error", handleMessageError);
    const cleanupEdited = on("message-edited", handleMessageEdited);

    // === LOCAL-FIRST MESSAGE LOADING ===
    // Step 1: Restore cached messages → render instantly
    // Step 2: Incremental sync — fetch only new messages since last cached
    if (currentChat?._id && !joinedRoomsRef.current.has(currentChat._id)) {
      const chatId = currentChat._id;
      joinedRoomsRef.current.add(chatId);
      setRoomJoined(true);

      // Restore from cache first (instant)
      dispatch(restoreCachedMessages(chatId));

      // Then sync: check if we have cached data to do incremental sync
      const { lastTimestamp } = getCachedMessages(chatId);
      if (lastTimestamp) {
        // Incremental sync — only fetch messages newer than cache
        dispatch(fetchMessages({ chatId, since: lastTimestamp }));
      } else {
        // No cache — full fetch
        dispatch(fetchMessages({ chatId }));
      }
    }

    return () => {
      cleanupReceive?.();
      cleanupTyping?.();
      cleanupStopTyping?.();
      cleanupError?.();
      cleanupEdited?.();
    };
  }, [currentChat?._id, currentUser?._id, dispatch, on]);

  // ============ AUTO-SCROLL ============
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages]);

  // ============ MESSAGE HANDLING ============
  const senderId = currentUser?._id || session?.user?.id;

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() && !attachedFile) return;
    if (!currentChat?._id || !senderId) {
      setSnackbar({
        open: true,
        message: "Chat not ready. Please try again.",
        severity: "warning",
      });
      return;
    }

    setIsSending(true);

    const receiverIds = (currentChat.participants || [])
      .map(resolveParticipantId)
      .filter((id) => id !== senderId?.toString());
    if (receiverIds.length === 0 && userId) {
      receiverIds.push(userId);
    }

    const messageType = attachedFile
      ? getMessageTypeFromMime(attachedFile.type)
      : "text";

    const messagePayload = {
      chatId: currentChat._id,
      senderId,
      receiverIds,
      content: newMessage.trim(),
      messageType,
      status: "sent",
      isGroupMessage: isGroupChat,
      ...(replyTo ? { replyTo: replyTo._id } : {}),
      ...(attachedFile ? { file: attachedFile } : {}),
    };

    try {
      if (isConnected && !attachedFile && socketSendMessage) {
        const emitted = socketSendMessage(messagePayload);
        if (emitted) {
          setNewMessage("");
          setAttachedFile(null);
          setFilePreview(null);
          clearReply();
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
          broadcastStopTyping(senderId);
          setSnackbar({
            open: true,
            message: "Message sent",
            severity: "success",
          });
          return;
        }
      }

      const result = await dispatch(createMessage(messagePayload));

      if (result?.payload?._id) {
        setNewMessage("");
        setAttachedFile(null);
        setFilePreview(null);
        clearReply();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        broadcastStopTyping(senderId);
        setSnackbar({
          open: true,
          message: "Message sent",
          severity: "success",
        });
      } else {
        throw new Error("Failed to create message");
      }
    } catch (error) {
      logger.error("[Chat] Error sending message:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to send message",
        severity: "error",
      });
    } finally {
      setIsSending(false);
    }
  }, [
    newMessage,
    attachedFile,
    currentChat,
    senderId,
    userId,
    replyTo,
    dispatch,
    isGroupChat,
    socketSendMessage,
    isConnected,
    broadcastStopTyping,
  ]);

  // ============ TYPING INDICATORS ============
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    broadcastTyping(currentUser?._id, currentUser?.name);

    typingTimeoutRef.current = setTimeout(() => {
      broadcastStopTyping(currentUser?._id);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============ MESSAGE GROUPING & FORMATTING ============
  const groupedMessages = useMemo(() => {
    return messages.reduce((groups, msg) => {
      const dateKey = msg.createdAt
        ? format(new Date(msg.createdAt), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
      return groups;
    }, {});
  }, [messages]);

  // ============ UI HELPERS ============
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Last seen unknown";
    return `Last seen ${dayjs(timestamp).fromNow()}`;
  };

  const getMessageTick = (msg) => {
    if (extractSenderId(msg) === currentUser?._id) {
      if (msg.status === "seen") {
        return <CheckCheck size={16} className="text-blue-500" />;
      } else if (msg.status === "delivered") {
        return <CheckCheck size={16} className="text-gray-400" />;
      }
      return <CheckCheck size={16} className="text-gray-300" />;
    }
    return null;
  };

  const handleGoBack = () => {
    dispatch(setLeftComponent({ name: "chat" }));
    // Keep whatever the user has in the right panel (map, friends, chat, etc.)
  };

  const handleReply = (msg) => {
    setReplyTo({
      _id: msg._id,
      senderId: msg.senderId,
      senderName:
        extractSenderId(msg) === currentUser?._id
          ? "You"
          : allUsers.find((u) => u._id === extractSenderId(msg))?.name ||
            "User",
      content: msg.content,
    });
    setMenuAnchor(null);
  };

  const handleDeleteMessage = useCallback(
    async (msgId) => {
      try {
        await dispatch(
          deleteMessage({ messageId: msgId, chatId: currentChat?._id }),
        ).unwrap();
        setSnackbar({
          open: true,
          message: "Message deleted",
          severity: "success",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: err || "Failed to delete message",
          severity: "error",
        });
      }
      setMenuAnchor(null);
    },
    [dispatch],
  );

  const handleStartEdit = useCallback((msg) => {
    setEditingMessage(msg);
    setEditContent(msg.content);
    setMenuAnchor(null);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (!editingMessage || !editContent.trim()) return;
    try {
      await dispatch(
        editMessage({
          messageId: editingMessage._id,
          content: editContent.trim(),
        }),
      ).unwrap();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Edit failed",
        severity: "error",
      });
    }
    setEditingMessage(null);
    setEditContent("");
  }, [editingMessage, editContent, dispatch]);

  const clearReply = () => setReplyTo(null);

  // ============ FILE ATTACHMENT ============
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      setSnackbar({
        open: true,
        message: "Unsupported file type. Allowed: images, videos, PDFs.",
        severity: "error",
      });
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setSnackbar({
        open: true,
        message: "File too large. Maximum size is 20 MB.",
        severity: "error",
      });
      return;
    }

    setAttachedFile(file);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Reset the input so re-selecting the same file works
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
  };

  // ============ RENDER ============
  if (messageLoading && messages.length === 0) {
    return (
      <Paper
        sx={{ display: "flex", flexDirection: "column", p: 2, height: "100%" }}
      >
        <Box sx={{ mb: 2 }}>
          {[1, 2, 3].map((i) => (
            <MessageSkeleton key={i} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Go back">
            <IconButton onClick={handleGoBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>

          {isGroupChat ? (
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {currentChat?.name || "Group"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {groupMembers.length} members
              </Typography>
            </Box>
          ) : (
            <>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                color={receiver?.status === "online" ? "success" : "default"}
              >
                <Avatar
                  src={
                    typeof receiver?.profilePic === "object"
                      ? receiver.profilePic?.thumbnail ||
                        receiver.profilePic?.original
                      : receiver?.profilePic
                  }
                  alt={receiver?.name}
                />
              </Badge>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {receiver?.name || currentChat?.name || "Unknown User"}
                  </Typography>
                  {otherUserMood && (
                    <SentimentIndicator sentiment={otherUserMood} showNeutral />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {receiver?.status === "online"
                    ? "Online"
                    : formatLastSeen(receiver?.lastSeen)}
                  {otherUserMood?.messageCount > 0 && (
                    <> &middot; Mood: {otherUserMood.label}</>
                  )}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </Box>

      {/* Error Alert */}
      {messageError && (
        <Alert severity="error" onClose={() => {}} sx={{ m: 1 }}>
          {messageError}
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        ref={chatContainerRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-relevant="additions"
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          bgcolor: "background.default",
          maxHeight: 400,
        }}
      >
        {Object.entries(groupedMessages).length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography color="textSecondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
            <Box key={dateKey}>
              {/* Date Divider */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, my: 2 }}
              >
                <Divider sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(dateKey), "MMM dd, yyyy")}
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Messages */}
              {dateMessages.map((msg, index) => {
                const senderName =
                  extractSenderId(msg) === currentUser?._id
                    ? "You"
                    : allUsers.find((u) => u._id === extractSenderId(msg))
                        ?.name || "User";
                const sender = allUsers.find(
                  (u) => u._id === extractSenderId(msg),
                );

                return (
                  <Box
                    key={msg._id || index}
                    sx={{
                      display: "flex",
                      justifyContent:
                        extractSenderId(msg) === currentUser?._id
                          ? "flex-end"
                          : "flex-start",
                      minWidth: 100,
                      group: "item",
                    }}
                    onMouseEnter={(e) => setSelectedMessage(msg._id)}
                    onMouseLeave={() => setSelectedMessage(null)}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-end">
                      {extractSenderId(msg) !== currentUser?._id &&
                        isGroupChat &&
                        sender?.profilePic && (
                          <Avatar
                            src={
                              typeof sender.profilePic === "object"
                                ? sender.profilePic?.thumbnail ||
                                  sender.profilePic?.original
                                : sender.profilePic
                            }
                            alt={senderName}
                            sx={{ width: 28, height: 28 }}
                          />
                        )}

                      {/* Actions on LEFT for current user's messages */}
                      {extractSenderId(msg) === currentUser?._id && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            visibility:
                              selectedMessage === msg._id
                                ? "visible"
                                : "hidden",
                          }}
                        >
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMessage(msg._id)}
                              sx={{ opacity: 0.7, p: 0.25 }}
                            >
                              <DeleteIcon sx={{ fontSize: "0.95rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleStartEdit(msg)}
                              sx={{ opacity: 0.7, p: 0.25 }}
                            >
                              <EditIcon sx={{ fontSize: "0.95rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reply">
                            <IconButton
                              size="small"
                              onClick={() => handleReply(msg)}
                              sx={{ opacity: 0.7 }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  transform: "scaleX(-1)",
                                }}
                              >
                                ↩
                              </span>
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}

                      <Paper
                        sx={{
                          maxWidth: "60%",
                          p: 1.5,
                          bgcolor:
                            extractSenderId(msg) === currentUser?._id
                              ? "primary.main"
                              : "action.hover",
                          color:
                            extractSenderId(msg) === currentUser?._id
                              ? "primary.contrastText"
                              : "text.primary",
                          borderRadius: 2,
                          position: "relative",
                          minHeight: 40,
                          minWidth: 100,
                        }}
                      >
                        {/* Sender Name (Group Only) */}
                        {isGroupChat &&
                          extractSenderId(msg) !== currentUser?._id && (
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, display: "block" }}
                            >
                              {senderName}
                            </Typography>
                          )}

                        {/* Reply Preview */}
                        {msg.replyTo && (
                          <Box
                            sx={{
                              borderLeft: "2px solid",
                              borderColor:
                                extractSenderId(msg) === currentUser?._id
                                  ? "primary.contrastText"
                                  : "text.secondary",
                              pl: 1,
                              mb: 0.5,
                              opacity: 0.7,
                              fontSize: "0.85em",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              Replying to message
                            </Typography>
                          </Box>
                        )}

                        {/* Content */}
                        {editingMessage?._id === msg._id ? (
                          <Stack spacing={0.5}>
                            <TextField
                              size="small"
                              fullWidth
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleConfirmEdit();
                                }
                                if (e.key === "Escape") {
                                  setEditingMessage(null);
                                }
                              }}
                              autoFocus
                              multiline
                              maxRows={3}
                            />
                            <Stack direction="row" spacing={0.5}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={handleConfirmEdit}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setEditingMessage(null)}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Stack>
                        ) : (
                          <>
                            {/* Media attachment — lazy loaded */}
                            {(msg.fileUrl || msg.media) &&
                              msg.messageType === "image" && (
                                <Box sx={{ mb: msg.content ? 0.5 : 0 }}>
                                  <LazyImage
                                    media={msg.media}
                                    fileUrl={msg.fileUrl}
                                    alt="Shared image"
                                    onClick={(url) =>
                                      window.open(url, "_blank")
                                    }
                                  />
                                </Box>
                              )}
                            {(msg.fileUrl || msg.media) &&
                              msg.messageType === "video" && (
                                <Box sx={{ mb: msg.content ? 0.5 : 0 }}>
                                  <LazyVideo
                                    media={msg.media}
                                    fileUrl={msg.fileUrl}
                                  />
                                </Box>
                              )}
                            {(msg.fileUrl || msg.media) &&
                              msg.messageType === "file" && (
                                <Box sx={{ mb: msg.content ? 0.5 : 0 }}>
                                  <FileAttachment
                                    media={msg.media}
                                    fileUrl={msg.fileUrl}
                                    content={msg.content}
                                  />
                                </Box>
                              )}
                            {msg.content && (
                              <Typography
                                variant="body2"
                                sx={{ wordBreak: "break-word" }}
                              >
                                {msg.content}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* Timestamp & Tick */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="flex-end"
                          spacing={0.5}
                          sx={{ mt: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.7, color: "text.secondary" }}
                          >
                            {dayjs(msg.createdAt).format("HH:mm")}
                          </Typography>
                          {msg.edited && (
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.5, fontSize: "0.65rem" }}
                            >
                              edited
                            </Typography>
                          )}
                          {getMessageTick(msg)}
                        </Stack>
                      </Paper>

                      {/* Actions on RIGHT for other users' messages */}
                      {extractSenderId(msg) !== currentUser?._id && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            visibility:
                              selectedMessage === msg._id
                                ? "visible"
                                : "hidden",
                          }}
                        >
                          {msg.content && <MessageTTS text={msg.content} />}

                          <Tooltip title="Reply">
                            <IconButton
                              size="small"
                              onClick={() => handleReply(msg)}
                              sx={{ opacity: 0.7 }}
                            >
                              ↩
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <Avatar
              src={getProfilePicUrl(receiver?.profilePic, "thumbnail")}
              sx={{ width: 24, height: 24 }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "text.secondary",
                  animation: "bounce 1.4s infinite",
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "text.secondary",
                  animation: "bounce 1.4s infinite 0.2s",
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "text.secondary",
                  animation: "bounce 1.4s infinite 0.4s",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Reply Preview */}
      {replyTo && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: "action.neutral",
            borderTop: "2px solid",
            borderColor: "primary.main",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: "primary.main" }}
              >
                Replying to {replyTo.senderName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {replyTo.content}
              </Typography>
            </Box>
            <IconButton onClick={clearReply} size="small">
              ✕
            </IconButton>
          </Stack>
        </Box>
      )}

      {/* File Attachment Preview */}
      {attachedFile && (
        <Box
          sx={{
            p: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {filePreview ? (
            <Box
              component="img"
              src={filePreview}
              alt="Preview"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                objectFit: "cover",
              }}
            />
          ) : (
            <InsertDriveFileIcon color="action" />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {attachedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(attachedFile.size / 1024).toFixed(0)} KB
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleRemoveFile}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Input Area */}
      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/mp4,video/webm,application/pdf"
          style={{ display: "none" }}
        />

        <Stack direction="row" spacing={1} alignItems="flex-end">
          <Tooltip title="Emoji">
            <IconButton
              size="small"
              onClick={(e) =>
                setEmojiAnchor(emojiAnchor ? null : e.currentTarget)
              }
              color={emojiAnchor ? "primary" : "default"}
            >
              <EmojiEmotionsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Attach file">
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              color={attachedFile ? "primary" : "default"}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Emoji Picker Popover */}
          <Popover
            open={Boolean(emojiAnchor)}
            anchorEl={emojiAnchor}
            onClose={() => setEmojiAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}
            disableRestoreFocus
          >
            <Suspense
              fallback={
                <Box sx={{ p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              }
            >
              <EmojiPicker
                data={emojiDataRef.current || undefined}
                onEmojiSelect={(emoji) => {
                  setNewMessage(
                    (prev) =>
                      prev + (emoji.native || emoji.skins?.[0]?.native || ""),
                  );
                  setEmojiAnchor(null);
                }}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
              />
            </Suspense>
          </Popover>

          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending || !currentChat?._id}
            size="small"
            variant="outlined"
            inputProps={{ "aria-label": "Message input" }}
          />

          <VoiceRecorder
            onTranscribe={(text) => setNewMessage((prev) => prev + text)}
            onError={(err) =>
              setSnackbar({ open: true, message: err, severity: "error" })
            }
            disabled={isSending || !currentChat?._id}
          />

          <Tooltip title={isSending ? "Sending..." : "Send"}>
            <span>
              <IconButton
                onClick={handleSendMessage}
                disabled={
                  (!newMessage.trim() && !attachedFile) ||
                  isSending ||
                  !currentChat?._id
                }
                color="primary"
                aria-label="Send message"
              >
                {isSending ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Paper>
  );
}

export default Chat;
