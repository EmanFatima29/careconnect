"use client";

import * as React from "react";
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import InterestsIcon from "@mui/icons-material/Interests";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useSession } from "next-auth/react";
import { useSelector, useDispatch } from "react-redux";
import { updateUserProfile, fetchCurrentUser } from "@/utils/redux/thunks/userThunks";
import { setCurrentUser } from "@/utils/redux/userSlice";
import api from "@/lib/api";
import LogoutButton from "@/components/LogOut";
import NotificationSettings from "@/components/UI/NotificationSettings";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { inferRole } from "@/utils/roleUtils";
import { ProfileSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";
import { getProfilePicUrl as _getProfilePicUrl } from "@/utils/profilePic";

const GENDER_OPTIONS = ["male", "female", "other"];
const ACCOUNT_TYPE_OPTIONS = ["public", "limited", "private"];
const ALLOW_MSG_OPTIONS = ["everyone", "friends", "no one"];

function getInitial(v) {
  return String(v || "").trim().charAt(0).toUpperCase() || "U";
}

function getProfilePicUrl(user, size = "medium") {
  if (!user?.profilePic) return null;
  return _getProfilePicUrl(user.profilePic, size);
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const { darkMode, toggleDarkMode, systemIsDark } = useAppTheme();

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState({});
  const [picUploading, setPicUploading] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });
  const fileRef = React.useRef(null);

  const name = currentUser?.name || session?.user?.name || "";
  const email = currentUser?.email || session?.user?.email || "";
  const role = inferRole(currentUser?.roles || session?.user?.roles);
  const roleLabel = Array.isArray(currentUser?.roles || session?.user?.roles) ? (currentUser?.roles || session?.user?.roles).join(", ") : role || "—";
  const profilePicUrl = getProfilePicUrl(currentUser, "large");
  const joinedDate = currentUser?.joined || currentUser?.createdAt;

  const showSnack = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  // ── Edit mode ──
  const handleStartEdit = () => {
    setDraft({
      name: currentUser?.name || "",
      phone: currentUser?.phone || "",
      bio: currentUser?.bio || "",
      education: currentUser?.education || "",
      interests: currentUser?.interests || "",
      gender: currentUser?.gender || "",
      accountType: currentUser?.accountType || "public",
      settings: {
        chatNotifications: currentUser?.settings?.chatNotifications ?? true,
        showReadReceipts: currentUser?.settings?.showReadReceipts ?? true,
        locationSharing: currentUser?.settings?.locationSharing ?? false,
        allowMessagesFrom: currentUser?.settings?.allowMessagesFrom || "everyone",
      },
    });
    setEditing(true);
  };

  const handleCancel = () => { setEditing(false); setDraft({}); };

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const result = await dispatch(updateUserProfile({ email, updates: draft })).unwrap();
      dispatch(setCurrentUser(result?.updatedUser || result));
      showSnack("Profile updated successfully");
      setEditing(false);
    } catch (err) {
      showSnack(err?.message || String(err) || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleField = (key, value) => setDraft((p) => ({ ...p, [key]: value }));
  const handleSetting = (key, value) => setDraft((p) => ({ ...p, settings: { ...p.settings, [key]: value } }));
  const settingVal = (key, def) => editing ? (draft.settings?.[key] ?? def) : (currentUser?.settings?.[key] ?? def);

  // ── Profile picture ──
  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showSnack("Image must be under 5MB", "error"); return; }

    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePic", file);
      const res = await api.patch("/api/users/me", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const updated = res.data?.updatedUser || res.data;
      dispatch(setCurrentUser(updated));
      showSnack("Profile picture updated");
    } catch (err) {
      showSnack(err.response?.data?.error || "Failed to upload picture", "error");
    } finally {
      setPicUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePicDelete = async () => {
    if (!confirm("Remove your profile picture?")) return;
    setPicUploading(true);
    try {
      await api.delete("/api/users/me/profile-pic");
      dispatch(fetchCurrentUser());
      showSnack("Profile picture removed");
    } catch (err) {
      showSnack("Failed to remove picture", "error");
    } finally {
      setPicUploading(false);
    }
  };

  if (status === "loading" && !currentUser) return <ProfileSkeleton />;

  return (
    <Container maxWidth="md" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <OfflineNotice feature="Profile updates" />
        {/* Header */}
        <Fade in timeout={500}>
          <Card sx={{
            background: "linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(76,175,80,0.04) 100%)",
            border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 3,
          }}>
            <CardContent sx={{ py: 2, px: 3, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}><PersonIcon /></Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Profile</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your public info and account settings</Typography>
                  </Box>
                </Stack>
                {!editing ? (
                  <Button startIcon={<EditIcon />} variant="outlined" onClick={handleStartEdit}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Edit</Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SaveIcon />}
                      variant="contained" onClick={handleSave} disabled={saving}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>Save</Button>
                    <Button startIcon={<CancelIcon />} variant="outlined" color="error" onClick={handleCancel}
                      sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Profile Card */}
        <Card sx={{ borderRadius: 3, overflow: "visible" }}>
          {/* Banner gradient */}
          <Box sx={{ height: 100, background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #4caf50 100%)", borderRadius: "12px 12px 0 0" }} />

          <CardContent sx={{ pt: 0, pb: 3, px: 3, mt: -5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ xs: "center", sm: "flex-end" }}>
              {/* Avatar with upload */}
              <Box sx={{ position: "relative" }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Tooltip title={profilePicUrl ? "Change picture" : "Upload picture"}>
                      <IconButton size="small" onClick={() => fileRef.current?.click()} disabled={picUploading}
                        sx={{
                          bgcolor: "primary.main", color: "white", width: 32, height: 32,
                          border: "3px solid white", "&:hover": { bgcolor: "primary.dark" },
                        }}>
                        {picUploading ? <CircularProgress size={16} sx={{ color: "white" }} /> : <CameraAltIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                  }>
                  <Avatar sx={{ width: 96, height: 96, fontSize: "2rem", fontWeight: 700, border: "4px solid white", boxShadow: 3, bgcolor: "primary.main" }}
                    src={profilePicUrl}>
                    {getInitial(name || email)}
                  </Avatar>
                </Badge>
                {profilePicUrl && (
                  <Tooltip title="Remove picture">
                    <IconButton size="small" onClick={handlePicDelete} disabled={picUploading}
                      sx={{ position: "absolute", top: -4, right: -4, bgcolor: "error.main", color: "white", width: 24, height: 24, "&:hover": { bgcolor: "error.dark" } }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={handlePicUpload} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: "center", sm: "left" } }}>
                {editing ? (
                  <TextField label="Display Name" value={draft.name} onChange={(e) => handleField("name", e.target.value)}
                    size="small" fullWidth sx={{ mb: 0.5, maxWidth: 300, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 900 }} noWrap>{name || "User"}</Typography>
                )}
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                  <Chip icon={<EmailIcon sx={{ fontSize: "14px !important" }} />} label={email || "Not signed in"} size="small" variant="outlined" sx={{ height: 26 }} />
                  <Chip icon={<SecurityIcon sx={{ fontSize: "14px !important" }} />} label={roleLabel} size="small" color="primary" variant="outlined" sx={{ height: 26, textTransform: "capitalize" }} />
                  <Chip icon={<FiberManualRecordIcon sx={{ fontSize: "8px !important" }} />}
                    label={currentUser?.status === "online" ? "Online" : "Offline"}
                    size="small" color={currentUser?.status === "online" ? "success" : "default"} variant="outlined" sx={{ height: 26 }} />
                </Stack>
                {joinedDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Joined {new Date(joinedDate).toLocaleDateString("default", { month: "long", year: "numeric" })}
                  </Typography>
                )}
              </Box>

              {!editing && <LogoutButton />}
            </Stack>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <PersonIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Personal Information</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              {[
                { key: "phone", label: "Phone", icon: PhoneIcon },
                { key: "education", label: "Education", icon: SchoolIcon },
                { key: "interests", label: "Interests", icon: InterestsIcon },
              ].map((ward) => (
                <Grid item xs={12} sm={6} key={ward.key}>
                  {editing ? (
                    <TextField label={ward.label} value={draft[ward.key] ?? ""} onChange={(e) => handleField(ward.key, e.target.value)}
                      size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                  ) : (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ward.icon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">{ward.label}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{currentUser?.[ward.key] || "—"}</Typography>
                    </Box>
                  )}
                </Grid>
              ))}

              {/* Gender */}
              <Grid item xs={12} sm={6}>
                {editing ? (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select label="Gender" value={draft.gender || ""} onChange={(e) => handleField("gender", e.target.value)} sx={{ borderRadius: 2, py: 1.5 }}>
                      <MenuItem value="">—</MenuItem>
                      {GENDER_OPTIONS.map((g) => <MenuItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</MenuItem>)}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}>
                    <Typography variant="caption" color="text.secondary">Gender</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25, textTransform: "capitalize" }}>{currentUser?.gender || "—"}</Typography>
                  </Box>
                )}
              </Grid>

              {/* Bio */}
              <Grid item xs={12}>
                {editing ? (
                  <TextField label="Bio" value={draft.bio ?? ""} onChange={(e) => handleField("bio", e.target.value)}
                    size="small" fullWidth multiline rows={3} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                ) : (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}>
                    <Typography variant="caption" color="text.secondary">Bio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{currentUser?.bio || "—"}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <SettingsIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Settings</Typography>
              {!editing && <Chip label="Edit to change" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem", ml: 1 }} />}
            </Stack>
            <List disablePadding>
              {/* Dark mode */}
              <ListItem secondaryAction={<Switch edge="end" checked={!!darkMode} onChange={toggleDarkMode} />} sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary={<Stack direction="row" spacing={1} alignItems="center"><DarkModeIcon sx={{ fontSize: 18, color: "text.secondary" }} /><span>Dark Mode</span></Stack>}
                  secondary={systemIsDark ? "System prefers dark" : "Toggle light/dark"} />
              </ListItem>
              <Divider component="li" />

              {/* Chat notifications */}
              <ListItem secondaryAction={<Switch edge="end" checked={settingVal("chatNotifications", true)}
                onChange={(e) => editing && handleSetting("chatNotifications", e.target.checked)} disabled={!editing} />} sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary="Chat Notifications"
                  secondary={editing ? "Receive notifications for new messages" : settingVal("chatNotifications", true) ? "Enabled" : "Disabled"} />
              </ListItem>
              <Divider component="li" />

              {/* Read receipts */}
              <ListItem secondaryAction={<Switch edge="end" checked={settingVal("showReadReceipts", true)}
                onChange={(e) => editing && handleSetting("showReadReceipts", e.target.checked)} disabled={!editing} />} sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary="Show Read Receipts"
                  secondary={editing ? "Let others see when you've read messages" : settingVal("showReadReceipts", true) ? "Enabled" : "Disabled"} />
              </ListItem>
              <Divider component="li" />

              {/* Location sharing */}
              <ListItem secondaryAction={<Switch edge="end" checked={settingVal("locationSharing", false)}
                onChange={(e) => editing && handleSetting("locationSharing", e.target.checked)} disabled={!editing} />} sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary="Location Sharing"
                  secondary={editing ? "Share your location with nearby users" : settingVal("locationSharing", false) ? "Enabled" : "Disabled"} />
              </ListItem>
              <Divider component="li" />

              {/* Account privacy */}
              <ListItem sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary="Account Privacy"
                  secondary={editing ? (
                    <FormControl size="small" sx={{ mt: 1.5, minWidth: 160 }}>
                      <Select value={draft.accountType || "public"} onChange={(e) => handleField("accountType", e.target.value)} size="small" sx={{ borderRadius: 2, py: 1.5 }}>
                        {ACCOUNT_TYPE_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : <span style={{ textTransform: "capitalize" }}>{currentUser?.accountType || "public"}</span>} 
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItem>
              <Divider component="li" />

              {/* Allow messages from */}
              <ListItem sx={{ borderRadius: 2, py: 1.5 }}>
                <ListItemText primary="Allow Messages From"
                  secondary={editing ? (
                    <FormControl size="small" sx={{ mt: 1.5, minWidth: 180 }}>
                      <Select value={draft.settings?.allowMessagesFrom || "everyone"} onChange={(e) => handleSetting("allowMessagesFrom", e.target.value)} size="small" sx={{ borderRadius: 2, py: 1.5 }}>
                        {ALLOW_MSG_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : <span style={{ textTransform: "capitalize" }}>{currentUser?.settings?.allowMessagesFrom || "everyone"}</span>} 
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Bottom save bar */}
        {editing && (
          <Fade in>
            <Card sx={{ borderRadius: 3, position: "sticky", bottom: 16, zIndex: 10, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleCancel} sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
                  <Button variant="contained" startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SaveIcon />}
                    onClick={handleSave} disabled={saving}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
                    Save Changes
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Notification Settings */}
        <NotificationSettings />
      </Stack>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
