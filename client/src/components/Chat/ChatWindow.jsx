"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import {
  setCurrentUser,
  setUsersData,
  updateUsers,
  updateUsersStatus,
} from "@/utils/redux/userSlice";
import { setLeftComponent, setRightComponent } from "@/utils/redux/layoutSlice";
import { setMessages } from "@/utils/redux/messageSlice";
import { fetchChats, restoreCachedChats } from "@/utils/redux/thunks/chatThunks";
import {
  fetchCurrentUser as fetchCurrentUserThunk,
  fetchAllUsers,
} from "@/utils/redux/thunks/userThunks";
import { useRouter } from "next/navigation";
import { ChatSkeleton } from "@/components/UI/StyledComponents";
import SentimentIndicator from "@/components/Chat/SentimentIndicator";
import api, { updateUser } from "@/lib/api";
import socket from "@/lib/socket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

dayjs.extend(relativeTime);

function ChatWindow() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session, status: sessionStatus } = useSession();

  const userEmail = session?.user?.email;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0=All, 1=Groups, 2=Contacts
  const [searchQuery, setSearchQuery] = useState("");
  // Overall user sentiment cache: { [userId]: { score, label, messageCount } }
  const [userSentiments, setUserSentiments] = useState({});

  const currentUser = useSelector((state) => state.user.currentUser);
  const usersData = useSelector((state) => state.user.usersData);
  const allUsers = useSelector((state) => state.user.allUsers);
  const chats = useSelector((state) => state.chat.chats);
  const usersDataRef = useRef(usersData);

  // Fetch current user — prefer Redux cache, only hit API if empty
  const fetchCurrentUser = useCallback(async () => {
    if (sessionStatus === "loading") return null;
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return null;
    }
    if (currentUser) return currentUser;
    try {
      const result = await dispatch(
        fetchCurrentUserThunk({ force: true }),
      ).unwrap();
      return result;
    } catch (error) {
      logger.error("Error fetching current user:", error);
      throw error;
    }
  }, [sessionStatus, router, currentUser, dispatch]);

  const handleOnline = useCallback(
    (userId) => {
      dispatch(updateUsersStatus({ userId, status: "online", lastSeen: null }));
    },
    [dispatch],
  );

  const handleOffline = useCallback(
    ({ userId, lastSeen }) => {
      dispatch(updateUsersStatus({ userId, status: "offline", lastSeen }));
    },
    [dispatch],
  );

  // Socket setup
  useEffect(() => {
    if (!session?.user?.id || !session?.accessToken) return;
    socket.io.opts.query = { userId: session.user.id };
    socket.auth = { token: session.accessToken };
    try {
      if (!socket.connected) socket.connect();
    } catch (err) {
      logger.error("Error connecting to socket:", err);
      setError("Failed to connect to socket");
      return;
    }
    socket.on("user-online", handleOnline);
    socket.on("user-offline", handleOffline);
    return () => {
      socket.off("user-online", handleOnline);
      socket.off("user-offline", handleOffline);
    };
  }, [session?.user?.id, session?.accessToken, handleOnline, handleOffline]);

  useEffect(() => {
    usersDataRef.current = usersData;
  }, [usersData]);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    if (session === undefined) return;
    if (sessionStatus !== "authenticated") return;

    const loadData = async () => {
      try {
        // === WARM STARTUP ===
        // Step 1: Restore cached chats from localStorage → render immediately
        if (currentUser?._id) {
          dispatch(restoreCachedChats(currentUser._id));
        }

        if (currentUser && usersData.length > 0) {
          setLoading(false);
          // Step 2: Background sync — fetch fresh data from API
          dispatch(fetchChats({ force: true }));
          return;
        }

        setLoading(true);
        const user = await fetchCurrentUser();
        if (!isMounted || !user) return;

        // Restore cached chats now that we have userId
        dispatch(restoreCachedChats(user._id));

        if (user.email) {
          localStorage.setItem("userEmail", user.email);
        }
        if (session?.offlineToken) {
          localStorage.setItem("offlineToken", session.offlineToken);
        }

        if (user.status !== "online") {
          try {
            const { success, updatedUser } = await updateUser(user.email, {
              status: "online",
            });
            if (success && updatedUser) {
              dispatch(setCurrentUser(updatedUser));
            }
          } catch (error) {
            logger.error("Error updating user status:", error);
          }
        }

        if (usersData.length === 0) {
          let users = allUsers;
          if (!users || users.length === 0) {
            try {
              const action = await dispatch(fetchAllUsers({ force: true }));
              users = action.payload || [];
            } catch (err) {
              logger.error("Error fetching users:", err);
              users = [];
            }
          }
          if (isMounted && users.length > 0) {
            const filtered = users.filter(
              (u) => u._id?.toString() !== user._id?.toString(),
            );
            dispatch(setUsersData(filtered));
          }
        }

        if (isMounted) {
          // Background sync — fetch fresh chats from API
          dispatch(fetchChats({ force: true }));
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [sessionStatus, session, currentUser?._id, usersData.length, allUsers, dispatch, fetchCurrentUser]);

  // Offline status: rely on server socket disconnect handler as primary mechanism.
  useEffect(() => {
    if (!session || !socket || sessionStatus !== "authenticated") return;

    const isPageRefresh = (() => {
      const navEntries = performance.getEntriesByType("navigation");
      return navEntries.some((entry) => entry.type === "reload");
    })();

    const handleTabClose = (event) => {
      if (event?.persisted || isPageRefresh) return;
      if (!socket?.connected) {
        const email = currentUser?.email || localStorage.getItem("userEmail");
        const offlineToken = localStorage.getItem("offlineToken");
        if (email) {
          const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/status-offline`;
          const payload = {
            email,
            status: "offline",
            lastSeen: new Date().toISOString(),
            token: offlineToken || undefined,
          };
          navigator.sendBeacon(
            url,
            new Blob([JSON.stringify(payload)], { type: "application/json" }),
          );
        }
      }
    };

    window.addEventListener("pagehide", handleTabClose);
    window.addEventListener("beforeunload", handleTabClose);
    return () => {
      window.removeEventListener("pagehide", handleTabClose);
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [currentUser, socket, session, sessionStatus]);

  // Socket userUpdated listener
  useEffect(() => {
    if (!socket?.connected && session?.accessToken) {
      socket.auth = { token: session.accessToken };
      socket.connect();
    }
    if (!socket) return;

    const handleUserUpdated = async ({ userId, updates }) => {
      if (!userId || !updates) return;
      dispatch(updateUsers({ userId, updates }));
      if (userId === session?.user?.id) {
        try {
          const updatedCurrent = await fetchCurrentUser();
          dispatch(setCurrentUser(updatedCurrent));
        } catch (error) {
          logger.error("Failed to update current user from socket event", error);
        }
      }
    };
    socket.on("userUpdated", handleUserUpdated);
    return () => {
      socket.off("userUpdated", handleUserUpdated);
    };
  }, [socket, fetchCurrentUser, dispatch, session?.user?.email, session?.accessToken]);

  // ============ FETCH USER SENTIMENTS ============
  // For each 1:1 chat user, fetch their overall sentiment (respects showSentiment setting)
  // Admins see all; regular users see only if the target user enabled it
  useEffect(() => {
    if (!chats?.length || !currentUser?._id) return;
    const userIds = new Set();
    chats.forEach((chat) => {
      if (!chat.isGroup) {
        (chat.participants || []).forEach((p) => {
          const id = typeof p === "object" ? p._id : p;
          if (id && String(id) !== String(currentUser._id)) {
            userIds.add(String(id));
          }
        });
      }
    });
    userIds.forEach((uid) => {
      if (userSentiments[uid]) return;
      api
        .get(`/api/messages/sentiment/${uid}`)
        .then((res) => {
          if (!res.data?.restricted) {
            setUserSentiments((prev) => ({ ...prev, [uid]: res.data }));
          }
        })
        .catch(() => {});
    });
  }, [chats, currentUser?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ BUILD CHAT LIST (WhatsApp-style) ============

  // Resolve a participant (could be populated object or raw ID string)
  const resolveUser = useCallback(
    (participant) => {
      if (typeof participant === "object" && participant?._id) {
        return participant; // Already populated
      }
      // Raw ID — look up in usersData
      const id = String(participant);
      return usersData.find((u) => u._id === id) || null;
    },
    [usersData],
  );

  // Build unified chat items from Redux chats array
  const chatItems = useMemo(() => {
    if (!currentUser?._id || !chats?.length) return [];

    return chats
      .map((chat) => {
        const isGroup = chat.isGroup;

        if (isGroup) {
          // Group chat
          const participants = (chat.participants || [])
            .map(resolveUser)
            .filter(Boolean);
          const otherMembers = participants.filter(
            (p) => p._id !== currentUser._id,
          );
          return {
            id: chat._id,
            chat,
            isGroup: true,
            name: chat.name || `Group (${participants.length})`,
            avatarUrl: chat.pic || null,
            members: participants,
            otherMembers,
            memberCount: participants.length,
            lastMessage: chat.lastMessage,
            unread: chat.unreadMessages?.[currentUser._id] || 0,
            updatedAt: chat.updatedAt,
          };
        } else {
          // 1:1 chat — find the other participant
          const otherParticipant = (chat.participants || [])
            .map(resolveUser)
            .find((p) => p && p._id !== currentUser._id);

          if (!otherParticipant) return null;

          return {
            id: chat._id,
            chat,
            isGroup: false,
            name: otherParticipant.name || "User",
            avatarUrl:
              typeof otherParticipant.profilePic === "object"
                ? otherParticipant.profilePic?.thumbnail || otherParticipant.profilePic?.original
                : otherParticipant.profilePic || null,
            user: otherParticipant,
            status: otherParticipant.status,
            lastSeen: otherParticipant.lastSeen,
            lastMessage: chat.lastMessage,
            unread: chat.unreadMessages?.[currentUser._id] || 0,
            updatedAt: chat.updatedAt,
          };
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [chats, currentUser?._id, resolveUser]);

  // Users who don't have an existing chat (for "Contacts" tab)
  const contactsWithoutChat = useMemo(() => {
    if (!currentUser?._id) return usersData;
    const chatUserIds = new Set();
    chatItems.forEach((item) => {
      if (!item.isGroup && item.user) {
        chatUserIds.add(item.user._id);
      }
    });
    return usersData.filter((u) => !chatUserIds.has(u._id));
  }, [usersData, chatItems, currentUser?._id]);

  // Filter by search query
  const filteredChatItems = useMemo(() => {
    if (!searchQuery.trim()) return chatItems;
    const q = searchQuery.toLowerCase();
    return chatItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [chatItems, searchQuery]);

  const filteredGroupItems = useMemo(() => {
    return filteredChatItems.filter((item) => item.isGroup);
  }, [filteredChatItems]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactsWithoutChat;
    const q = searchQuery.toLowerCase();
    return contactsWithoutChat.filter((u) =>
      (u.name || "").toLowerCase().includes(q),
    );
  }, [contactsWithoutChat, searchQuery]);

  // ============ CLICK HANDLERS ============

  const handleChatClick = async (chatItem) => {
    dispatch(setCurrentChat(chatItem.chat));
    dispatch(setMessages([])); // Clear; Chat component will fetch
    dispatch(
      setLeftComponent({
        name: "user-chat",
        props: { userId: chatItem.isGroup ? null : chatItem.user?._id },
      }),
    );
  };

  const handleContactClick = async (user) => {
    if (!currentUser) return;
    try {
      const res = await api.post(`/api/chats/get-or-create-chat`, {
        currentUserId: currentUser._id,
        searchedUserId: user._id,
      });
      dispatch(setCurrentChat(res.data.chat));
      dispatch(setMessages(res.data.messages || []));
      dispatch(
        setLeftComponent({ name: "user-chat", props: { userId: user._id } }),
      );
      // Refresh chats list so the new chat appears
      dispatch(fetchChats({ force: true }));
    } catch (error) {
      logger.error("Error creating/fetching chat:", error);
      setError("Failed to start chat");
    }
  };

  // ============ RENDER HELPERS ============

  const getLastMessagePreview = (lastMsg) => {
    if (!lastMsg) return null;
    const content = typeof lastMsg === "object" ? lastMsg.content : lastMsg;
    if (!content) return null;
    return content.length > 45 ? content.slice(0, 45) + "…" : content;
  };

  const getLastMessageTime = (lastMsg, updatedAt) => {
    const ts = lastMsg?.createdAt || updatedAt;
    if (!ts) return "";
    return dayjs(ts).fromNow();
  };

  // ============ RENDER ============

  if (loading) return <ChatSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderChatItem = (item) => {
    const preview = getLastMessagePreview(item.lastMessage);
    const timeAgo = getLastMessageTime(item.lastMessage, item.updatedAt);

    return (
      <ListItemButton
        key={item.id}
        onClick={() => handleChatClick(item)}
        sx={{ px: 2, py: 1, alignItems: "center" }}
      >
        <ListItemAvatar>
          {item.isGroup ? (
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <GroupsIcon />
            </Avatar>
          ) : (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              color={item.status === "online" ? "success" : "default"}
              invisible={item.status !== "online"}
            >
              <Avatar src={item.avatarUrl} alt={item.name}>
                {(item.name || "U").charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {item.name}
                </Typography>
                {/* Sentiment indicator — shows overall user behavior mood */}
                {!item.isGroup && item.user?._id && userSentiments[item.user._id] && (
                  <SentimentIndicator sentiment={userSentiments[item.user._id]} />
                )}
              </Stack>
              {timeAgo && (
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", ml: 1 }}>
                  {timeAgo}
                </Typography>
              )}
            </Stack>
          }
          secondary={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                {preview ||
                  (item.isGroup
                    ? `${item.memberCount} members`
                    : item.status === "online"
                      ? "Online"
                      : item.lastSeen
                        ? `Last seen ${dayjs(item.lastSeen).fromNow()}`
                        : "Offline")}
              </Typography>
              {item.unread > 0 && (
                <Chip
                  size="small"
                  label={item.unread}
                  color="primary"
                  sx={{ height: 20, minWidth: 20, fontSize: "0.7rem", ml: 1 }}
                />
              )}
            </Stack>
          }
        />
      </ListItemButton>
    );
  };

  const renderContactItem = (user) => {
    const status = user?.status;
    return (
      <ListItemButton
        key={user._id}
        onClick={() => handleContactClick(user)}
        sx={{ px: 2, py: 1, alignItems: "center" }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            color={status === "online" ? "success" : "default"}
            invisible={status !== "online"}
          >
            <Avatar
              src={
                typeof user?.profilePic === "object"
                  ? user.profilePic?.thumbnail || user.profilePic?.original
                  : user?.profilePic || undefined
              }
              alt={user?.name || "User"}
            >
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {user?.name || "User"}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" noWrap>
              {status === "online"
                ? "Online"
                : user?.lastSeen
                  ? `Last seen ${dayjs(user.lastSeen).fromNow()}`
                  : "Tap to start chatting"}
            </Typography>
          }
        />
        <Chip
          size="small"
          variant="outlined"
          label={status || "—"}
          color={status === "online" ? "success" : "default"}
        />
      </ListItemButton>
    );
  };

  // Choose what to render based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case 0: // All Chats
        if (filteredChatItems.length === 0) {
          return (
            <Stack sx={{ p: 3 }} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? "No chats match your search" : "No conversations yet. Start one from Contacts!"}
              </Typography>
            </Stack>
          );
        }
        return <List disablePadding>{filteredChatItems.map(renderChatItem)}</List>;

      case 1: // Groups
        if (filteredGroupItems.length === 0) {
          return (
            <Stack sx={{ p: 3 }} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? "No groups match your search" : "No group chats yet"}
              </Typography>
            </Stack>
          );
        }
        return <List disablePadding>{filteredGroupItems.map(renderChatItem)}</List>;

      case 2: // Contacts
        if (filteredContacts.length === 0 && filteredChatItems.length === 0) {
          return (
            <Stack sx={{ p: 3 }} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                No contacts available
              </Typography>
            </Stack>
          );
        }
        return (
          <List disablePadding>
            {/* Show existing 1:1 chats first */}
            {filteredChatItems
              .filter((item) => !item.isGroup)
              .map(renderChatItem)}
            {/* Then show contacts without existing chat */}
            {filteredContacts.length > 0 && (
              <>
                {filteredChatItems.filter((i) => !i.isGroup).length > 0 && (
                  <Divider sx={{ my: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      New contacts
                    </Typography>
                  </Divider>
                )}
                {filteredContacts.map(renderContactItem)}
              </>
            )}
          </List>
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Chats
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {chatItems.length} conversations
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Friends">
              <IconButton size="small" onClick={() => dispatch(setLeftComponent({ name: "friends" }))}>
                <PeopleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show map on left">
              <IconButton size="small" onClick={() => {
                dispatch(setLeftComponent({ name: "map" }));
                dispatch(setRightComponent({ name: "chat" }));
              }}>
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Search */}
      <Box sx={{ px: 2, pb: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search chats or contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ color: "text.secondary", mr: 1 }} fontSize="small" />
              ),
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0.5, textTransform: "none", fontSize: "0.8rem" } }}
      >
        <Tab label={`All (${chatItems.length})`} />
        <Tab label={`Groups (${chatItems.filter((c) => c.isGroup).length})`} />
        <Tab label={`Contacts (${usersData.length})`} />
      </Tabs>
      <Divider />

      {/* Chat List */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {getTabContent()}
      </Box>
    </Paper>
  );
}

export default ChatWindow;
