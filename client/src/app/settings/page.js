"use client";

import * as React from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useSelector, useDispatch } from "react-redux";
import { useSession } from "next-auth/react";
import { updateUser } from "@/lib/api";
import { setCurrentUser } from "@/utils/redux/userSlice";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { createDashboardCardSx } from "@/utils/themeUtils";

export default function SettingsPage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user.currentUser);
  const { darkMode, toggleDarkMode } = useAppTheme();

  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });

  // Notification prefs
  const [notifications, setNotifications] = React.useState({
    emailNotifications: true,
    pushNotifications: true,
    chatNotifications: true,
    groupUpdates: false,
  });

  // Privacy prefs
  const [privacy, setPrivacy] = React.useState({
    locationSharing: true,
    profileVisible: true,
    readReceipts: true,
    showSentiment: false,
  });

  // Populate form from currentUser
  React.useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "",
      });
      if (currentUser.settings) {
        const s = currentUser.settings;
        setNotifications((prev) => ({
          ...prev,
          chatNotifications: s.chatNotifications ?? prev.chatNotifications,
          ...(s.notifications || {}),
        }));
        setPrivacy((prev) => ({
          ...prev,
          locationSharing: s.locationSharing ?? prev.locationSharing,
          readReceipts: s.showReadReceipts ?? prev.readReceipts,
          showSentiment: s.showSentiment ?? prev.showSentiment,
          ...(s.privacy || {}),
        }));
      }
    }
  }, [currentUser]);

  const handleFormChange = (ward) => (e) => {
    setForm((prev) => ({ ...prev, [ward]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.email) return;
    setSaving(true);
    try {
      const updates = {
        name: form.name,
        phone: form.phone,
        bio: form.bio,
      };
      const result = await updateUser(currentUser.email, updates);
      dispatch(setCurrentUser({ ...currentUser, ...updates }));
      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to save profile.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!currentUser?.email) return;
    setSaving(true);
    try {
      // Flatten settings to match server schema (settings.chatNotifications, etc.)
      const flatSettings = {
        chatNotifications: notifications.chatNotifications,
        locationSharing: privacy.locationSharing,
        showReadReceipts: privacy.readReceipts,
        showSentiment: privacy.showSentiment,
      };
      const updates = { settings: flatSettings };
      await updateUser(currentUser.email, updates);
      dispatch(setCurrentUser({
        ...currentUser,
        settings: { ...currentUser.settings, ...flatSettings },
      }));
      setSnackbar({
        open: true,
        message: "Preferences saved!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to save preferences.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "U";

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: { xs: 1, md: 2 }, animation: "fadeIn 0.5s ease-out" }}>
      <Stack spacing={3}>
        {/* ── Profile Section ── */}
        <Card sx={createDashboardCardSx(0)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Profile Information
            </Typography>

            <Stack spacing={4}>
              {/* Avatar row */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={getProfilePicUrl(currentUser?.profilePic, "medium") || undefined}
                  sx={{
                    width: 72,
                    height: 72,
                    fontSize: 28,
                    bgcolor: "primary.main",
                  }}
                >
                  {userInitial}
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Change Photo
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    JPG, PNG or GIF. Max size 2MB
                  </Typography>
                </Box>
              </Stack>

              {/* Form wards */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={form.name}
                    onChange={handleFormChange("name")}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={form.email}
                    disabled
                    size="small"
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={form.phone}
                    onChange={handleFormChange("phone")}
                    size="small"
                    placeholder="+1 (555) 000-0000"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={currentUser?.roles || "user"}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    value={form.bio}
                    onChange={handleFormChange("bio")}
                    multiline
                    rows={3}
                    size="small"
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={18} sx={{ color: "#fff" }} />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSaveProfile}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  alignSelf: "flex-start",
                }}
              >
                Save Changes
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* ── Notification Preferences ── */}
        <Card sx={createDashboardCardSx(1)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Notifications
            </Typography>

            <Stack divider={<Divider />}>
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  desc: "Receive email about your account activity",
                },
                {
                  key: "pushNotifications",
                  label: "Push Notifications",
                  desc: "Receive push notifications in your browser",
                },
                {
                  key: "chatNotifications",
                  label: "Chat Notifications",
                  desc: "Get notified about new messages and group activity",
                },
                {
                  key: "groupUpdates",
                  label: "Group Updates",
                  desc: "Notifications about group member activities",
                },
              ].map((item) => (
                <Stack
                  key={item.key}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                  <Switch
                    checked={notifications[item.key]}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* ── Appearance ── */}
        <Card sx={createDashboardCardSx(2)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Appearance
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {darkMode ? (
                  <DarkModeIcon sx={{ color: "text.secondary" }} />
                ) : (
                  <LightModeIcon sx={{ color: "text.secondary" }} />
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Dark Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enable dark mode theme
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                color="primary"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* ── Privacy ── */}
        <Card sx={createDashboardCardSx(3)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Privacy
            </Typography>

            <Stack divider={<Divider />}>
              {[
                {
                  key: "locationSharing",
                  label: "Location Sharing",
                  desc: "Allow others to see your location on the map",
                },
                {
                  key: "profileVisible",
                  label: "Profile Visibility",
                  desc: "Make your profile visible to other users",
                },
                {
                  key: "readReceipts",
                  label: "Read Receipts",
                  desc: "Let others know when you've read their messages",
                },
                {
                  key: "showSentiment",
                  label: "Show Mood to Others",
                  desc: "Allow other users to see your chat mood indicator (admins can always see it)",
                },
              ].map((item) => (
                <Stack
                  key={item.key}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                  <Switch
                    checked={privacy[item.key]}
                    onChange={(e) =>
                      setPrivacy((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                </Stack>
              ))}
            </Stack>

            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSavePreferences}
              disabled={saving}
              sx={{
                mt: 3,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </Stack>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
