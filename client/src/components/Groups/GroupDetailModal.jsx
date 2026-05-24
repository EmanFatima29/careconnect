"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGroupById,
  addGroupMember,
  removeGroupMember,
  updateGroup,
} from "@/utils/redux/thunks/locationGroupThunks";
import { inferRole } from "@/utils/roleUtils";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  TextField,
  Stack,
  Divider,
  IconButton,
  alpha,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import EditIcon from "@mui/icons-material/Edit";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

export default function GroupDetailModal({ group, open, onClose, onLeave }) {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const selectedGroup = useSelector((state) => state.group?.selectedGroup);
  const loading = useSelector((state) => state.group?.loading);
  const error = useSelector((state) => state.group?.error);
  const allUsers = useSelector((state) => state.users?.usersData || []);

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Role detection
  const role = inferRole(currentUser?.roles || session?.user?.roles);
  const isPlatformAdmin = role === "admin";

  // Use populated data from selectedGroup if available, fall back to passed group
  const displayGroup = selectedGroup || group;

  useEffect(() => {
    if (group && open) {
      dispatch(fetchGroupById(group._id));
      setIsEditing(false);
      setShowAddMember(false);
      setLocalError(null);
    }
  }, [group, open, dispatch]);

  useEffect(() => {
    if (displayGroup) {
      setEditName(displayGroup.name || "");
      setEditDescription(displayGroup.bio || displayGroup.description || "");
    }
  }, [displayGroup]);

  // Admin check: group admin or platform admin
  const isGroupAdmin = (() => {
    if (!currentUser || !displayGroup) return false;
    const uid = currentUser._id;
    const admins = displayGroup.admins || [];
    return (
      admins.some((a) => (typeof a === "object" ? a._id : a) === uid) ||
      String(typeof displayGroup.createdBy === "object" ? displayGroup.createdBy?._id : displayGroup.createdBy) === String(uid)
    );
  })();

  const canManage = isGroupAdmin || isPlatformAdmin;

  // Members from populated data
  const members = displayGroup?.members || [];
  const populatedMembers = members.map((m) => {
    if (typeof m === "object" && m._id) return m;
    return allUsers.find((u) => u._id === m) || { _id: m, name: "Unknown" };
  });

  const isMember = members.some((m) => (typeof m === "object" ? m._id : m) === currentUser?._id);

  const availableUsers = allUsers.filter(
    (u) => u._id !== currentUser?._id && !members.some((m) => (typeof m === "object" ? m._id : m) === u._id),
  );

  const handleRemoveMember = (memberId) => {
    if (memberId === currentUser._id) return;
    if (confirm("Remove this member from the group?")) {
      dispatch(removeGroupMember({ groupId: displayGroup._id, memberId }));
    }
  };

  const handleAddMember = () => {
    if (!selectedUser) return;
    dispatch(addGroupMember({ groupId: displayGroup._id, memberId: selectedUser._id })).then((action) => {
      if (!action.error) {
        setSelectedUser(null);
        setShowAddMember(false);
        dispatch(fetchGroupById(displayGroup._id));
      }
    });
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) { setLocalError("Group name cannot be empty"); return; }
    setLocalError(null);
    dispatch(updateGroup({
      groupId: displayGroup._id,
      updates: { name: editName.trim(), description: editDescription },
    })).then((action) => {
      if (!action.error) setIsEditing(false);
    });
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setLeaveLoading(true);
    try {
      await api.post("/api/groups/exit", { userId: currentUser._id, groupId: displayGroup._id });
      onLeave?.(displayGroup._id);
      onClose?.();
    } catch (err) {
      setLocalError("Failed to leave group");
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}><GroupsIcon /></Avatar>
            <Box>
              {isEditing ? (
                <TextField size="small" value={editName} onChange={(e) => setEditName(e.target.value)}
                  placeholder="Group name" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{displayGroup?.name}</Typography>
              )}
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <Chip label={`${members.length} members`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                {isGroupAdmin && <Chip label="Admin" size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} />}
                {isPlatformAdmin && !isGroupAdmin && (
                  <Chip icon={<AdminPanelSettingsIcon sx={{ fontSize: "10px !important" }} />} label="Platform Admin" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                )}
              </Stack>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {(localError || error) && <Alert severity="error" sx={{ borderRadius: 2 }}>{localError || error}</Alert>}

          {/* Description */}
          {isEditing ? (
            <TextField size="small" multiline rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Group description" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {displayGroup?.bio || displayGroup?.description || "No description"}
            </Typography>
          )}

          {/* Edit actions */}
          {isEditing && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSaveEdit} disabled={loading}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Save</Button>
              <Button size="small" onClick={() => { setIsEditing(false); setEditName(displayGroup?.name || ""); setEditDescription(displayGroup?.bio || ""); }}
                sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
            </Stack>
          )}

          <Divider />

          {/* Members Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Members ({members.length})</Typography>
            <Stack direction="row" spacing={0.5}>
              {canManage && !isEditing && (
                <Tooltip title="Edit group">
                  <IconButton size="small" onClick={() => setIsEditing(true)} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {canManage && !showAddMember && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => setShowAddMember(true)}
                  disabled={availableUsers.length === 0} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                  Add
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Add Member Form */}
          {showAddMember && canManage && (
            <Stack direction="row" spacing={1} sx={{ p: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
              <TextField select label="Select user" value={selectedUser?._id || ""}
                onChange={(e) => setSelectedUser(availableUsers.find((u) => u._id === e.target.value))}
                fullWidth size="small" SelectProps={{ native: true }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}>
                <option value="">Choose a user...</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                ))}
              </TextField>
              <Button variant="contained" onClick={handleAddMember} disabled={!selectedUser || loading} size="small"
                sx={{ borderRadius: 1.5, textTransform: "none", minWidth: 60 }}>
                {loading ? <CircularProgress size={18} /> : "Add"}
              </Button>
              <Button onClick={() => setShowAddMember(false)} size="small" sx={{ textTransform: "none" }}>Cancel</Button>
            </Stack>
          )}

          {/* Members List */}
          <List sx={{ maxHeight: 320, overflow: "auto" }} disablePadding>
            {populatedMembers.map((member) => {
              const memberId = typeof member === "object" ? member._id : member;
              const isMe = memberId === currentUser?._id;
              const isAdminMember = (displayGroup?.admins || []).some((a) => (typeof a === "object" ? a._id : a) === memberId);
              return (
                <ListItem key={memberId} sx={{ py: 0.75, px: 1, borderRadius: 1.5, mb: 0.5, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.03) } }}
                  secondaryAction={
                    canManage && !isMe ? (
                      <Tooltip title="Remove member">
                        <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveMember(memberId)} disabled={loading}>
                          <PersonRemoveIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }>
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar src={typeof member.profilePic === "object" ? member.profilePic?.thumbnail : member.profilePic}
                      sx={{ width: 34, height: 34, bgcolor: member.status === "online" ? "success.main" : "grey.400", fontSize: "0.85rem" }}>
                      {member.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.name || "Unknown"}</Typography>
                        {isMe && <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />}
                        {isAdminMember && <Chip label="Admin" size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />}
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: member.status === "online" ? "success.main" : "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">{member.status === "online" ? "Online" : "Offline"}</Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              );
            })}
            {populatedMembers.length === 0 && (
              <Stack alignItems="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">No members</Typography>
              </Stack>
            )}
          </List>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
        {isMember && !isGroupAdmin ? (
          <Button startIcon={leaveLoading ? <CircularProgress size={16} /> : <ExitToAppIcon />}
            color="error" onClick={handleLeaveGroup} disabled={leaveLoading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            Leave Group
          </Button>
        ) : <Box />}
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
