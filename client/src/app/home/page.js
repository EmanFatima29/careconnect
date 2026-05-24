"use client";
import { useSelector, useDispatch } from "react-redux";
import dynamic from "next/dynamic";
import { ChatSkeleton } from "@/components/UI/StyledComponents";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "jose";
import { useEffect, useState, useCallback, memo } from "react";
import ErrorBoundary from "@/components/UI/ErrorBoundary";
import { setLeftComponent, setRightComponent } from "@/utils/redux/layoutSlice";
import { Box, Skeleton, CircularProgress, IconButton, Paper, Tooltip, Divider } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// ── Lazy-load heavy components — only downloaded when actually rendered ──
const ChatWindow = dynamic(() => import("@/components/Chat/ChatWindow"), {
  loading: () => <ChatSkeleton />,
  ssr: false,
});
const MapWindow = dynamic(() => import("@/components/Map/MapWindow"), {
  loading: () => (
    <Skeleton variant="rounded" width="100%" height="100%" sx={{ minHeight: 500, borderRadius: 2 }} />
  ),
  ssr: false,
});
const Chat = dynamic(() => import("@/components/Chat/Chat"), {
  loading: () => <ChatSkeleton />,
  ssr: false,
});
const FriendsPanel = dynamic(() => import("@/components/Friends/FriendsPanel"), {
  loading: () => <CircularProgress size={24} sx={{ m: "auto" }} />,
  ssr: false,
});

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // State for offline detection
  const [isOffline, setIsOffline] = useState(
    typeof window !== "undefined" ? !navigator.onLine : false,
  );

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { leftComponent, rightComponent } = useSelector(
    (state) => state.layout,
  );

  // Panel collapse state (drawer-like). Only one side can be collapsed at a time.
  // collapsedSide: null | "left" | "right"
  const [collapsedSide, setCollapsedSide] = useState(null);
  const leftIsMap = leftComponent?.name === "map";
  const rightIsMap = rightComponent?.name === "map";
  const leftIsChat = leftComponent?.name === "chat" || leftComponent?.name === "user-chat";
  const rightIsChat = rightComponent?.name === "chat" || rightComponent?.name === "user-chat";
  const hasMap = leftIsMap || rightIsMap;
  const hasChat = leftIsChat || rightIsChat;
  const mapSide = leftIsMap ? "left" : rightIsMap ? "right" : null;
  const chatSide = leftIsChat ? "left" : rightIsChat ? "right" : null;
  const mapCollapsed = collapsedSide === mapSide && mapSide !== null;
  const chatCollapsed = collapsedSide === chatSide && chatSide !== null;

  const toggleCollapse = (side) => {
    setCollapsedSide((curr) => (curr === side ? null : side));
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = decodeJwt(token);
      return decoded.exp * 1000 < Date.now();
    } catch (err) {
      return true;
    }
  };

  // Synchronous auth check — no unnecessary async delay
  // Compute loading state directly instead of via useState + useEffect cycle
  const authChecked = status !== "loading";
  const isAuthenticated =
    authChecked &&
    status === "authenticated" &&
    session?.accessToken &&
    !isTokenExpired(session.accessToken);

  useEffect(() => {
    if (!authChecked) return;

    if (status === "unauthenticated" || !session) {
      router.replace("/login");
      return;
    }

    if (isTokenExpired(session.accessToken)) {
      signOut({ redirect: false }).then(() => {
        router.replace("/login");
      });
    }
  }, [authChecked, status, session, router]);

  const loading = !isAuthenticated;
  const dp = useDispatch();

  const renderComponent = useCallback(({ name, props }) => {
    switch (name) {
      case "chat":
        return <ChatWindow />;
      case "map":
        return <ErrorBoundary componentName="Map"><MapWindow /></ErrorBoundary>;
      case "user-chat":
        return <ErrorBoundary componentName="Chat"><Chat {...props} /></ErrorBoundary>;
      case "friends":
        return <FriendsPanel />;
      default:
        return <div className="text-red-500">Unknown Component: {name}</div>;
    }
  }, []);

  // Show skeleton while loading or checking authentication
  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)", gap: 2 }}>
        <Box sx={{ width: "50%" }}>
          <ChatSkeleton />
        </Box>
        <Box sx={{ width: "50%" }}>
          <Skeleton
            variant="rounded"
            width="100%"
            height="100%"
            sx={{ minHeight: 500, borderRadius: 2 }}
          />
        </Box>
      </Box>
    );
  }

  const handleSetLeft = (name) => dp(setLeftComponent({ name, props: {} }));
  const handleSetRight = (name) => dp(setRightComponent({ name, props: {} }));

  // Toggle Friends visibility on the non-map side (or left by default).
  const friendsVisible =
    leftComponent?.name === "friends" || rightComponent?.name === "friends";
  const handleToggleFriends = () => {
    if (friendsVisible) {
      // Restore chat on whichever side currently shows friends
      if (leftComponent?.name === "friends") handleSetLeft("chat");
      else handleSetRight("chat");
      return;
    }
    // Put friends on the non-map side (prefer left if no map)
    if (rightIsMap) handleSetLeft("friends");
    else if (leftIsMap) handleSetRight("friends");
    else handleSetLeft("friends");
  };

  // Only render the page content if authenticated and not loading
  return (
    <>
      {/* Offline overlay */}
      {isOffline && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm select-none"
          style={{ pointerEvents: "auto" }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center max-w-xs mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
              No Internet Connection
            </h2>
            <p className="text-gray-700 dark:text-gray-200 mb-4">
              Please check your connection.
              <br />
              The app is paused until you are back online.
            </p>
            <div className="animate-pulse text-4xl">📡</div>
          </div>
        </div>
      )}

      {/* Floating Panel Toolbar */}
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 900,
          borderRadius: 3,
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        {hasChat && (
          <Tooltip title={chatCollapsed ? "Expand chat" : "Collapse chat"}>
            <IconButton
              size="small"
              onClick={() => toggleCollapse(chatSide)}
            >
              {chatSide === "left"
                ? (chatCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />)
                : (chatCollapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />)}
            </IconButton>
          </Tooltip>
        )}

        {hasMap && (
          <Tooltip title={mapCollapsed ? "Expand map" : "Collapse map"}>
            <IconButton
              size="small"
              onClick={() => toggleCollapse(mapSide)}
            >
              {mapSide === "left"
                ? (mapCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />)
                : (mapCollapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />)}
            </IconButton>
          </Tooltip>
        )}

        {(hasChat || hasMap) && (
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        )}

        <Tooltip title={friendsVisible ? "Hide friends" : "Show friends"}>
          <IconButton
            size="small"
            onClick={handleToggleFriends}
            color={friendsVisible ? "primary" : "default"}
          >
            <PeopleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 64px)",
          gap: 1.5,
          pointerEvents: isOffline ? "none" : "auto",
          filter: isOffline ? "blur(4px)" : "none",
          userSelect: isOffline ? "none" : "auto",
        }}
      >
        <Box
          sx={{
            width:
              collapsedSide === "left"
                ? "0%"
                : collapsedSide === "right"
                ? "100%"
                : "50%",
            flexShrink: 0,
            overflow: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
            visibility: collapsedSide === "left" ? "hidden" : "visible",
          }}
        >
          {leftComponent ? (
            renderComponent(leftComponent)
          ) : (
            <div>No Left Component</div>
          )}
        </Box>
        <Box
          sx={{
            width:
              collapsedSide === "right"
                ? "0%"
                : collapsedSide === "left"
                ? "100%"
                : "50%",
            flexShrink: 0,
            overflow: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
            visibility: collapsedSide === "right" ? "hidden" : "visible",
          }}
        >
          {rightComponent ? (
            renderComponent(rightComponent)
          ) : (
            <div>No Right Component</div>
          )}
        </Box>
      </Box>
    </>
  );
}
