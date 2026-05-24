"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createGroup } from "@/utils/redux/thunks/locationGroupThunks";
import { useSocket } from "@/utils/hooks/useSocket";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Avatar,
  Box,
  Alert,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";

export default function GroupModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { emit } = useSocket();
  const allUsers = useSelector((state) => state.users?.usersData || []);
  const currentUser = useSelector((state) => state.user?.currentUser);
  const loading = useSelector((state) => state.group?.loading);
  const error = useSelector((state) => state.group?.error);

  const [formData, setFormData] = useState({ name: "", description: "", members: [] });
  const [localError, setLocalError] = useState(null);

  const availableUsers = allUsers.filter((u) => u._id !== currentUser?._id);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!formData.name.trim()) { setLocalError("Group name is required"); return; }
    if (formData.members.length === 0) { setLocalError("Please add at least one member"); return; }

    const payload = {
      name: formData.name,
      description: formData.description,
      members: [currentUser._id, ...formData.members.map((m) => m._id)],
    };

    dispatch(createGroup(payload)).then((action) => {
      if (action.type === "group/create/fulfilled") {
        emit("group:create", { group: action.payload, createdBy: currentUser._id, members: payload.members });
        handleClose();
      }
    });
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", members: [] });
    setLocalError(null);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}><GroupsIcon sx={{ fontSize: 20 }} /></Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create New Group</Typography>
            <Typography variant="caption" color="text.secondary">Add members and start collaborating</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {(localError || error) && <Alert severity="error" sx={{ borderRadius: 2 }}>{localError || error}</Alert>}

          <TextField label="Group Name" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth placeholder="Enter group name" disabled={loading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />

          <TextField label="Description (optional)" value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth multiline rows={2} placeholder="What is this group about?"
            disabled={loading} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />

          <Autocomplete
            multiple options={availableUsers}
            getOptionLabel={(option) => option.name || "Unknown"}
            value={formData.members}
            onChange={(e, value) => setFormData({ ...formData, members: value })}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: option.status === "online" ? "success.main" : "grey.400" }}>
                    {option.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Add Members" placeholder="Search users..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            )}
            disabled={loading} noOptionsText="No users available"
          />

          {formData.members.length > 0 && (
            <Box sx={{ p: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                {formData.members.length + 1} members (including you)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                <Chip avatar={<Avatar sx={{ width: 24, height: 24 }}>{currentUser?.name?.charAt(0)}</Avatar>}
                  label={`${currentUser?.name} (You)`} size="small" color="primary" variant="outlined" sx={{ height: 28 }} />
                {formData.members.map((m) => (
                  <Chip key={m._id} avatar={<Avatar sx={{ width: 24, height: 24 }}>{m.name?.charAt(0)}</Avatar>}
                    label={m.name} size="small" variant="outlined" sx={{ height: 28 }}
                    onDelete={() => setFormData({ ...formData, members: formData.members.filter((x) => x._id !== m._id) })} />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={loading} sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={loading ? <CircularProgress size={18} sx={{ color: "white" }} /> : <AddIcon />}
          disabled={loading || !formData.name.trim() || formData.members.length === 0}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
          Create Group
        </Button>
      </DialogActions>
    </Dialog>
  );
}
