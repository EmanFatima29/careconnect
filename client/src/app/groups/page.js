"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import {
  fetchGroups,
  deleteGroup,
} from "@/utils/redux/thunks/locationGroupThunks";
import { inferRole } from "@/utils/roleUtils";
import GroupCard from "@/components/Groups/GroupCard";
import GroupModal from "@/components/Groups/GroupModal";
import GroupDetailModal from "@/components/Groups/GroupDetailModal";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GroupsSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function GroupsPage() {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const groups = useSelector((state) => state.group?.groups || []);
  const loading = useSelector((state) => state.group?.loading);
  const error = useSelector((state) => state.group?.error);
  const currentUser = useSelector((state) => state.user?.currentUser);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState(0); // 0=My Groups, 1=All Groups (admin only)

  // Role detection
  const role = inferRole(currentUser?.roles || session?.user?.roles);
  const isPlatformAdmin = role === "admin";

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleDeleteGroup = (groupId) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      dispatch(deleteGroup(groupId)).then((action) => {
        if (action.type === "group/delete/fulfilled") {
          setSelectedGroup(null);
          setShowDetailModal(false);
        }
      });
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleLeaveGroup = (groupId) => {
    // Refresh groups after leaving
    dispatch(fetchGroups());
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    let list = groups;

    // For admins: tab filtering (0 = my groups, 1 = all groups)
    if (isPlatformAdmin && tabValue === 0) {
      list = list.filter((g) => {
        const members = g.members || [];
        return members.some((m) => (typeof m === "object" ? m._id : m) === currentUser?._id);
      });
    }

    // Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) =>
        g.name?.toLowerCase().includes(q) ||
        (g.bio || g.description || "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [groups, searchQuery, tabValue, isPlatformAdmin, currentUser?._id]);

  // Stats
  const myGroupsCount = useMemo(() => {
    return groups.filter((g) => {
      const members = g.members || [];
      return members.some((m) => (typeof m === "object" ? m._id : m) === currentUser?._id);
    }).length;
  }, [groups, currentUser?._id]);

  const totalMembers = useMemo(() => {
    const set = new Set();
    groups.forEach((g) => (g.members || []).forEach((m) => set.add(typeof m === "object" ? m._id : m)));
    return set.size;
  }, [groups]);

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        {/* Header */}
        <Fade in timeout={500}>
          <Card sx={{
            background: "linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(76,175,80,0.04) 100%)",
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
            borderRadius: 3,
          }}>
            <CardContent sx={{ py: 2.5, px: 3, "&:last-child": { pb: 2.5 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                    <GroupsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {isPlatformAdmin ? "Group Management" : "My Groups"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {isPlatformAdmin
                        ? "Manage all groups across the platform"
                        : "Create and manage your group conversations"}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip icon={<GroupsIcon sx={{ fontSize: "14px !important" }} />}
                    label={`${groups.length} groups`} size="small" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                  {isPlatformAdmin && (
                    <Chip icon={<PeopleIcon sx={{ fontSize: "14px !important" }} />}
                      label={`${totalMembers} users`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                  )}
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={() => dispatch(fetchGroups())}
                      sx={{ border: 1, borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "rotate(180deg)", borderColor: "primary.main" } }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
                    Create Group
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Search + Tabs */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <TextField size="small" placeholder="Search groups..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} /></InputAdornment>,
              ...(searchQuery && {
                endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment>,
              }),
            }}
            sx={{ minWidth: 260, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />

          {isPlatformAdmin && (
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
              sx={{
                minHeight: 36,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 36, fontSize: "0.85rem" },
                "& .MuiTabs-indicator": { height: 2.5, borderRadius: "3px 3px 0 0" },
              }}>
              <Tab label={`My Groups (${myGroupsCount})`} />
              <Tab label={`All Groups (${groups.length})`} icon={<AdminPanelSettingsIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>
          )}
        </Stack>

        {/* Error */}
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        <OfflineNotice feature="Group management" />

        {/* Loading */}
        {loading && !groups.length && <GroupsSkeleton />}

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <Grid container spacing={2.5}>
            {filteredGroups.map((group) => {
              const members = group.members || [];
              const admins = group.admins || [];
              const isAdmin =
                admins.some((a) => (typeof a === "object" ? a._id : a) === currentUser?._id) ||
                String(typeof group.createdBy === "object" ? group.createdBy?._id : group.createdBy) === String(currentUser?._id);

              return (
                <Grid item xs={12} sm={6} md={4} key={group._id}>
                  <GroupCard
                    group={{ ...group, isAdmin, description: group.bio || group.description }}
                    onClick={() => handleSelectGroup(group)}
                    onDelete={() => handleDeleteGroup(group._id)}
                    isPlatformAdmin={isPlatformAdmin}
                  />
                </Grid>
              );
            })}
          </Grid>
        ) : !loading ? (
          <Card sx={{ borderRadius: 3, textAlign: "center" }}>
            <CardContent sx={{ py: 6 }}>
              <GroupsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary" variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                {searchQuery ? "No groups match your search" : "No groups yet"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchQuery ? "Try a different search term" : "Create your first group to start chatting with multiple people"}
              </Typography>
              {!searchQuery && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                  Create Group
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Create Group Modal */}
        <GroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

        {/* Group Detail Modal */}
        {selectedGroup && (
          <GroupDetailModal
            group={selectedGroup}
            open={showDetailModal}
            onClose={() => { setShowDetailModal(false); setSelectedGroup(null); }}
            onLeave={handleLeaveGroup}
          />
        )}
      </Stack>
    </Container>
  );
}
