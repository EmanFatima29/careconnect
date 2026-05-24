"use client";

import * as React from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import FilterListIcon from "@mui/icons-material/FilterList";
import LockIcon from "@mui/icons-material/Lock";

// Redux
import {
  fetchAllUsersAdmin,
  deleteUserAdmin,
  updateUserAdmin,
  fetchUserStats,
} from "@/utils/redux/thunks/adminThunks";
import { clearAdminError } from "@/utils/redux/adminSlice";
import { createDashboardCardSx } from "@/utils/themeUtils";
import { StatsCard } from "@/components/Dashboard";

// ═══════════════════════════════════════════════════════
// Role config
// ═══════════════════════════════════════════════════════
const ROLE_CONFIG = {
  superadmin: {
    icon: SupervisorAccountIcon,
    color: "#D32F2F",
    label: "Super Admin",
  },
  admin: {
    icon: AdminPanelSettingsIcon,
    color: "#E64A19",
    label: "Admin",
  },
  user: { icon: PersonIcon, color: "#1976D2", label: "User" },
};

const ACCOUNT_STATUS_CONFIG = {
  active: { color: "success", label: "Active", icon: CheckCircleIcon },
  locked: { color: "warning", label: "Locked", icon: LockIcon },
  blocked: { color: "error", label: "Blocked", icon: BlockIcon },
};

// ═══════════════════════════════════════════════════════
// Edit User Dialog
// ═══════════════════════════════════════════════════════
function EditUserDialog({ open, user, onClose, onSave, saving }) {
  const [role, setRole] = React.useState(user?.roles || "user");
  const [account, setAccount] = React.useState(user?.account || "active");

  React.useEffect(() => {
    if (user) {
      setRole(user.roles || "user");
      setAccount(user.account || "active");
    }
  }, [user]);

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={getProfilePicUrl(user.profilePic, "small")} sx={{ width: 48, height: 48 }}>
              {(user.name || user.email)?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">Super Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Account Status</InputLabel>
            <Select
              value={account}
              label="Account Status"
              onChange={(e) => setAccount(e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="locked">Locked</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave({ roles: role, account })}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// Delete Confirm Dialog
// ═══════════════════════════════════════════════════════
function DeleteConfirmDialog({ open, user, onClose, onConfirm, deleting }) {
  if (!user) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
        Delete User
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to permanently delete{" "}
          <strong>{user.name || user.email}</strong>? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// Main Admin Users Page
// ═══════════════════════════════════════════════════════
export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { users, userStats, loading, error } = useSelector(
    (state) => state.admin,
  );

  // Local state
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [accountFilter, setAccountFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [editUser, setEditUser] = React.useState(null);
  const [deleteUser, setDeleteUser] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // ── Fetch on mount ─────────────────────────────────
  React.useEffect(() => {
    dispatch(fetchAllUsersAdmin());
    dispatch(fetchUserStats());
  }, [dispatch]);

  // ── Refresh ────────────────────────────────────────
  const handleRefresh = () => {
    dispatch(fetchAllUsersAdmin());
    dispatch(fetchUserStats());
  };

  // ── Filter + Sort ──────────────────────────────────
  const filteredUsers = React.useMemo(() => {
    let result = [...users];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q),
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((u) => u.roles === roleFilter);
    }

    // Online status filter
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Account filter
    if (accountFilter !== "all") {
      result = result.filter((u) => u.account === accountFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || b.joined) -
            new Date(a.createdAt || a.joined)
          );
        case "oldest":
          return (
            new Date(a.createdAt || a.joined) -
            new Date(b.createdAt || b.joined)
          );
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return 0;
      }
    });

    return result;
  }, [users, search, roleFilter, statusFilter, accountFilter, sortBy]);

  // ── Computed stats ─────────────────────────────────
  const totalUsers = userStats?.totalUsers ?? users.length;
  const onlineCount = React.useMemo(() => {
    if (Array.isArray(userStats?.byOnlineStatus)) {
      return (
        userStats.byOnlineStatus.find((s) => s.status === "online")?.count ?? 0
      );
    }
    return users.filter((u) => u.status === "online").length;
  }, [userStats?.byOnlineStatus, users]);

  const adminCount = React.useMemo(() => {
    if (Array.isArray(userStats?.byRole)) {
      return (
        (userStats.byRole.find((r) => r.role === "admin")?.count ?? 0) +
        (userStats.byRole.find((r) => r.role === "superadmin")?.count ?? 0)
      );
    }
    return users.filter((u) => u.roles === "admin" || u.roles === "superadmin")
      .length;
  }, [userStats?.byRole, users]);

  const newUsersInRange = userStats?.newUsersInRange ?? 0;

  // ── Edit handler ───────────────────────────────────
  const handleSaveUser = async (updates) => {
    if (!editUser) return;
    setSaving(true);
    try {
      await dispatch(
        updateUserAdmin({ email: editUser.email, updates }),
      ).unwrap();
      setEditUser(null);
    } catch {
      // Error handled by slice
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handler ─────────────────────────────────
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await dispatch(deleteUserAdmin(deleteUser._id)).unwrap();
      setDeleteUser(null);
    } catch {
      // Error handled by slice
    } finally {
      setDeleting(false);
    }
  };

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
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage platform users, roles, and account status
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
          {typeof error === "string" ? error : "Failed to load user data."}
        </Alert>
      )}

      {/* ── Stats Cards ─────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Users"
            value={totalUsers}
            icon={PeopleIcon}
            variant="gradient"
            color="primary"
            subtitle={`+${newUsersInRange} this month`}
            trend={newUsersInRange > 0 ? `+${newUsersInRange} new` : "No new"}
            trendDirection={newUsersInRange > 0 ? "up" : "neutral"}
            index={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Online Now"
            value={onlineCount}
            icon={FiberManualRecordIcon}
            color={onlineCount > 0 ? "success" : "error"}
            subtitle={`${totalUsers > 0 ? Math.round((onlineCount / totalUsers) * 100) : 0}% of total`}
            index={1}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Administrators"
            value={adminCount}
            icon={AdminPanelSettingsIcon}
            color="warning"
            subtitle="Admin & superadmin"
            index={2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Showing"
            value={filteredUsers.length}
            icon={FilterListIcon}
            color="info"
            subtitle={`of ${users.length} total`}
            index={3}
          />
        </Grid>
      </Grid>

      {/* ── Search & Filters ────────────────────────────── */}
      <Card sx={{ ...createDashboardCardSx(4) }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Account</InputLabel>
                <Select
                  value={accountFilter}
                  label="Account"
                  onChange={(e) => setAccountFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="name-asc">Name A–Z</MenuItem>
                  <MenuItem value="name-desc">Name Z–A</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── User List ───────────────────────────────────── */}
      <Card sx={{ ...createDashboardCardSx(5) }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {loading && users.length === 0 ? (
            <Stack spacing={0} sx={{ p: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={72}
                  sx={{ borderRadius: 1, mb: 1 }}
                />
              ))}
            </Stack>
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <PeopleIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="body1" color="text.secondary">
                No users match your filters
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setAccountFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {filteredUsers.map((user, idx) => {
                const roleCfg = ROLE_CONFIG[user.roles] || ROLE_CONFIG.user;
                const accountCfg =
                  ACCOUNT_STATUS_CONFIG[user.account] ||
                  ACCOUNT_STATUS_CONFIG.active;
                const RoleIcon = roleCfg.icon;

                return (
                  <React.Fragment key={user._id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      sx={{
                        px: 2.5,
                        py: 2,
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              onClick={() => setEditUser(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteUser(user)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={getProfilePicUrl(user.profilePic, "small")}
                          sx={{
                            width: 42,
                            height: 42,
                            bgcolor: alpha(roleCfg.color, 0.15),
                            color: roleCfg.color,
                          }}
                        >
                          {(user.name || user.email)?.[0]?.toUpperCase()}
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
                              sx={{ fontWeight: 600 }}
                            >
                              {user.name || "Unnamed"}
                            </Typography>
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: 8,
                                color:
                                  user.status === "online"
                                    ? "success.main"
                                    : "text.disabled",
                              }}
                            />
                            <Chip
                              icon={
                                <RoleIcon
                                  sx={{ fontSize: "14px !important" }}
                                />
                              }
                              label={roleCfg.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                bgcolor: alpha(roleCfg.color, 0.1),
                                color: roleCfg.color,
                                "& .MuiChip-icon": { color: roleCfg.color },
                              }}
                            />
                            <Chip
                              label={accountCfg.label}
                              size="small"
                              color={accountCfg.color}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {user.email} · Joined{" "}
                            {new Date(
                              user.joined || user.createdAt,
                            ).toLocaleDateString()}{" "}
                            · Last login{" "}
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "N/A"}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* ── Summary Footer ──────────────────────────────── */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        Showing {filteredUsers.length} of {users.length} users · {onlineCount}{" "}
        online · {adminCount} administrator
        {adminCount !== 1 ? "s" : ""}
      </Typography>

      {/* ── Dialogs ─────────────────────────────────────── */}
      <EditUserDialog
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSaveUser}
        saving={saving}
      />
      <DeleteConfirmDialog
        open={!!deleteUser}
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
        deleting={deleting}
      />
    </Stack>
  );
}
