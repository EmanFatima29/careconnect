"use client";
import logger from "@/lib/logger";
import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Paper,
  Select,
  FormControl,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  alpha,
  Skeleton,
  Fade,
  Grow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAnalyticsMetrics,
  fetchUserActivity,
  fetchMessageStats,
  fetchLocationStats,
  fetchGroupStats,
} from "@/utils/redux/analyticsSlice";
import {
  fetchUserStats,
  fetchPrescriptionStats,
  fetchChatStats,
} from "@/utils/redux/thunks/adminThunks";
import { handleFetchError, formatErrorMessage } from "@/utils/errorHandler";
import {
  setupAnalyticsListeners,
  removeAnalyticsListeners,
  handleAnalyticsSocketConnection,
  requestAllAnalyticsViaSocket,
} from "@/lib/socketAnalytics";
import { useAnalyticsSocket } from "@/utils/hooks/useSocket";
import socket from "@/lib/socket";
import { inferRole } from "@/utils/roleUtils";
import { useSession } from "next-auth/react";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import StorageIcon from "@mui/icons-material/Storage";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import InsightsIcon from "@mui/icons-material/Insights";
import { StatsCard } from "@/components/Dashboard";
import {
  createDashboardCardSx,
  CHART_TOOLTIP_STYLE,
  CHART_GRADIENT_ID,
  CHART_GRADIENT_STOPS,
  getChartColors,
} from "@/utils/themeUtils";
import { AnalyticsSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: "1days", label: "Last 24 Hours" },
  { value: "7days", label: "Last 7 Days" },
  { value: "14days", label: "Last 14 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
];

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
  index = 0,
}) {
  return (
    <Grow in timeout={400 + index * 150}>
      <Card
        sx={{
          background: `linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)`,
          color: "white",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-6px) scale(1.02)",
            boxShadow: "0 16px 32px rgba(0, 0, 0, 0.18)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: -50,
            right: -50,
            width: 140,
            height: 140,
            borderRadius: "50%",
            opacity: 0.08,
            backgroundColor: "white",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            borderRadius: "50%",
            opacity: 0.05,
            backgroundColor: "white",
          },
        }}
        style={{
          "--gradient-start":
            color === "primary"
              ? "rgba(46, 125, 50, 0.92)"
              : color === "success"
                ? "rgba(76, 175, 80, 0.92)"
                : color === "info"
                  ? "rgba(25, 118, 210, 0.92)"
                  : "rgba(251, 192, 45, 0.92)",
          "--gradient-end":
            color === "primary"
              ? "rgba(27, 94, 32, 0.97)"
              : color === "success"
                ? "rgba(56, 142, 60, 0.97)"
                : color === "info"
                  ? "rgba(13, 71, 161, 0.97)"
                  : "rgba(245, 127, 23, 0.97)",
        }}
      >
        <CardContent
          sx={{ position: "relative", zIndex: 1, p: { xs: 2, sm: 2.5 } }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.85,
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    fontSize: "0.68rem",
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    mt: 0.5,
                    letterSpacing: "-0.02em",
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </Typography>
              </Box>
              {Icon && (
                <Box
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon sx={{ fontSize: 28, opacity: 0.95 }} />
                </Box>
              )}
            </Stack>
            {trend && (
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                label={trend}
                size="small"
                variant="filled"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  width: "fit-content",
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grow>
  );
}

// Chart Card Component with loading and empty state
function ChartCard({
  title,
  subtitle,
  children,
  isLoading = false,
  isEmpty = false,
  headerAction,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 2.5,
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerAction}
        </Stack>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          {isLoading ? (
            <Stack alignItems="center" spacing={1.5}>
              <CircularProgress
                size={36}
                thickness={4}
                sx={{ color: "primary.main" }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Loading data...
              </Typography>
            </Stack>
          ) : isEmpty ? (
            <Stack alignItems="center" spacing={1}>
              <SignalCellularAltIcon
                sx={{ fontSize: 40, color: "text.disabled" }}
              />
              <Typography variant="body2" color="text.secondary">
                No data available for this period
              </Typography>
            </Stack>
          ) : (
            <Fade in timeout={600}>
              <Box sx={{ width: "100%", height: "100%" }}>{children}</Box>
            </Fade>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Format user activity data from API response
function formatUserActivityData(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item) => ({
    date: item.date
      ? new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "N/A",
    users: item.totalUsers || 0,
    active: item.activeUsers || 0,
  }));
}

// Format message stats from API response
function formatMessageData(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item) => ({
    date: item.date
      ? new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "N/A",
    messages: item.totalMessages || 0,
    groups: item.groupMessages || 0,
  }));
}

// Format location stats from API response
function formatLocationData(data, totalUsers) {
  if (!data || typeof data !== "object") return [];
  const sharing = data.sharingCount || 0;
  const notSharing = Math.max(0, totalUsers - sharing);
  const offline = data.offlineCount || 0;

  return [
    { name: "Sharing", value: sharing, color: "#2e7d32" },
    { name: "Not Sharing", value: notSharing, color: "#90ca77" },
    { name: "Offline", value: offline, color: "#bdbdbd" },
  ];
}

// Format group stats from API response
function formatGroupStats(data) {
  if (!data || typeof data !== "object") return [];
  return [
    { name: "Active", value: data.activeGroups || 0, color: "#2e7d32" },
    { name: "Inactive", value: data.inactiveGroups || 0, color: "#90ca77" },
  ];
}

// Tab Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Admin-specific analytics sub-component
// ═══════════════════════════════════════════════════════
function AdminAnalyticsView() {
  const dispatch = useDispatch();
  const muiTheme = useTheme();
  const chartColors = getChartColors(muiTheme);
  const admin = useSelector((state) => state.admin);
  const {
    userStats,
    cropStats,
    chatStats,
    loading: adminLoading,
  } = admin || {};

  React.useEffect(() => {
    dispatch(fetchUserStats());
    dispatch(fetchPrescriptionStats());
    dispatch(fetchChatStats());
  }, [dispatch]);

  // Format user role distribution for pie chart
  const roleData = React.useMemo(() => {
    if (!userStats?.byRole) return [];
    return Object.entries(userStats.byRole).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof val === "object" && val !== null ? (val.count ?? 0) : val,
    }));
  }, [userStats]);

  // Format new users by day for area chart
  const userGrowthData = React.useMemo(() => {
    if (!userStats?.newUsersByDay) return [];
    return userStats.newUsersByDay.map((d) => ({
      date: new Date(d.date || d._id).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      users: d.count || d.totalUsers || 0,
    }));
  }, [userStats]);

  // Format prescription status distribution
  const cropStatusData = React.useMemo(() => {
    if (!cropStats?.byStatus) return [];
    return Object.entries(cropStats.byStatus).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof val === "object" && val !== null ? (val.count ?? 0) : val,
    }));
  }, [cropStats]);

  // Format chat activity
  const chatActivityData = React.useMemo(() => {
    if (!chatStats?.activity) return [];
    return (Array.isArray(chatStats.activity) ? chatStats.activity : []).map(
      (d) => ({
        date: new Date(d.date || d._id).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        messages: d.count || d.totalMessages || 0,
      }),
    );
  }, [chatStats]);

  const PIE_COLORS = ["#2e7d32", "#4caf50", "#81c784", "#c8e6c9", "#bdbdbd"];

  return (
    <Stack spacing={3}>
      {/* Admin Stats Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={userStats?.totalUsers ?? "—"}
            icon={PeopleIcon}
            trend={
              userStats?.newUsersInRange
                ? `+${userStats.newUsersInRange} new`
                : undefined
            }
            trendDirection="up"
            variant="gradient"
            index={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Online Users"
            value={userStats?.byOnlineStatus?.online ?? "—"}
            icon={GroupsIcon}
            trend={`${userStats?.byOnlineStatus?.offline ?? 0} offline`}
            trendDirection="neutral"
            color="success"
            index={1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Prescriptions"
            value={cropStats?.totalCrops ?? "—"}
            icon={MedicalServicesIcon}
            trend={
              cropStats?.cropsCreatedInRange
                ? `+${cropStats.cropsCreatedInRange} new`
                : undefined
            }
            trendDirection="up"
            color="info"
            index={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Messages"
            value={chatStats?.messages?.total ?? "—"}
            icon={ChatBubbleIcon}
            trend={
              chatStats?.chats?.total
                ? `${chatStats.chats.total} chats`
                : undefined
            }
            trendDirection="up"
            color="warning"
            index={3}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5}>
        {/* User Growth */}
        <Grid item xs={12} md={8}>
          <Card sx={{ ...createDashboardCardSx(4), height: "100%" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                User Growth Trend
              </Typography>
              {adminLoading ? (
                <Skeleton variant="rounded" width="100%" height={280} />
              ) : userGrowthData.length === 0 ? (
                <Box
                  sx={{
                    height: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No growth data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient
                        id="userGrowthGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2e7d32"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2e7d32"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={alpha(muiTheme.palette.divider, 0.5)}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 12,
                        fill: muiTheme.palette.text.secondary,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: muiTheme.palette.text.secondary,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      fill="url(#userGrowthGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Role Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...createDashboardCardSx(5), height: "100%" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                User Distribution
              </Typography>
              {adminLoading ? (
                <Skeleton
                  variant="circular"
                  width={200}
                  height={200}
                  sx={{ mx: "auto" }}
                />
              ) : roleData.length === 0 ? (
                <Box
                  sx={{
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No role data
                  </Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {roleData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    sx={{ mt: 1 }}
                  >
                    {roleData.map((d, i) => (
                      <Stack
                        key={d.name}
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {d.name}: {d.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Charts Row */}
      <Grid container spacing={2}>
        {/* Message Volume */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...createDashboardCardSx(6), height: "100%" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Message Volume
              </Typography>
              {adminLoading ? (
                <Skeleton variant="rounded" width="100%" height={250} />
              ) : chatActivityData.length === 0 ? (
                <Box
                  sx={{
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No message data
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chatActivityData}>
                    <defs>
                      <linearGradient
                        id={CHART_GRADIENT_ID}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        {CHART_GRADIENT_STOPS.map((stop, i) => (
                          <stop key={i} {...stop} />
                        ))}
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={alpha(muiTheme.palette.divider, 0.5)}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 12,
                        fill: muiTheme.palette.text.secondary,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: muiTheme.palette.text.secondary,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar
                      dataKey="messages"
                      fill={`url(#${CHART_GRADIENT_ID})`}
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Prescription Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...createDashboardCardSx(7), height: "100%" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Prescription Distribution
              </Typography>
              {adminLoading ? (
                <Skeleton variant="rounded" width="100%" height={250} />
              ) : cropStatusData.length === 0 ? (
                <Box
                  sx={{
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No prescription data
                  </Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={cropStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {cropStatusData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    flexWrap="wrap"
                    sx={{ mt: 1 }}
                  >
                    {cropStatusData.map((d, i) => (
                      <Stack
                        key={d.name}
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {d.name}: {d.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [tabValue, setTabValue] = React.useState(0);
  const [dateRange, setDateRange] = React.useState("7days");
  const [localError, setLocalError] = React.useState(null);

  // Role detection
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user.currentUser);
  const role = inferRole(currentUser?.roles || session?.user?.roles);

  // Use analytics socket hook for real-time updates
  const { isConnected: socketConnected } = useAnalyticsSocket();

  // Get analytics state from Redux
  const analytics = useSelector((state) => state.analytics);
  const {
    metrics,
    userActivity,
    messageStats,
    locationStats,
    groupStats,
    error,
  } = analytics || {};

  // Fallback to Redux state if available
  const totalUsers = metrics?.totalUsers || 0;
  const onlineUsers = metrics?.onlineUsers || 0;
  const messageCount = metrics?.messageCount || 0;
  const groupCount = metrics?.groupCount || 0;
  const sharingLocation = metrics?.sharingLocation || 0;

  const onlinePercentage =
    totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;
  const groupEngagement =
    groupCount > 0 ? Math.round((messageCount / groupCount) * 10) : 0;

  // Fetch analytics data on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        setLocalError(null);
        dispatch(fetchAnalyticsMetrics());
        dispatch(fetchUserActivity(parseInt(dateRange.match(/\d+/)?.[0] || 7)));
        dispatch(fetchMessageStats(parseInt(dateRange.match(/\d+/)?.[0] || 7)));
        dispatch(fetchLocationStats());
        dispatch(fetchGroupStats());
      } catch (err) {
        const errorMsg = handleFetchError(err, "Analytics Page");
        setLocalError(errorMsg);
        logger.error("Error fetching analytics:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [dispatch, dateRange]);

  // Request analytics data via socket when connected
  React.useEffect(() => {
    if (socketConnected && socket) {
      logger.log("[Analytics] Requesting data via socket");
      requestAllAnalyticsViaSocket(
        socket,
        parseInt(dateRange.match(/\d+/)?.[0] || 7),
      );
    }
  }, [socketConnected, dateRange]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const csvContent = [
        ["Analytics Export Report"],
        ["Generated:", new Date().toLocaleString()],
        [""],
        ["Summary Statistics"],
        ["Total Users", totalUsers],
        ["Online Users", onlineUsers],
        ["Total Messages", messageCount],
        ["Groups Created", groupCount],
        ["Location Sharing", sharingLocation],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      logger.log("Export successful");
    } catch (err) {
      setLocalError("Failed to export analytics");
      logger.error("Export error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setDataLoading(true);
    try {
      setLocalError(null);
      dispatch(fetchAnalyticsMetrics());
      dispatch(fetchUserActivity(parseInt(dateRange.match(/\d+/)?.[0] || 7)));
      dispatch(fetchMessageStats(parseInt(dateRange.match(/\d+/)?.[0] || 7)));
      dispatch(fetchLocationStats());
      dispatch(fetchGroupStats());
    } catch (err) {
      const errorMsg = handleFetchError(err, "Analytics Refresh");
      setLocalError(errorMsg);
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  // Use Redux data from API - format for charts
  const chartUserActivityData = formatUserActivityData(userActivity);
  const chartMessageData = formatMessageData(messageStats);
  const chartLocationData = formatLocationData(locationStats, totalUsers);
  const chartGroupStatsData = formatGroupStats(groupStats);

  const COLORS = ["#2e7d32", "#90ca77", "#bdbdbd"];

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: 2,
                  p: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <InsightsIcon sx={{ color: "white", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    background:
                      "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Analytics Dashboard
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <FiberManualRecordIcon
                    sx={{
                      fontSize: 8,
                      color: socketConnected ? "success.main" : "text.disabled",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {socketConnected ? "Live updates active" : "Connecting..."}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Date Range Selector */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                displayEmpty
                startAdornment={
                  <CalendarTodayIcon
                    sx={{ fontSize: 16, mr: 0.75, color: "text.secondary" }}
                  />
                }
                sx={{
                  borderRadius: 2,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  "& .MuiSelect-select": { py: 0.9 },
                }}
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                size="small"
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "rotate(180deg)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={loading}
              size="small"
              sx={{
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
              }}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                "Export"
              )}
            </Button>
          </Stack>
        </Stack>

        <OfflineNotice feature="Analytics" />

        {/* KPI Cards */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Users"
              value={dataLoading ? "..." : totalUsers}
              icon={PeopleIcon}
              trend={`+${Math.floor(totalUsers * 0.1)} this month`}
              color="primary"
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Online Now"
              value={dataLoading ? "..." : onlineUsers}
              icon={GroupsIcon}
              trend={`${onlinePercentage}% active`}
              color="success"
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Messages"
              value={dataLoading ? "..." : messageCount}
              icon={ChatBubbleIcon}
              trend={`${groupEngagement} avg per group`}
              color="info"
              index={2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Location Sharing"
              value={dataLoading ? "..." : sharingLocation}
              icon={LocationOnIcon}
              trend={`${Math.round((sharingLocation / totalUsers) * 100) || 0}% participation`}
              color="warning"
              index={3}
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                minHeight: 52,
              },
              "& .Mui-selected": {
                color: "primary.main",
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="User Activity" />
            <Tab label="Groups & Chats" />
            <Tab label="Location Data" />
          </Tabs>

          {/* Error Alert */}
          {localError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <ErrorIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {localError}
              </Typography>
            </Alert>
          )}

          {/* Tab 1: Overview */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <ChartCard
                  title="User Activity"
                  subtitle={`${DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || "Last 7 Days"}`}
                  isLoading={dataLoading}
                  isEmpty={chartUserActivityData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartUserActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#2e7d32"
                        strokeWidth={2}
                        dot={{ fill: "#2e7d32", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="active"
                        stroke="#90ca77"
                        strokeWidth={2}
                        dot={{ fill: "#90ca77", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Messages Sent"
                  subtitle={`${DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || "Last 7 Days"}`}
                  isLoading={dataLoading}
                  isEmpty={chartMessageData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartMessageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="messages"
                        fill="#2e7d32"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="groups"
                        fill="#90ca77"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: User Activity */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <ChartCard
                  title="Daily Active Users"
                  subtitle={`Tracking total vs active users - ${DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || "Last 7 Days"}`}
                  isLoading={dataLoading}
                  isEmpty={chartUserActivityData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartUserActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#2e7d32"
                        strokeWidth={3}
                        dot={{ fill: "#2e7d32", r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="active"
                        stroke="#90ca77"
                        strokeWidth={3}
                        dot={{ fill: "#90ca77", r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Groups & Chats */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Group Statistics"
                  subtitle="Active vs inactive groups"
                  isLoading={dataLoading}
                  isEmpty={chartGroupStatsData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartGroupStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartGroupStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Messages Per Group"
                  subtitle="Message distribution across groups"
                  isLoading={dataLoading}
                  isEmpty={chartMessageData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartMessageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar
                        dataKey="messages"
                        fill="#2e7d32"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 4: Location Data */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Location Sharing Status"
                  subtitle="Users sharing vs not sharing location"
                  isLoading={dataLoading}
                  isEmpty={chartLocationData.length === 0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartLocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartLocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%", borderRadius: 3 }}>
                  <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Stack spacing={2.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocationOnIcon
                          sx={{ color: "primary.main", fontSize: 20 }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          Location Insights
                        </Typography>
                      </Stack>
                      <Stack spacing={1.5}>
                        {[
                          {
                            label: "Active Sharers",
                            value: `${sharingLocation} users`,
                            color: "success.main",
                          },
                          {
                            label: "Nearby Clusters",
                            value: `${Math.ceil(sharingLocation / 5)} groups`,
                            color: "info.main",
                          },
                          {
                            label: "Avg Radius",
                            value: "~8.5 km",
                            color: "warning.main",
                          },
                          {
                            label: "Last Update",
                            value: "Just now",
                            color: "text.secondary",
                          },
                        ].map((item) => (
                          <Stack
                            key={item.label}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{
                              py: 0.75,
                              px: 1.5,
                              borderRadius: 1.5,
                              bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, 0.03),
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {item.label}
                            </Typography>
                            <Chip
                              label={item.value}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                height: 24,
                                fontSize: "0.75rem",
                              }}
                            />
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Admin-specific analytics section */}
        {role === "admin" && (
          <Fade in timeout={800}>
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2.5, mt: 1 }}
              >
                <Box
                  sx={{
                    bgcolor: "warning.main",
                    borderRadius: 2,
                    p: 0.75,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <StorageIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    System-Wide Analytics
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Platform health and performance metrics (admin only)
                  </Typography>
                </Box>
              </Stack>
              <AdminAnalyticsView />
            </Box>
          </Fade>
        )}

        {/* Additional Info */}
        <Alert
          severity="info"
          sx={{
            borderRadius: 2.5,
            "& .MuiAlert-icon": { alignItems: "center" },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {role === "admin"
              ? "You're viewing system-wide analytics with admin access. Use the date range selector to filter data across all sections."
              : "Use the date range selector above to filter analytics for specific periods. Data updates in real-time as users interact with the platform."}
          </Typography>
        </Alert>
      </Stack>
    </Container>
  );
}
