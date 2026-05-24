"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  alpha,
  Fade,
  Avatar,
  LinearProgress,
} from "@mui/material";

// Skeleton for loading states
import { DashboardSkeleton } from "@/components/UI/StyledComponents";
import { OfflineNotice } from "@/components/UI/NetworkBanner";

// Icons for stats & quick actions
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MapIcon from "@mui/icons-material/Map";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import MessageIcon from "@mui/icons-material/Message";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// Redux thunks
import {
  fetchCurrentUser,
  fetchAllUsers,
} from "@/utils/redux/thunks/userThunks";
import { fetchChats } from "@/utils/redux/thunks/chatThunks";
import { fetchPrescriptions } from "@/utils/redux/thunks/prescriptionThunks";
import {
  fetchUserStats,
  fetchChatStats,
  fetchActivityLogs,
  fetchPrescriptionStats,
} from "@/utils/redux/thunks/adminThunks";
import { clearAdminError } from "@/utils/redux/adminSlice";
import { useSocket } from "@/utils/hooks/useSocket";

// Role utility
import { inferRole, coerceRoles } from "@/utils/roleUtils";

// v0 Dashboard widgets — lazy-loaded to reduce initial bundle for non-dashboard pages
import dynamic from "next/dynamic";
import {
  StatsCard,
  ActivityFeed,
  QuickActions,
  AlertsPanel,
  UpcomingTasks,
} from "@/components/Dashboard";

const HealthMetricsCard = dynamic(
  () => import("@/components/Dashboard/HealthMetricsCard"),
  { ssr: false },
);
const PatientHealthChart = dynamic(
  () => import("@/components/Dashboard/PatientHealthChart"),
  { ssr: false },
);
const SentimentWidget = dynamic(
  () => import("@/components/Dashboard/SentimentWidget"),
  { ssr: false },
);
const DoctorDashboard = dynamic(
  () => import("@/components/Dashboard/DoctorDashboard"),
  { ssr: false },
);
const PharmacyDashboard = dynamic(
  () => import("@/components/Dashboard/PharmacyDashboard"),
  { ssr: false },
);

import { createDashboardCardSx } from "@/utils/themeUtils";

// ═══════════════════════════════════════════════════════
// Patient Dashboard — primary user view
// ═══════════════════════════════════════════════════════

const PatientDashboard = React.memo(function PatientDashboard({ currentUser, chats, prescriptions, messages }) {
  const recentMessages = Array.isArray(messages)
    ? messages.slice(-5).reverse()
    : [];

  const prescriptionCount = Array.isArray(prescriptions) ? prescriptions.length : 0;
  const chatCount = Array.isArray(chats) ? chats.length : 0;

  // ── Derive prescription health chart data from prescription status ───
  const prescriptionStatusCounts = React.useMemo(() => {
    if (!Array.isArray(prescriptions) || prescriptions.length === 0) return [];
    const counts = {};
    prescriptions.forEach((c) => {
      const status = c.status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [prescriptions]);

  // ── Derive activity items from recent messages ───────
  const activityItems = React.useMemo(() => {
    return recentMessages.map((msg) => ({
      id: msg._id,
      user: msg.senderName || msg.sender?.name || "Unknown",
      action: "sent a message",
      detail: msg.content || msg.text || "(no text)",
      type: "message",
      timestamp: msg.createdAt || msg.updatedAt,
      avatarUrl: msg.sender?.profilePic,
    }));
  }, [recentMessages]);

  // ── Derive upcoming tasks from prescriptions ─────────────────
  const prescriptionTasks = React.useMemo(() => {
    if (!Array.isArray(prescriptions)) return [];
    return prescriptions
      .filter((c) => c.status !== "Completed" && c.status !== "Archived")
      .slice(0, 6)
      .map((c) => ({
        id: c._id,
        title: c.name || "Unnamed Prescription",
        dueDate: c.startDate,
        priority:
          c.status === "Prescribed"
            ? "high"
            : c.status === "Active"
              ? "medium"
              : "low",
        status:
          c.status === "Prescribed"
            ? "pending"
            : c.status === "Active"
              ? "in-progress"
              : "pending",
        category: c.dosage || c.status,
        completed: c.status === "Completed",
      }));
  }, [prescriptions]);

  // ── Derive alerts from prescription health ───────────────────
  const prescriptionAlerts = React.useMemo(() => {
    const alerts = [];

    // Alert for prescriptions without a status
    const unknownPrescriptions = Array.isArray(prescriptions)
      ? prescriptions.filter((c) => !c.status)
      : [];
    if (unknownPrescriptions.length > 0) {
      alerts.push({
        id: "unknown-status",
        title: `${unknownPrescriptions.length} prescription(s) missing status`,
        message: "Update prescription records to track health accurately.",
        severity: "warning",
      });
    }

    // Alert for prescribed prescriptions (need attention)
    const prescribedCount = Array.isArray(prescriptions)
      ? prescriptions.filter((c) => c.status === "Prescribed").length
      : 0;
    if (prescribedCount > 0) {
      alerts.push({
        id: "prescribed-attention",
        title: `${prescribedCount} recently prescribed prescription(s)`,
        message: "Monitor newly prescribed treatments for early care issues.",
        severity: "info",
      });
    }

    // Online status
    if (currentUser?.status === "online") {
      alerts.push({
        id: "online",
        title: "You are online",
        message: "Real-time updates are active.",
        severity: "success",
      });
    }

    return alerts;
  }, [prescriptions, currentUser?.status]);

  // ── Quick action definitions ─────────────────────────
  const patientActions = [
    {
      label: "Manage Prescriptions",
      href: "/prescriptions",
      icon: MedicalServicesIcon,
      color: "primary",
      description: "Add and track prescriptions",
    },
    {
      label: "Go to Chat",
      href: "/home",
      icon: ChatBubbleOutlineIcon,
      color: "info",
      description: "Message other users",
    },
    {
      label: "View Map",
      href: "/monitoring",
      icon: MapIcon,
      color: "success",
      description: "Location monitoring",
    },
    {
      label: "Edit Profile",
      href: "/profile",
      icon: PersonIcon,
      color: "warning",
      description: "Update your info",
    },
  ];

  // Greeting based on time of day
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <Stack spacing={3}>
      {/* ── Welcome Header ────────────────────────────────── */}
      <Fade in timeout={500}>
        <Card sx={{
          background: "linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(76,175,80,0.04) 100%)",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          borderRadius: 3,
        }}>
          <CardContent sx={{ py: 2.5, px: 3, "&:last-child": { pb: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{
                  bgcolor: "primary.main",
                  width: 48,
                  height: 48,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                }}>
                  {currentUser?.name?.charAt(0)?.toUpperCase() || "F"}
                </Avatar>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {greeting}, {currentUser?.name?.split(" ")[0] || "Patient"}
                    </Typography>
                    <WavingHandIcon sx={{ fontSize: 20, color: "warning.main" }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Here&apos;s your care overview for today
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: "10px !important" }} />}
                  label={currentUser?.status === "online" ? "Online" : "Offline"}
                  size="small"
                  color={currentUser?.status === "online" ? "success" : "default"}
                  variant="outlined"
                  sx={{ fontWeight: 600, height: 28 }}
                />
                <Chip
                  icon={<CalendarTodayIcon sx={{ fontSize: "14px !important" }} />}
                  label={new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500, height: 28 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* ── Stats Cards Row ─────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Prescriptions"
            value={prescriptionCount}
            icon={MedicalServicesIcon}
            subtitle="Active prescriptions on record"
            variant="gradient"
            color="primary"
            index={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Active Chats"
            value={chatCount}
            icon={ChatBubbleOutlineIcon}
            subtitle="Ongoing conversations"
            color="info"
            index={1}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Messages"
            value={recentMessages.length}
            icon={MailOutlineIcon}
            subtitle="Recent messages"
            color="warning"
            index={2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Account Status"
            value={currentUser?.status === "online" ? "Online" : "Offline"}
            icon={FiberManualRecordIcon}
            subtitle={currentUser?.name || "—"}
            color={currentUser?.status === "online" ? "success" : "error"}
            index={3}
          />
        </Grid>
      </Grid>

      {/* ── Chart + HealthMetrics Row ─────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <PatientHealthChart
            data={prescriptionStatusCounts}
            title="Prescription Status Overview"
            subtitle="Distribution of prescription statuses"
            index={4}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HealthMetricsCard index={5} />
        </Grid>
      </Grid>

      {/* ── Activity + Tasks Row ────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ActivityFeed
            items={activityItems}
            title="Recent Messages"
            index={6}
            headerAction={
              <Button
                size="small"
                variant="outlined"
                href="/home"
                component={Link}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                View Chat
              </Button>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <UpcomingTasks
            tasks={prescriptionTasks}
            title="Prescription Tasks"
            index={7}
            headerAction={
              <Button
                size="small"
                variant="outlined"
                href="/prescriptions"
                component={Link}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                View All
              </Button>
            }
          />
        </Grid>
      </Grid>

      {/* ── Alerts Panel ────────────────────────────────── */}
      {prescriptionAlerts.length > 0 && (
        <AlertsPanel alerts={prescriptionAlerts} title="Care Alerts" index={8} />
      )}

      {/* ── Quick Actions ───────────────────────────────── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <DashboardIcon sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Quick Actions
          </Typography>
        </Stack>
        <QuickActions actions={patientActions} index={9} columns={4} />
      </Box>
    </Stack>
  );
});

// ═══════════════════════════════════════════════════════
// Admin Dashboard — rich platform overview (Todo 4)
// Uses admin thunks / slice for real-time stats, charts,
// activity logs, and platform health monitoring.
// ═══════════════════════════════════════════════════════

const AdminDashboard = React.memo(function AdminDashboard({ allUsers = [] }) {
  const dispatch = useDispatch();
  const {
    userStats,
    prescriptionStats,
    chatStats,
    activityLogs,
    loading: adminLoading,
    error: adminError,
  } = useSelector((state) => state.admin);

  // ── Fetch admin stats on mount ───────────────────────
  React.useEffect(() => {
    dispatch(fetchUserStats());
    dispatch(fetchPrescriptionStats());
    dispatch(fetchChatStats());
    dispatch(fetchActivityLogs({ limit: 10 }));
  }, [dispatch]);

  // ── Refresh handler ──────────────────────────────────
  const handleRefresh = React.useCallback(() => {
    dispatch(fetchUserStats());
    dispatch(fetchPrescriptionStats());
    dispatch(fetchChatStats());
    dispatch(fetchActivityLogs({ limit: 10 }));
  }, [dispatch]);

  // ── Derive numeric values ────────────────────────────
  const totalUsers = userStats?.totalUsers ?? 0;
  const onlineCount = React.useMemo(() => {
    if (!Array.isArray(userStats?.byOnlineStatus)) return 0;
    return (
      userStats.byOnlineStatus.find((s) => s.status === "online")?.count ?? 0
    );
  }, [userStats?.byOnlineStatus]);

  const totalChats = chatStats?.chats?.total ?? 0;
  const totalMessages = chatStats?.messages?.total ?? 0;
  const totalPrescriptions = prescriptionStats?.totalPrescriptions ?? 0;
  const newUsersInRange = userStats?.newUsersInRange ?? 0;
  const newPrescriptionsInRange = prescriptionStats?.prescriptionsCreatedInRange ?? 0;
  const newChatsInRange = chatStats?.chats?.createdInRange ?? 0;
  const messagesInRange = chatStats?.messages?.inRange ?? 0;

  // ── Trend labels ─────────────────────────────────────
  const userTrend =
    newUsersInRange > 0
      ? `+${newUsersInRange} in last 30 days`
      : "No new users";
  const chatTrend =
    newChatsInRange > 0 ? `+${newChatsInRange} new chats` : "No new chats";
  const prescriptionTrend =
    newPrescriptionsInRange > 0 ? `+${newPrescriptionsInRange} new prescriptions` : "No new prescriptions";
  const onlineTrend = `${totalUsers > 0 ? Math.round((onlineCount / totalUsers) * 100) : 0}% of total`;

  // ── Chart data: User growth by day ───────────────────
  const userGrowthData = React.useMemo(() => {
    if (!Array.isArray(userStats?.newUsersByDay)) return [];
    return userStats.newUsersByDay.map((d) => ({
      name: d.day,
      value: d.count,
    }));
  }, [userStats?.newUsersByDay]);

  // ── Chart data: Prescription distribution by status ──────────
  const prescriptionStatusData = React.useMemo(() => {
    if (!Array.isArray(prescriptionStats?.byStatus)) return [];
    return prescriptionStats.byStatus.map((d) => ({
      name: d.status || "Unknown",
      value: d.count,
    }));
  }, [prescriptionStats?.byStatus]);

  // ── Chart data: Messages by day ──────────────────────
  const messagesByDayData = React.useMemo(() => {
    if (!Array.isArray(chatStats?.messages?.byDay)) return [];
    return chatStats.messages.byDay.map((d) => ({
      name: d.day,
      value: d.count,
    }));
  }, [chatStats?.messages?.byDay]);

  // ── Top senders ──────────────────────────────────────
  const topSenders = chatStats?.activity?.topSenders ?? [];

  // ── Activity items from logs ─────────────────────────
  const activityItems = React.useMemo(() => {
    if (!Array.isArray(activityLogs?.items)) return [];
    return activityLogs.items.map((log) => ({
      id: log._id,
      user: log.actorName || log.actorId || "System",
      action: log.action || "performed action",
      detail: log.entityType
        ? `${log.entityType}${log.entityId ? ` #${String(log.entityId).slice(-6)}` : ""}`
        : "",
      type:
        log.entityType === "message"
          ? "message"
          : log.entityType === "prescription"
            ? "prescription"
            : log.entityType === "user"
              ? "login"
              : log.entityType === "group"
                ? "group"
                : "system",
      timestamp: log.createdAt,
    }));
  }, [activityLogs?.items]);

  // ── Platform health alerts (derived) ─────────────────
  const platformAlerts = React.useMemo(() => {
    const alerts = [];

    if (totalUsers > 0 && onlineCount === 0) {
      alerts.push({
        id: "no-online",
        title: "No users currently online",
        message: "All registered users are offline.",
        severity: "warning",
      });
    } else if (onlineCount > 0) {
      alerts.push({
        id: "users-online",
        title: `${onlineCount} user(s) online`,
        message: `${onlineCount} of ${totalUsers} users are currently active.`,
        severity: "success",
      });
    }

    if (newUsersInRange > 5) {
      alerts.push({
        id: "growth",
        title: `${newUsersInRange} new users this month`,
        message: "User base is active steadily.",
        severity: "success",
      });
    } else if (newUsersInRange === 0 && totalUsers > 0) {
      alerts.push({
        id: "no-growth",
        title: "No new user registrations",
        message: "Consider promoting the platform to attract new patients.",
        severity: "info",
      });
    }

    if (messagesInRange > 0) {
      alerts.push({
        id: "msgs-active",
        title: `${messagesInRange} messages sent recently`,
        message: "Chat system is active and healthy.",
        severity: "success",
      });
    } else if (totalMessages > 0 && messagesInRange === 0) {
      alerts.push({
        id: "msgs-inactive",
        title: "No recent messaging activity",
        message: "No messages have been sent in the selected period.",
        severity: "warning",
      });
    }

    if (adminError) {
      alerts.push({
        id: "admin-error",
        title: "Data load error",
        message:
          typeof adminError === "string"
            ? adminError
            : "Failed to load some admin statistics.",
        severity: "critical",
      });
    }

    return alerts;
  }, [
    totalUsers,
    onlineCount,
    newUsersInRange,
    messagesInRange,
    totalMessages,
    adminError,
  ]);

  // ── Admin quick action definitions ───────────────────
  const adminActions = [
    {
      label: "User Management",
      href: "/admin/users",
      icon: PeopleIcon,
      color: "primary",
      description: "Manage users & roles",
    },
    {
      label: "Activity Logs",
      href: "/admin/logs",
      icon: HistoryIcon,
      color: "warning",
      description: "View system logs",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: InsightsIcon,
      color: "info",
      description: "Platform insights",
    },
    {
      label: "Groups",
      href: "/groups",
      icon: GroupsIcon,
      color: "success",
      description: "Manage groups",
    },
  ];

  return (
    <Stack spacing={3}>
      {/* ── Admin Welcome Header ─────────────────────────── */}
      <Fade in timeout={500}>
        <Card sx={{
          background: "linear-gradient(135deg, rgba(27,94,32,0.1) 0%, rgba(46,125,50,0.05) 50%, rgba(76,175,80,0.03) 100%)",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
          borderRadius: 3,
        }}>
          <CardContent sx={{ py: 2.5, px: 3, "&:last-child": { pb: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{
                  bgcolor: "primary.dark",
                  width: 48,
                  height: 48,
                }}>
                  <AdminPanelSettingsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Admin Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Platform overview and system health monitoring
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${totalUsers} users`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, height: 28 }}
                />
                <IconButton
                  onClick={handleRefresh}
                  disabled={adminLoading}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": { transform: "rotate(180deg)", borderColor: "primary.main" },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            {adminLoading && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
          </CardContent>
        </Card>
      </Fade>

      {/* ── Error Banner ────────────────────────────────── */}
      {adminError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2.5 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => dispatch(clearAdminError())}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Dismiss
            </Button>
          }
        >
          {typeof adminError === "string"
            ? adminError
            : "Failed to load admin data."}
        </Alert>
      )}

      {/* ── Stats Cards Row ─────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Users"
            value={adminLoading && !userStats ? "—" : totalUsers}
            icon={PeopleIcon}
            variant="gradient"
            color="primary"
            trend={userTrend}
            trendDirection={newUsersInRange > 0 ? "up" : "neutral"}
            subtitle="Registered platform users"
            index={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Chats"
            value={adminLoading && !chatStats ? "—" : totalChats}
            icon={ChatBubbleOutlineIcon}
            color="info"
            trend={chatTrend}
            trendDirection={newChatsInRange > 0 ? "up" : "neutral"}
            subtitle={`${chatStats?.chats?.group ?? 0} group · ${chatStats?.chats?.direct ?? 0} direct`}
            index={1}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Prescriptions"
            value={adminLoading && !prescriptionStats ? "—" : totalPrescriptions}
            icon={MedicalServicesIcon}
            color="success"
            trend={prescriptionTrend}
            trendDirection={newPrescriptionsInRange > 0 ? "up" : "neutral"}
            subtitle={`${prescriptionStats?.prescriptionsCreatedInRange ?? 0} new this period`}
            index={2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Online Users"
            value={adminLoading && !userStats ? "—" : onlineCount}
            icon={FiberManualRecordIcon}
            color={onlineCount > 0 ? "warning" : "error"}
            trend={onlineTrend}
            trendDirection={onlineCount > 0 ? "up" : "neutral"}
            subtitle="Currently active"
            index={3}
          />
        </Grid>
      </Grid>

      {/* ── User Growth + Prescription Distribution Charts ──────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PatientHealthChart
            data={userGrowthData}
            title="User Growth"
            subtitle="New registrations per day (last 30 days)"
            loading={adminLoading && !userStats}
            index={4}
            headerAction={
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={adminLoading}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PatientHealthChart
            data={prescriptionStatusData}
            title="Prescription Distribution"
            subtitle="Prescriptions by current status"
            loading={adminLoading && !prescriptionStats}
            index={5}
          />
        </Grid>
      </Grid>

      {/* ── Messages Chart + Top Senders ────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <PatientHealthChart
            data={messagesByDayData}
            title="Messaging Activity"
            subtitle={`${messagesInRange} messages in selected period`}
            loading={adminLoading && !chatStats}
            index={6}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ ...createDashboardCardSx(7), height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MessageIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Top Senders
                  </Typography>
                </Stack>
                <Chip
                  label={`${totalMessages} total`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                />
              </Stack>
              {topSenders.length === 0 ? (
                <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                  <MessageIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">
                    No messaging data available
                  </Typography>
                </Stack>
              ) : (
                <List disablePadding>
                  {topSenders.slice(0, 5).map((sender, i) => (
                    <ListItem
                      key={sender.senderId || i}
                      disableGutters
                      sx={{
                        py: 0.75,
                        px: 1,
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                        <Avatar sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          bgcolor: i === 0 ? "primary.main" : i === 1 ? "success.main" : "action.selected",
                          color: i < 2 ? "white" : "text.primary",
                        }}>
                          {i + 1}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {sender.name || sender.email || "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sender.count} message{sender.count !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {chatStats?.activity?.activeSendersInRange ?? 0} active senders
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {chatStats?.activity?.activeChatsInRange ?? 0} active chats
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Activity Feed + Platform Alerts ─────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ActivityFeed
            items={activityItems}
            title="Recent Activity"
            index={8}
            maxItems={8}
            headerAction={
              <Button
                size="small"
                variant="outlined"
                href="/admin/logs"
                component={Link}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                View All Logs
              </Button>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <AlertsPanel
            alerts={platformAlerts}
            title="Platform Health"
            index={9}
          />
        </Grid>
      </Grid>

      {/* ── User Breakdown Summary ──────────────────────── */}
      {userStats?.byRole && userStats.byRole.length > 0 && (
        <Card sx={{ ...createDashboardCardSx(10), borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <PeopleIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                User Breakdown
              </Typography>
            </Stack>
            <Grid container spacing={2.5}>
              {/* By Role */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  By Role
                </Typography>
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  {userStats.byRole.map((r) => (
                    <Stack
                      key={r.role}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1, px: 1, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ textTransform: "capitalize", fontWeight: 500 }}
                      >
                        {r.role || "unassigned"}
                      </Typography>
                      <Chip
                        label={r.count}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Grid>

              {/* By Account Type */}
              {userStats.byAccount && userStats.byAccount.length > 0 && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    By Account Type
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                    {userStats.byAccount.map((a) => (
                      <Stack
                        key={a.account}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ py: 1, px: 1, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ textTransform: "capitalize", fontWeight: 500 }}
                        >
                          {a.account || "standard"}
                        </Typography>
                        <Chip
                          label={a.count}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              )}

              {/* By Online Status */}
              {userStats.byOnlineStatus &&
                userStats.byOnlineStatus.length > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      By Status
                    </Typography>
                    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                      {userStats.byOnlineStatus.map((s) => (
                        <Stack
                          key={s.status}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ py: 1, px: 1, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: 10,
                                color:
                                  s.status === "online"
                                    ? "success.main"
                                    : "text.disabled",
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ textTransform: "capitalize", fontWeight: 500 }}
                            >
                              {s.status || "unknown"}
                            </Typography>
                          </Stack>
                          <Chip
                            label={s.count}
                            size="small"
                            color={s.status === "online" ? "success" : "default"}
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  </Grid>
                )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ── Sentiment Overview ─────────────────────────── */}
      <SentimentWidget users={allUsers} />

      {/* ── Quick Actions ───────────────────────────────── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Admin Actions
          </Typography>
        </Stack>
        <QuickActions actions={adminActions} index={11} columns={4} />
      </Box>
    </Stack>
  );
});

// ═══════════════════════════════════════════════════════
// Dashboard Page — role-based routing
// ═══════════════════════════════════════════════════════

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const { on } = useSocket();

  const { currentUser, chats, prescriptions, messages, allUsers, loading, error } =
    useSelector(
      (state) => ({
        currentUser: state.user?.currentUser,
        chats: state.chat?.chats || [],
        prescriptions: state.prescription?.prescriptions || [],
        messages: state.message?.messages || [],
        allUsers: state.user?.allUsers || [],
        loading: state.user?.loading || false,
        error: state.user?.error,
      }),
      shallowEqual,
    );

  // Socket listeners for real-time updates — debounced to prevent rapid-fire refetches
  React.useEffect(() => {
    let usersTimer = null;
    let chatsTimer = null;

    const debouncedFetchUsers = () => {
      clearTimeout(usersTimer);
      usersTimer = setTimeout(() => dispatch(fetchAllUsers({ force: true })), 2000);
    };
    const debouncedFetchChats = () => {
      clearTimeout(chatsTimer);
      chatsTimer = setTimeout(() => dispatch(fetchChats({ force: true })), 1000);
    };

    const cleanupOnline = on("user-online", debouncedFetchUsers);
    const cleanupOffline = on("user-offline", debouncedFetchUsers);
    const cleanupMessage = on("receiveMessage", debouncedFetchChats);

    return () => {
      clearTimeout(usersTimer);
      clearTimeout(chatsTimer);
      cleanupOnline?.();
      cleanupOffline?.();
      cleanupMessage?.();
    };
  }, [on, dispatch]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      dispatch(fetchCurrentUser());
      dispatch(fetchChats());
      dispatch(fetchPrescriptions());
      dispatch(fetchAllUsers());
    }
  }, [status, session, dispatch]);

  // ── Loading / Error states ───────────────────────────
  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  if (status === "unauthenticated") {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        You must be logged in to view the dashboard.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        Error loading dashboard: {error}
      </Alert>
    );
  }

  const role = inferRole(currentUser?.roles || session?.user?.roles);

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      <OfflineNotice feature="Dashboard" />
      {role === "patient" && (
        <PatientDashboard
          currentUser={currentUser}
          chats={chats}
          prescriptions={prescriptions}
          messages={messages}
        />
      )}

      {role === "doctor" && <DoctorDashboard currentUser={currentUser} />}

      {role === "pharmacy" && <PharmacyDashboard currentUser={currentUser} />}

      {role === "admin" && <AdminDashboard allUsers={allUsers} />}
    </Box>
  );
}
