import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import {
  alpha,
  Badge,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  InputAdornment,
  Tooltip,
  Drawer,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsIcon from "@mui/icons-material/Directions";
import {
  MIN_RADIUS,
  MAX_RADIUS,
  ROLE_COLORS,
  ROLE_DISPLAY,
  calculateDistance,
  formatCoordinates,
  getProfilePicUrl,
} from "./mapUtils";
import StarIcon from "@mui/icons-material/Star";
import FilterListIcon from "@mui/icons-material/FilterList";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import dynamic from "next/dynamic";

const BookAppointmentDialog = dynamic(
  () => import("@/components/Appointments/BookAppointmentDialog"),
  { ssr: false },
);

// ========== CUSTOM HOOKS ==========
export const usePulseMarkerStyle = () => {
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .pulse-marker {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { filter: drop-shadow(0 0 0 rgba(76, 175, 80, 0.7)); }
        50% { filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.4)); }
      }
      @media (prefers-reduced-motion: reduce) {
        .pulse-marker { animation: none; }
      }
      .leaflet-routing-container { display: none !important; }
    `;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);
};

// ========== SUB-COMPONENTS ==========

export const MapAutoCenter = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [position, zoom, map]);
  return null;
};

export const FloatingControls = ({
  onLocate,
  onSettings,
  locateDisabled,
  settingsOpen,
  onToggleLayer,
}) => (
  <Paper
    role="toolbar"
    aria-label="Map controls"
    elevation={3}
    sx={{
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 1000,
      borderRadius: 2.5,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    <Tooltip title="Center on my location" placement="left">
      <span>
        <IconButton onClick={onLocate} disabled={locateDisabled} color="primary" size="small" sx={{ borderRadius: 0 }}>
          <MyLocationIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Divider />
    <Tooltip title="Map settings" placement="left">
      <IconButton onClick={onSettings} size="small" color={settingsOpen ? "primary" : "default"} sx={{ borderRadius: 0 }}>
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <Divider />
    <Tooltip title="Switch layer" placement="left">
      <IconButton onClick={onToggleLayer} size="small" sx={{ borderRadius: 0 }}>
        <LayersIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Paper>
);

export const RadiusControls = ({ radius, setRadius }) => (
  <Paper
    sx={{
      position: "absolute",
      bottom: 12,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      borderRadius: 2.5,
      px: 2,
      py: 1,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
    }}
    elevation={3}
  >
    <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
      {(radius / 1000).toFixed(1)} km
    </Typography>
    <Stack direction="row" spacing={0.5}>
      <Button size="small" variant="outlined" onClick={() => setRadius(Math.max(radius - 500, MIN_RADIUS))}
        disabled={radius <= MIN_RADIUS} sx={{ minWidth: 32, px: 0.5, borderRadius: 1.5 }}>−</Button>
      <Button size="small" variant="outlined" onClick={() => setRadius(Math.min(radius + 500, MAX_RADIUS))}
        disabled={radius >= MAX_RADIUS} sx={{ minWidth: 32, px: 0.5, borderRadius: 1.5 }}>+</Button>
    </Stack>
  </Paper>
);

export const UserPopupContent = ({ user, distance, onChat, onNavigate, showDistance = true, isFriend = false, currentUserRole }) => {
  const picUrl = getProfilePicUrl(user);
  const [lng, lat] = user.coordinates || user.location?.coordinates || [0, 0];
  const role = user.roles || "patient";
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.patient;
  const roleLabel = ROLE_DISPLAY[role] || "Patient";
  const hasRating = user.ratingSummary?.totalRatings > 0;
  const [bookOpen, setBookOpen] = useState(false);
  const canBook = currentUserRole === "patient" && role === "doctor";

  return (
    <Box sx={{ minWidth: 230, p: 0.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot"
            color={user.status === "online" ? "success" : "default"} invisible={user.status !== "online"}>
            <Avatar src={picUrl} sx={{ width: 44, height: 44, bgcolor: roleColor + "cc" }}>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>{user.name}</Typography>
              {isFriend && <Chip label="Friend" size="small" color="info" sx={{ height: 16, fontSize: "0.55rem" }} />}
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
              <Chip
                label={roleLabel}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: roleColor, color: "#fff", letterSpacing: "0.02em" }}
              />
              <FiberManualRecordIcon sx={{ fontSize: 7, color: user.status === "online" ? "success.main" : "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                {user.status === "online" ? "Online" : "Offline"}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Doctor: specialty */}
        {role === "doctor" && user.doctorProfile?.specialty && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            {user.doctorProfile.specialty}
          </Typography>
        )}

        {/* Pharmacy: operating hours */}
        {role === "pharmacy" && user.pharmacyProfile?.operatingHours?.open && (
          <Typography variant="caption" color="text.secondary">
            Open: {user.pharmacyProfile.operatingHours.open} – {user.pharmacyProfile.operatingHours.close}
          </Typography>
        )}

        {/* Rating */}
        {hasRating && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StarIcon sx={{ fontSize: 13, color: "warning.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {user.ratingSummary.averageRating.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({user.ratingSummary.totalRatings} rating{user.ratingSummary.totalRatings !== 1 ? "s" : ""})
            </Typography>
          </Stack>
        )}

        {showDistance && distance != null && (
          <Chip label={`${distance.toFixed(1)} km away`} size="small" variant="outlined" sx={{ height: 22, width: "fit-content" }} />
        )}

        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={() => onChat?.(user)}
            sx={{ flex: 1, textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}>
            Chat
          </Button>
          {onNavigate && (
            <Button variant="outlined" size="small" startIcon={<DirectionsIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigate(user)} sx={{ flex: 1, textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}>
              Route
            </Button>
          )}
        </Stack>

        {canBook && (
          <Button variant="outlined" size="small" color="success" fullWidth
            startIcon={<EventAvailableIcon sx={{ fontSize: 14 }} />}
            onClick={() => setBookOpen(true)}
            sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}>
            Book Appointment
          </Button>
        )}
      </Stack>

      {canBook && (
        <BookAppointmentDialog open={bookOpen} onClose={() => setBookOpen(false)} doctor={user} />
      )}
    </Box>
  );
};

export const NearbyUsersSidebar = ({
  users,
  currentLocation,
  onUserSelect,
  loading,
  searchQuery,
  onSearchChange,
  friendIds,
  showDistance = true,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = React.useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => (u.roles || "patient") === roleFilter);
    }
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) => u.name?.toLowerCase().includes(q));
    }
    return result;
  }, [users, searchQuery, roleFilter]);

  return (
    <Paper
      sx={{
        width: expanded ? 300 : 56,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        transition: "width 0.3s ease",
        borderRadius: 2,
      }}
    >
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {expanded && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <PeopleIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Nearby ({filteredUsers.length}{roleFilter !== "all" ? `/${users.length}` : ""})
            </Typography>
          </Stack>
        )}
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>

      {expanded && (
        <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
          {/* Role filter */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
            <FilterListIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              size="small"
              fullWidth
              sx={{ fontSize: "0.75rem", "& .MuiSelect-select": { py: 0.5 }, "& .MuiOutlinedInput-notchedOutline": { borderRadius: 1.5 } }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Roles</MenuItem>
              <MenuItem value="doctor" sx={{ fontSize: "0.75rem" }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ROLE_COLORS.doctor }} />
                  <span>Doctors</span>
                </Stack>
              </MenuItem>
              <MenuItem value="pharmacy" sx={{ fontSize: "0.75rem" }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ROLE_COLORS.pharmacy }} />
                  <span>Pharmacies</span>
                </Stack>
              </MenuItem>
              <MenuItem value="patient" sx={{ fontSize: "0.75rem" }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ROLE_COLORS.patient }} />
                  <span>Patients</span>
                </Stack>
              </MenuItem>
            </Select>
          </Stack>

          {/* Search */}
          {onSearchChange && (
            <TextField size="small" fullWidth placeholder="Search nearby..." value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} /></InputAdornment>,
                ...(searchQuery && { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => onSearchChange("")}><CloseIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment> }),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.8rem" } }}
            />
          )}
        </Box>
      )}

      <List sx={{ flex: 1, overflow: "auto", px: 0.5 }} disablePadding>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} /></Box>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => {
            const picUrl = getProfilePicUrl(user);
            const isFriend = friendIds?.has(user._id);
            const distance =
              currentLocation?.latitude && currentLocation?.longitude
                ? calculateDistance(
                    currentLocation.latitude, currentLocation.longitude,
                    user.location?.coordinates?.[1] || user.latitude || 0,
                    user.location?.coordinates?.[0] || user.longitude || 0,
                  )
                : 0;

            return (
              <ListItem
                key={user._id || user.id}
                onClick={() => onUserSelect?.(user, index)}
                sx={{
                  "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                  cursor: "pointer",
                  borderRadius: 1.5,
                  mb: 0.5,
                  py: 0.75,
                  px: 1,
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot"
                    color={user.status === "online" ? "success" : "default"} invisible={user.status !== "online"}>
                    <Avatar src={picUrl} sx={{ width: 34, height: 34, bgcolor: user.status === "online" ? "success.main" : "grey.400", fontSize: "0.85rem" }}>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                {expanded && (
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{user.name}</Typography>
                        <Chip
                          label={ROLE_DISPLAY[user.roles] || "Patient"}
                          size="small"
                          sx={{ height: 14, fontSize: "0.5rem", fontWeight: 700, bgcolor: ROLE_COLORS[user.roles] || ROLE_COLORS.patient, color: "#fff", letterSpacing: "0.02em" }}
                        />
                      </Stack>
                    }
                    secondary={
                      showDistance ? (
                        <Typography variant="caption" color="text.secondary">{distance.toFixed(1)} km away</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">{user.status === "online" ? "Online" : "Offline"}</Typography>
                      )
                    }
                  />
                )}
              </ListItem>
            );
          })
        ) : (
          expanded && (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <Typography variant="caption" color="text.secondary">
                {searchQuery ? "No matches" : "No nearby users"}
              </Typography>
            </Stack>
          )
        )}
      </List>
    </Paper>
  );
};

export const MapSettingsPanel = ({ open, onClose, settings, onSettingsChange }) => (
  <Drawer anchor="right" open={open} onClose={onClose}>
    <Box sx={{ width: 300, p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Map Settings</Typography>
      <Stack spacing={2}>
        <FormControlLabel
          control={<Switch checked={settings.showRadius} onChange={(e) => onSettingsChange("showRadius", e.target.checked)} />}
          label="Show Search Radius"
        />
        <FormControlLabel
          control={<Switch checked={settings.showDistance} onChange={(e) => onSettingsChange("showDistance", e.target.checked)} />}
          label="Show Distances"
        />
        <FormControlLabel
          control={<Switch checked={settings.autoRefresh} onChange={(e) => onSettingsChange("autoRefresh", e.target.checked)} />}
          label="Auto Refresh Location"
        />
        <FormControlLabel
          control={<Switch checked={settings.showOnlineOnly} onChange={(e) => onSettingsChange("showOnlineOnly", e.target.checked)} />}
          label="Show Online Only"
        />
        <Divider />
        <TextField
          label="Update Interval (seconds)"
          type="number"
          value={Math.round(settings.updateInterval / 1000)}
          onChange={(e) => onSettingsChange("updateInterval", Math.max(5, parseInt(e.target.value) || 10) * 1000)}
          size="small"
          inputProps={{ min: 5, max: 60 }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Stack>
    </Box>
  </Drawer>
);
