"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProfilePicUrl } from "@/utils/profilePic";
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Badge,
  InputBase,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";

import SidebarNav from "@/components/SidebarNav";
import NetworkBanner from "@/components/UI/NetworkBanner";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { useSession } from "next-auth/react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getPushPermissionStatus,
} from "@/lib/pushNotifications";
import { useGlobalSocketNotifications } from "@/utils/hooks/useGlobalSocketNotifications";
import {
  markAllRead,
  dismissNotification,
} from "@/utils/redux/notificationSlice";
import logger from "@/lib/logger";

const SIDEBAR_WIDTH = 264;

// ── Page title mapping ──
const PAGE_META = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your activity and key metrics",
  },
  "/home": {
    title: "Home",
    description: "Chat with users and explore the map",
  },
  "/prescriptions": { title: "Prescriptions", description: "Manage your prescription records" },
  "/monitoring": {
    title: "Monitoring",
    description: "Track prescription health and progress",
  },
  "/groups": {
    title: "Groups",
    description: "Collaborate with your community",
  },
  "/analytics": {
    title: "Analytics",
    description: "Performance insights and statistics",
  },
  "/profile": { title: "Profile", description: "Your account information" },
  "/settings": {
    title: "Settings",
    description: "Manage your preferences",
  },
  "/help": { title: "Help", description: "Guides and support resources" },
  "/logout": { title: "Logout", description: "Sign out of your account" },
  "/admin/users": {
    title: "User Management",
    description: "View and manage system users",
  },
  "/admin/logs": {
    title: "Activity Logs",
    description: "Review system activity",
  },
  "/calendar": { title: "Calendar", description: "Scheduled events and prescriptions" },
};

function getPageMeta(pathname) {
  if (!pathname) return { title: "CareConnect", description: "" };
  // Exact match first
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  // Prefix match
  const match = Object.keys(PAGE_META).find(
    (key) => key !== "/" && pathname.startsWith(key),
  );
  return match ? PAGE_META[match] : { title: "CareConnect", description: "" };
}

function useIsShellDisabled(pathname) {
  if (!pathname) return true;
  if (pathname === "/") return true;
  if (pathname.startsWith("/api")) return true;
  return pathname === "/login" || pathname === "/signup";
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isDisabled = useIsShellDisabled(pathname);
  const muiTheme = useTheme();

  const { darkMode, toggleDarkMode } = useAppTheme();
  const { status: sessionStatus } = useSession();
  const dispatch = useDispatch();

  // Only extract the wards AppShell actually uses — avoids re-renders from
  // unrelated currentUser mutations (e.g. status changes, new wards).
  const currentUser = useSelector(
    (state) => {
      const u = state.user.currentUser;
      if (!u) return null;
      return { name: u.name, email: u.email, profilePic: u.profilePic };
    },
    shallowEqual,
  );

  // Notification state from Redux
  const notifications = useSelector((s) => s.notification?.notifications ?? []);
  const unreadCount = useSelector((s) => s.notification?.unreadCount ?? 0);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifAnchor, setNotifAnchor] = React.useState(null);

  // Wire global socket notifications to notistack + Redux
  useGlobalSocketNotifications();

  // Register push service worker and re-subscribe for authenticated users
  React.useEffect(() => {
    if (sessionStatus !== "authenticated" || !isPushSupported()) return;

    let cancelled = false;
    (async () => {
      try {
        await registerServiceWorker();
        if (cancelled) return;
        // If permission was previously granted, silently refresh subscription
        if (getPushPermissionStatus() === "granted") {
          await subscribeToPush();
          logger.log("[AppShell] Push subscription refreshed");
        }
      } catch (err) {
        logger.warn("[AppShell] Push setup error:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionStatus]);

  const handleDrawerToggle = React.useCallback(
    () => setMobileOpen((prev) => !prev),
    [],
  );
  const handleDrawerClose = React.useCallback(() => setMobileOpen(false), []);

  const pageMeta = getPageMeta(pathname);

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : currentUser?.email
      ? currentUser.email.charAt(0).toUpperCase()
      : "U";

  // ── Bypass shell on auth/landing pages ──
  if (isDisabled) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* ═══════════════════ Skip Link ═══════════════════ */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.currentTarget.style.cssText =
            "position:fixed;top:8px;left:8px;width:auto;height:auto;overflow:visible;" +
            "background:#fff;color:#000;padding:8px 16px;border-radius:8px;z-index:9999;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
        }}
        onBlur={(e) => {
          e.currentTarget.style.cssText =
            "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;";
        }}
      >
        Skip to main content
      </a>

      {/* ═══════════════════ Sidebar — Desktop ═══════════════════ */}
      <Box
        component="nav"
        sx={{
          width: { lg: SIDEBAR_WIDTH },
          flexShrink: { lg: 0 },
        }}
        aria-label="main navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: SIDEBAR_WIDTH,
              borderRight: "none",
            },
          }}
        >
          <SidebarNav onItemClick={handleDrawerClose} />
        </Drawer>

        {/* Desktop permanent */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: SIDEBAR_WIDTH,
            },
          }}
          open
        >
          <SidebarNav />
        </Drawer>
      </Box>

      {/* ═══════════════════ Main Content Area ═══════════════════ */}
      <Box
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* ── Top Header Bar ── */}
        <AppBar
          position="sticky"
          sx={{
            width: "100%",
            boxShadow: "none",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            backdropFilter: "blur(12px)",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(18,18,18,0.85)"
                : "rgba(255,255,255,0.85)",
          }}
        >
          <Toolbar
            sx={{
              gap: { xs: 1, md: 2 },
              px: { xs: 2, md: 3 },
              minHeight: { xs: 56, md: 64 },
            }}
          >
            {/* Mobile hamburger */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { lg: "none" }, mr: 0.5 }}
              aria-label="open navigation"
            >
              <MenuIcon />
            </IconButton>

            {/* Search Input */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                maxWidth: { xs: "100%", md: 400 },
              }}
            >
              <SearchIcon
                sx={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 18,
                  color: "text.secondary",
                  pointerEvents: "none",
                }}
              />
              <InputBase
                placeholder="Search..."
                sx={{
                  width: "100%",
                  pl: 4.5,
                  pr: { xs: 1.5, md: 7 },
                  py: 0.75,
                  fontSize: "0.8125rem",
                  borderRadius: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused": {
                    borderColor: "primary.main",
                    boxShadow: (theme) =>
                      `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
              />
              {/* Keyboard shortcut badge */}
              <Box
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  px: 0.75,
                  py: 0.25,
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "text.secondary",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                ⌘K
              </Box>
            </Box>

            {/* Right actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Mail */}
              <Tooltip title="Messages">
                <IconButton
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <MailOutlineIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  onClick={(e) => setNotifAnchor(e.currentTarget)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    invisible={unreadCount === 0}
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.65rem",
                        minWidth: 16,
                        height: 16,
                      },
                    }}
                  >
                    <NotificationsNoneIcon sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(notifAnchor)}
                anchorEl={notifAnchor}
                onClose={() => setNotifAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: { width: 360, maxHeight: 440 },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={() => dispatch(markAllRead())}
                    >
                      Mark all read
                    </Button>
                  )}
                </Box>
                {notifications.filter((n) => !n.dismissed).length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No notifications
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ p: 0, maxHeight: 360, overflow: "auto" }}>
                    {notifications
                      .filter((n) => !n.dismissed)
                      .slice(0, 30)
                      .map((n) => {
                        const iconMap = {
                          success: <CheckCircleOutlineIcon color="success" fontSize="small" />,
                          error: <ErrorOutlineIcon color="error" fontSize="small" />,
                          warning: <WarningAmberIcon color="warning" fontSize="small" />,
                          info: <InfoOutlinedIcon color="info" fontSize="small" />,
                        };
                        const ago = (() => {
                          const diff = Date.now() - n.timestamp;
                          if (diff < 60000) return "just now";
                          if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                          if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                          return `${Math.floor(diff / 86400000)}d ago`;
                        })();
                        return (
                          <ListItem
                            key={n.id}
                            sx={{
                              borderLeft: (t) =>
                                `3px solid ${t.palette[n.type]?.main || t.palette.info.main}`,
                              bgcolor: n.read
                                ? "transparent"
                                : (t) =>
                                    t.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.04)"
                                      : "rgba(0,0,0,0.02)",
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => dispatch(dismissNotification(n.id))}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            }
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {iconMap[n.type] || iconMap.info}
                            </ListItemIcon>
                            <ListItemText
                              primary={n.message}
                              secondary={ago}
                              primaryTypographyProps={{ fontSize: "0.8125rem" }}
                              secondaryTypographyProps={{ fontSize: "0.6875rem" }}
                            />
                          </ListItem>
                        );
                      })}
                  </List>
                )}
              </Popover>

              {/* Theme toggle */}
              <Tooltip title={darkMode ? "Light mode" : "Dark mode"}>
                <IconButton
                  size="small"
                  onClick={toggleDarkMode}
                  aria-label={
                    darkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  {darkMode ? (
                    <LightModeIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <DarkModeIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* User avatar + info */}
              {currentUser && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pl: { xs: 1, md: 2 },
                    ml: { xs: 0.5, md: 1 },
                    borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Avatar
                    src={getProfilePicUrl(currentUser.profilePic, "small") || undefined}
                    component={Link}
                    href="/profile"
                    sx={{
                      width: { xs: 30, md: 34 },
                      height: { xs: 30, md: 34 },
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: (theme) =>
                        `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      "&:hover": {
                        borderColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.5),
                      },
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <Box
                    sx={{
                      display: { xs: "none", sm: "block" },
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        lineHeight: 1.3,
                      }}
                      noWrap
                    >
                      {currentUser.name || "User"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{
                        display: "block",
                        fontSize: "0.625rem",
                      }}
                    >
                      {currentUser.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── Network Status Banner ── */}
        <NetworkBanner />

        {/* ── Page Header (title + description) ── */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 3 },
            pb: { xs: 1.5, md: 2 },
            animation: "slideInUp 0.4s ease-out",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "text.primary",
              mb: 0.25,
            }}
          >
            {pageMeta.title}
          </Typography>
          {pageMeta.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.75rem", md: "0.8125rem" } }}
            >
              {pageMeta.description}
            </Typography>
          )}
        </Box>

        {/* ── Main Content ── */}
        <Box
          id="main-content"
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 3 },
            pb: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
