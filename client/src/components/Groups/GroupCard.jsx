"use client";
import React from "react";
import {
  Avatar,
  AvatarGroup,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  alpha,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export default function GroupCard({ group, onClick, onDelete, isPlatformAdmin }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const canDelete = group.isAdmin || isPlatformAdmin;
  const memberCount = group.members?.length || 0;
  const onlineCount = Array.isArray(group.members)
    ? group.members.filter((m) => typeof m === "object" && m?.status === "online").length
    : 0;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Gradient top strip */}
      <Box sx={{
        height: 4,
        borderRadius: "12px 12px 0 0",
        background: group.isAdmin
          ? "linear-gradient(90deg, #2e7d32, #4caf50)"
          : "linear-gradient(90deg, #1976d2, #42a5f5)",
      }} />

      <CardContent sx={{ flex: 1, pt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
            {group.name}
          </Typography>
          {group.isAdmin && (
            <Chip label="Admin" size="small" color="primary" sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700 }} />
          )}
          {!group.isAdmin && isPlatformAdmin && (
            <Chip icon={<AdminPanelSettingsIcon sx={{ fontSize: "12px !important" }} />} label="Platform" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: "0.65rem" }} />
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{
          mb: 2, minHeight: 40,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {group.bio || group.description || "No description"}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip icon={<PeopleAltIcon sx={{ fontSize: "16px !important" }} />}
            label={`${memberCount} member${memberCount !== 1 ? "s" : ""}`}
            size="small" variant="outlined" sx={{ height: 26, fontWeight: 500 }} />
          {onlineCount > 0 && (
            <Chip icon={<FiberManualRecordIcon sx={{ fontSize: "8px !important", color: "success.main" }} />}
              label={`${onlineCount} online`}
              size="small" variant="outlined" color="success" sx={{ height: 26, fontWeight: 500 }} />
          )}
        </Stack>

        {/* Member avatars preview */}
        {Array.isArray(group.members) && group.members.length > 0 && typeof group.members[0] === "object" && (
          <AvatarGroup max={5} sx={{ mt: 1.5, justifyContent: "flex-start", "& .MuiAvatar-root": { width: 28, height: 28, fontSize: "0.7rem", border: "2px solid white" } }}>
            {group.members.map((m) => (
              <Avatar key={m._id || m} src={typeof m.profilePic === "object" ? m.profilePic?.thumbnail : m.profilePic}
                sx={{ bgcolor: m.status === "online" ? "success.main" : "grey.400" }}>
                {m.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button size="small" startIcon={<VisibilityIcon />} sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            View
          </Button>
          {canDelete && (
            <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />}
              onClick={handleDelete} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
              Delete
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
}
