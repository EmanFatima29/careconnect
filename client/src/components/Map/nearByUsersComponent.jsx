"use client";
// NearbyUsersComponent.js
import { useEffect, useState } from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import socket from "../../lib/socket";
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

const NearbyUsersComponent = ({ userId, currentLocation }) => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(1000); // Default 1km

  const normalizedLocation = (() => {
    if (!currentLocation) return null;
    if (
      typeof currentLocation.lat === "number" &&
      typeof currentLocation.lng === "number"
    ) {
      return currentLocation;
    }
    if (
      typeof currentLocation.latitude === "number" &&
      typeof currentLocation.longitude === "number"
    ) {
      return { lat: currentLocation.latitude, lng: currentLocation.longitude };
    }
    return null;
  })();

  // Initial fetch
  useEffect(() => {
    const fetchNearbyUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/location/nearby?radius=${radius}&online=true`
        );
        const data = await response.json();
        if (data.success) {
          setNearbyUsers(data.users);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [radius]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket.connected) return;

    socket.emit("subscribe-to-nearby", userId, radius);

    socket.on("nearby-users-update", (users) => {
      setNearbyUsers(users);
    });

    socket.on("nearby-users-error", (err) => {
      setError(err);
    });

    return () => {
      socket.off("nearby-users-update");
      socket.off("nearby-users-error");
    };
  }, [userId, radius]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Nearby users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nearbyUsers.length} found
            </Typography>
          </Stack>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="nearby-radius-label">Radius</InputLabel>
            <Select
              labelId="nearby-radius-label"
              value={radius}
              label="Radius"
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              <MenuItem value={500}>500m</MenuItem>
              <MenuItem value={1000}>1km</MenuItem>
              <MenuItem value={5000}>5km</MenuItem>
              <MenuItem value={10000}>10km</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading nearby users…
          </Typography>
        ) : null}
        {error ? (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        ) : null}

        <List
          disablePadding
          sx={{ display: "flex", flexDirection: "column", gap: 1 }}
        >
          {nearbyUsers.map((user) => {
            const key = user?._id || user?.id || user?.email || user?.name;
            const distanceMeters =
              normalizedLocation &&
              Array.isArray(user?.coordinates) &&
              user.coordinates.length >= 2
                ? Math.round(
                    getDistanceFromLatLonInKm(
                      normalizedLocation.lat,
                      normalizedLocation.lng,
                      user.coordinates[1],
                      user.coordinates[0]
                    )
                  )
                : null;

            return (
              <ListItem
                key={key}
                disableGutters
                sx={{
                  px: 1,
                  py: 0.75,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={getProfilePicUrl(user?.profilePic, "small") || "/default-avatar.png"}
                    alt={user?.name || "User"}
                  />
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {user?.name || "User"}
                    </Typography>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={user?.status === "online" ? "Online" : "Offline"}
                        color={
                          user?.status === "online" ? "success" : "default"
                        }
                      />
                      <Box
                        component="span"
                        sx={{ color: "text.secondary", typography: "caption" }}
                      >
                        {distanceMeters === null
                          ? "Distance: —"
                          : `${distanceMeters}m away`}
                      </Box>
                    </Stack>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {nearbyUsers.length === 0 && !loading && !error ? (
          <Typography variant="body2" color="text.secondary">
            No nearby users right now.
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
};

// Helper function to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default NearbyUsersComponent;
