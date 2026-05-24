"use client";

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

// Icons
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonIcon from "@mui/icons-material/Person";
import MessageIcon from "@mui/icons-material/Message";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import GroupsIcon from "@mui/icons-material/Groups";
import LoginIcon from "@mui/icons-material/Login";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SecurityIcon from "@mui/icons-material/Security";

// Redux
import { fetchActivityLogs } from "@/utils/redux/thunks/adminThunks";
import { clearAdminError } from "@/utils/redux/adminSlice";
import { createDashboardCardSx } from "@/utils/themeUtils";

// ═══════════════════════════════════════════════════════
// Visual config for entity types + actions
// ═══════════════════════════════════════════════════════
const ENTITY_TYPE_CONFIG = {
  user: { icon: PersonIcon, color: "#1976D2", label: "User" },
  message: { icon: MessageIcon, color: "#7B1FA2", label: "Message" },
  prescription: { icon: MedicalServicesIcon, color: "#2E7D32", label: "Prescription" },
  group: { icon: GroupsIcon, color: "#E64A19", label: "Group" },
  chat: { icon: MessageIcon, color: "#0288D1", label: "Chat" },
  session: { icon: LoginIcon, color: "#F57C00", label: "Session" },
  system: { icon: SettingsIcon, color: "#616161", label: "System" },
};

const ACTION_ICONS = {
  create: AddIcon,
  update: EditIcon,
  delete: DeleteIcon,
  login: LoginIcon,
  logout: LoginIcon,
  view: VisibilityIcon,
  register: PersonIcon,
};

const STATUS_CONFIG = {
  success: {
    icon: CheckCircleOutlineIcon,
    color: "#2E7D32",
    bg: "rgba(46,125,50,0.08)",
  },
  failed: {
    icon: ErrorOutlineIcon,
    color: "#D32F2F",
    bg: "rgba(211,47,47,0.08)",
  },
};

/**
 * Format a date into a readable timestamp.
 */
function formatTimestamp(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════
// Main Admin Logs Page
// ═══════════════════════════════════════════════════════
export default function AdminLogsPage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { activityLogs, loading, error } = useSelector((state) => state.admin);

  const { items, page, limit, total } = activityLogs;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Local filter state
  const [actionFilter, setActionFilter] = React.useState("");
  const [entityTypeFilter, setEntityTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(page);

  // ── Fetch logs ─────────────────────────────────────
  const fetchLogs = React.useCallback(
    (overrides = {}) => {
      const params = {
        page: overrides.page ?? currentPage,
        limit: 20,
      };
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      if (statusFilter) params.status = statusFilter;
      dispatch(fetchActivityLogs(params));
    },
    [dispatch, currentPage, actionFilter, entityTypeFilter, statusFilter],
  );

  // Initial load
  React.useEffect(() => {
    fetchLogs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    fetchLogs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityTypeFilter, statusFilter]);

  // Page change
  const handlePageChange = (_, newPage) => {
    setCurrentPage(newPage);
    fetchLogs({ page: newPage });
  };

  // Refresh
  const handleRefresh = () => fetchLogs();

  // Clear filters
  const handleClearFilters = () => {
    setActionFilter("");
    setEntityTypeFilter("");
    setStatusFilter("");
    setSearchQuery("");
    setCurrentPage(1);
    dispatch(fetchActivityLogs({ page: 1, limit: 20 }));
  };

  // Client-side search on loaded items
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (log) =>
        (log.action || "").toLowerCase().includes(q) ||
        (log.entityType || "").toLowerCase().includes(q) ||
        (log.actorEmail || "").toLowerCase().includes(q) ||
        (log.entityId || "").toString().toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // ── Stats from loaded data ─────────────────────────
  const successCount = items.filter((l) => l.status === "success").length;
  const failedCount = items.filter((l) => l.status === "failed").length;

  // Unique entity types and actions across current items
  const uniqueActions = React.useMemo(
    () => [...new Set(items.map((l) => l.action).filter(Boolean))].sort(),
    [items],
  );
  const uniqueEntityTypes = React.useMemo(
    () => [...new Set(items.map((l) => l.entityType).filter(Boolean))].sort(),
    [items],
  );

  return (
    <Stack spacing={3}>
      {/* ── Page Header ─────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
          >
            Activity Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review platform events, user actions, and system activity
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Error Banner ────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => dispatch(clearAdminError())}
            >
              Dismiss
            </Button>
          }
        >
          {typeof error === "string" ? error : "Failed to load activity logs."}
        </Alert>
      )}

      {/* ── Summary Chips ───────────────────────────────── */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          icon={<HistoryIcon />}
          label={`${total} total entries`}
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label={`${successCount} success`}
          size="small"
          sx={{
            bgcolor: "rgba(46,125,50,0.08)",
            color: "#2E7D32",
            borderColor: "rgba(46,125,50,0.3)",
          }}
          variant="outlined"
        />
        <Chip
          icon={<ErrorOutlineIcon />}
          label={`${failedCount} failed`}
          size="small"
          sx={{
            bgcolor: "rgba(211,47,47,0.08)",
            color: "#D32F2F",
            borderColor: "rgba(211,47,47,0.3)",
          }}
          variant="outlined"
        />
        <Chip
          label={`Page ${currentPage} of ${totalPages}`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {/* ── Filters ─────────────────────────────────────── */}
      <Card sx={{ ...createDashboardCardSx(0) }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search logs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action"
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {uniqueActions.map((a) => (
                    <MenuItem key={a} value={a}>
                      {a}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity</InputLabel>
                <Select
                  value={entityTypeFilter}
                  label="Entity"
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Entities</MenuItem>
                  {uniqueEntityTypes.map((et) => (
                    <MenuItem key={et} value={et}>
                      {et}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                startIcon={<FilterListIcon />}
                sx={{ height: 40 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Logs List ───────────────────────────────────── */}
      <Card sx={{ ...createDashboardCardSx(1) }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {loading && items.length === 0 ? (
            <Stack spacing={0} sx={{ p: 2 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={64}
                  sx={{ borderRadius: 1, mb: 1 }}
                />
              ))}
            </Stack>
          ) : filteredItems.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <HistoryIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="body1" color="text.secondary">
                No activity logs found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Try adjusting your filters or date range
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Button size="small" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              </Box>
            </Box>
          ) : (
            <List disablePadding>
              {filteredItems.map((log, idx) => {
                const entityCfg =
                  ENTITY_TYPE_CONFIG[log.entityType] ||
                  ENTITY_TYPE_CONFIG.system;
                const statusCfg =
                  STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
                const ActionIcon = ACTION_ICONS[log.action] || entityCfg.icon;
                const StatusIcon = statusCfg.icon;

                return (
                  <React.Fragment key={log._id || idx}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: alpha(entityCfg.color, 0.12),
                            color: entityCfg.color,
                          }}
                        >
                          <ActionIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                textTransform: "capitalize",
                              }}
                            >
                              {log.action || "Action"}
                            </Typography>
                            <Chip
                              label={entityCfg.label}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                bgcolor: alpha(entityCfg.color, 0.1),
                                color: entityCfg.color,
                              }}
                            />
                            <Chip
                              icon={
                                <StatusIcon
                                  sx={{
                                    fontSize: "12px !important",
                                    color: `${statusCfg.color} !important`,
                                  }}
                                />
                              }
                              label={log.status || "success"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                bgcolor: statusCfg.bg,
                                color: statusCfg.color,
                                "& .MuiChip-icon": {
                                  color: statusCfg.color,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTimestamp(log.createdAt)}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.25 }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {log.actorEmail || log.actorId || "System"}
                            </Typography>
                            {log.entityId && (
                              <>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  ·
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: "monospace" }}
                                >
                                  {String(log.entityId).slice(-8)}
                                </Typography>
                              </>
                            )}
                            {log.ip && (
                              <>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  ·
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: "monospace" }}
                                >
                                  {log.ip}
                                </Typography>
                              </>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}

          {/* ── Pagination ────────────────────────────────── */}
          {totalPages > 1 && (
            <Stack
              direction="row"
              justifyContent="center"
              sx={{ py: 2.5, px: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="small"
                showFirstButton
                showLastButton
                disabled={loading}
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ── Footer ──────────────────────────────────────── */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        {total} total log entries · Page {currentPage} of {totalPages} ·{" "}
        {items.length} loaded
      </Typography>
    </Stack>
  );
}
