"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  Circle,
} from "react-leaflet";
import {
  alpha,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  Snackbar,
  Tooltip,
  IconButton,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import "leaflet/dist/leaflet.css";
import socket from "@/lib/socket";
import { useLocationSocket } from "@/utils/hooks/useSocket";
import {
  fetchNearbyUsers,
  updateUserLocation,
  startLocationSharing,
  stopLocationSharing,
} from "@/utils/redux/thunks/locationGroupThunks";
import { getOrCreateChat } from "@/utils/redux/thunks/chatThunks";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import { setLeftComponent } from "@/utils/redux/layoutSlice";
import logger from "@/lib/logger";

import {
  MIN_RADIUS,
  MAX_RADIUS,
  INITIAL_RADIUS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DEFAULT_UPDATE_INTERVAL,
  TILE_LAYERS,
  TILE_LAYER_KEYS,
  createIcons,
  calculateDistance,
  formatCoordinates,
  offsetCoordinates,
  getUserIcon,
} from "./mapUtils";

import {
  usePulseMarkerStyle,
  MapAutoCenter,
  FloatingControls,
  RadiusControls,
  UserPopupContent,
  NearbyUsersSidebar,
  MapSettingsPanel,
} from "./MapSubComponents";

import { RouteControl, RouteInfoPanel } from "./RouteDisplay";

// ========== MAIN MAP COMPONENT ==========
export default function EnhancedMap() {
  usePulseMarkerStyle();
  const icons = useMemo(createIcons, []);
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const watchIntervalRef = useRef(null);

  // Redux State
  const currentUser = useSelector((state) => state.user?.currentUser);
  const nearbyUsersRedux = useSelector(
    (state) => state.group?.nearbyUsers || [],
  );
  const userLocationRedux = useSelector((state) => state.group?.userLocation);
  const reduxLoading = useSelector((state) => state.group?.loading || false);
  const reduxError = useSelector((state) => state.group?.error || null);
  const friends = useSelector((state) => state.friend?.friends || []);

  // Friend IDs set for O(1) lookup
  const friendIds = useMemo(
    () => new Set(friends.map((f) => f._id)),
    [friends],
  );

  // Local State
  const [tileLayerKey, setTileLayerKey] = useState("standard");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [routeTarget, setRouteTarget] = useState(null);
  const [routeTargetName, setRouteTargetName] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [geoError, setGeoError] = useState(null);

  const [state, setState] = useState({
    nearbyUsers: [],
    centerPosition: null,
    loading: false,
    error: null,
    searchRadius: INITIAL_RADIUS,
    sharingLocation: false,
    userLocation: null,
    settingsOpen: false,
    settings: (() => {
      const defaults = {
        showRadius: true,
        showDistance: true,
        autoRefresh: true,
        showOnlineOnly: false,
        updateInterval: DEFAULT_UPDATE_INTERVAL,
      };
      try {
        const saved =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("mapSettings"))
            : null;
        return saved ? { ...defaults, ...saved } : defaults;
      } catch {
        return defaults;
      }
    })(),
    snackbar: { open: false, message: "", severity: "info" },
  });

  const updateState = (s) => setState((prev) => ({ ...prev, ...s }));
  const showSnack = (message, severity = "info") =>
    updateState({ snackbar: { open: true, message, severity } });

  // ========== LOCATION SOCKET ==========
  const { subscribeToNearby, on: onLocation } = useLocationSocket(
    currentUser?._id || "",
    state.searchRadius,
  );

  // ========== INITIAL LOCATION (show map immediately) ==========
  useEffect(() => {
    if (state.userLocation || state.centerPosition) return;
    // Try to get location once for map display (without starting sharing)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateState({
            centerPosition: [pos.coords.latitude, pos.coords.longitude],
            loading: false,
          });
        },
        () => {
          // Use user's stored location or default
          const stored = userLocationRedux;
          if (stored?.latitude) {
            updateState({
              centerPosition: [stored.latitude, stored.longitude],
              loading: false,
            });
          } else {
            updateState({ centerPosition: DEFAULT_CENTER, loading: false });
          }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    } else {
      updateState({ centerPosition: DEFAULT_CENTER, loading: false });
    }
  }, []); // eslint-disable-line

  // ========== LOCATION WATCH (uses settings.updateInterval + autoRefresh) ==========
  useEffect(() => {
    if (!state.sharingLocation || !currentUser || !state.settings.autoRefresh)
      return;

    const interval = Math.max(
      state.settings.updateInterval || DEFAULT_UPDATE_INTERVAL,
      5000,
    );

    watchIntervalRef.current = setInterval(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            updateState({
              userLocation: { latitude, longitude },
              centerPosition: [latitude, longitude],
            });
            dispatch(
              updateUserLocation({
                userId: currentUser._id,
                latitude,
                longitude,
              }),
            );
          },
          (err) => logger.error("[Map] Position error:", err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        );
      }
    }, interval);

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
  }, [
    state.sharingLocation,
    state.settings.autoRefresh,
    state.settings.updateInterval,
    currentUser,
    dispatch,
  ]);

  // ========== SYNC REDUX → LOCAL ==========
  useEffect(() => {
    updateState({ nearbyUsers: nearbyUsersRedux });
  }, [nearbyUsersRedux]);

  // ========== SOCKET LISTENERS ==========
  useEffect(() => {
    if (!state.sharingLocation || !currentUser?._id) return;

    const handleNearbyUpdate = (data) => {
      const users = Array.isArray(data) ? data : data?.users || [];
      updateState({ nearbyUsers: users });
    };

    const handleLocationUpdate = (data) => {
      setState((prev) => ({
        ...prev,
        nearbyUsers: prev.nearbyUsers.map((u) =>
          u._id === data.userId
            ? { ...u, coordinates: [data.longitude, data.latitude] }
            : u,
        ),
      }));
    };

    socket.on("nearby-users-update", handleNearbyUpdate);
    socket.on("user-location-updated", handleLocationUpdate);
    subscribeToNearby?.();

    return () => {
      socket.off("nearby-users-update", handleNearbyUpdate);
      socket.off("user-location-updated", handleLocationUpdate);
    };
  }, [state.sharingLocation, currentUser?._id, subscribeToNearby]);

  // ========== RADIUS CHANGE → RE-FETCH ==========
  useEffect(() => {
    if (!state.sharingLocation || !state.userLocation) return;
    const timer = setTimeout(() => {
      dispatch(
        fetchNearbyUsers({
          latitude: state.userLocation.latitude,
          longitude: state.userLocation.longitude,
          radius: state.searchRadius,
        }),
      );
      subscribeToNearby?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [state.searchRadius]); // eslint-disable-line

  // ========== APPLY FILTERS ==========
  const displayUsers = useMemo(() => {
    let users = state.nearbyUsers;
    if (state.settings.showOnlineOnly) {
      users = users.filter((u) => u.status === "online");
    }
    return users;
  }, [state.nearbyUsers, state.settings.showOnlineOnly]);

  // ========== HANDLERS ==========
  const handleLocationToggle = useCallback(async () => {
    if (!currentUser?._id) return;

    if (!state.sharingLocation) {
      updateState({ loading: true, error: null });
      setGeoError(null);

      if (!("geolocation" in navigator)) {
        updateState({
          loading: false,
          error: "Geolocation not supported by your browser",
        });
        setGeoError("Geolocation not supported");
        return;
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;

        await dispatch(
          startLocationSharing({
            userId: currentUser._id,
            latitude,
            longitude,
          }),
        ).unwrap();
        await dispatch(
          updateUserLocation({ userId: currentUser._id, latitude, longitude }),
        ).unwrap();

        updateState({
          sharingLocation: true,
          userLocation: { latitude, longitude },
          centerPosition: [latitude, longitude],
          loading: false,
        });
        showSnack("Location sharing started!", "success");

        dispatch(
          fetchNearbyUsers({ latitude, longitude, radius: state.searchRadius }),
        );
      } catch (err) {
        const msg =
          err?.code === 1
            ? "Location access denied. Please enable location in your browser settings and try again."
            : err?.code === 2
              ? "Location unavailable. Please try again."
              : err?.code === 3
                ? "Location request timed out. Please try again."
                : err.message || "Failed to start location sharing";
        updateState({ loading: false, error: msg });
        setGeoError(msg);
        showSnack(msg, "error");
      }
    } else {
      try {
        await dispatch(
          stopLocationSharing({ userId: currentUser._id }),
        ).unwrap();

        if (watchIntervalRef.current) {
          clearInterval(watchIntervalRef.current);
          watchIntervalRef.current = null;
        }

        updateState({
          sharingLocation: false,
          userLocation: null,
          nearbyUsers: [],
          loading: false,
        });
        setRouteTarget(null);
        setRouteInfo(null);
        showSnack("Location sharing stopped", "info");
      } catch (err) {
        showSnack("Failed to stop sharing", "error");
      }
    }
  }, [state.sharingLocation, state.searchRadius, currentUser?._id, dispatch]);

  const handleRecenter = useCallback(() => {
    if (state.userLocation) {
      const pos = [state.userLocation.latitude, state.userLocation.longitude];
      updateState({ centerPosition: pos });
      mapRef.current?.setView(pos, mapRef.current.getZoom());
    }
  }, [state.userLocation]);

  const handleUserSelect = useCallback((user, index) => {
    const coordinates = user.coordinates ||
      user.location?.coordinates || [0, 0];
    const lat = coordinates[1] || 0;
    const lng = coordinates[0] || 0;
    if (lat && lng) {
      const [oLat, oLng] = offsetCoordinates([lat, lng], index);
      updateState({ centerPosition: [oLat, oLng] });
    }
  }, []);

  const handleSettingsChange = useCallback((key, value) => {
    setState((prev) => {
      const newSettings = { ...prev.settings, [key]: value };
      try {
        localStorage.setItem("mapSettings", JSON.stringify(newSettings));
      } catch {}
      return { ...prev, settings: newSettings };
    });
  }, []);

  const handleStartChat = useCallback(
    async (user) => {
      if (!currentUser?._id) return;
      try {
        const result = await dispatch(
          getOrCreateChat({
            currentUserId: currentUser._id,
            searchedUserId: user._id,
          }),
        ).unwrap();
        dispatch(setCurrentChat(result.chat));
        dispatch(
          setLeftComponent({ name: "user-chat", props: { userId: user._id } }),
        );
        showSnack(`Opening chat with ${user.name}`, "success");
      } catch {
        showSnack("Failed to open chat", "error");
      }
    },
    [currentUser?._id, dispatch],
  );

  const handleNavigateToUser = useCallback(
    (user) => {
      if (!state.userLocation) {
        showSnack("Enable location sharing first", "warning");
        return;
      }
      const coords = user.coordinates || user.location?.coordinates || [0, 0];
      setRouteTarget([coords[1], coords[0]]);
      setRouteTargetName(user.name || "User");
    },
    [state.userLocation],
  );

  const handleClearRoute = useCallback(() => {
    setRouteTarget(null);
    setRouteInfo(null);
    setRouteTargetName("");
  }, []);

  const handleManualRefresh = useCallback(() => {
    const loc = state.userLocation;
    if (!loc) return;
    dispatch(
      fetchNearbyUsers({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: state.searchRadius,
      }),
    );
    showSnack("Refreshing nearby users...", "info");
  }, [state.userLocation, state.searchRadius, dispatch]);

  const handleToggleLayer = useCallback(() => {
    setTileLayerKey(
      (prev) =>
        TILE_LAYER_KEYS[
          (TILE_LAYER_KEYS.indexOf(prev) + 1) % TILE_LAYER_KEYS.length
        ],
    );
  }, []);

  const MapEvents = () => {
    const map = useMap();
    mapRef.current = map;
    return null;
  };

  // ========== RENDER ==========
  const currentLocation =
    state.userLocation ||
    (userLocationRedux?.latitude ? userLocationRedux : null);
  const mapCenter =
    state.centerPosition ||
    (currentLocation
      ? [currentLocation.latitude, currentLocation.longitude]
      : DEFAULT_CENTER);
  const mapZoom = currentLocation ? 13 : DEFAULT_ZOOM;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        gap: 1,
        overflow: "hidden",
      }}
    >
      {/* Main Map Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minWidth: 0,
        }}
      >
        {/* Controls Header */}
        <Paper sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Button
              variant={state.sharingLocation ? "contained" : "outlined"}
              color={state.sharingLocation ? "success" : "primary"}
              onClick={handleLocationToggle}
              startIcon={
                state.loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : state.sharingLocation ? (
                  <LocationOffIcon />
                ) : (
                  <LocationOnIcon />
                )
              }
              disabled={state.loading}
              size="small"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {state.sharingLocation ? "Stop Sharing" : "Share Location"}
            </Button>

            <TextField
              type="number"
              label="Radius (km)"
              value={(state.searchRadius / 1000).toFixed(1)}
              onChange={(e) =>
                updateState({
                  searchRadius: Math.max(
                    MIN_RADIUS,
                    Math.min(
                      MAX_RADIUS,
                      parseFloat(e.target.value) * 1000 || INITIAL_RADIUS,
                    ),
                  ),
                })
              }
              disabled={!state.sharingLocation}
              inputProps={{ min: 0.5, max: 10, step: 0.5 }}
              size="small"
              sx={{
                width: 110,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />

            <Tooltip title="Refresh nearby users">
              <span>
                <IconButton
                  size="small"
                  onClick={handleManualRefresh}
                  disabled={!state.sharingLocation}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {state.sharingLocation && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={
                    <FiberManualRecordIcon
                      sx={{
                        fontSize: "8px !important",
                        color: "success.main !important",
                      }}
                    />
                  }
                  label="Sharing"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 26, fontWeight: 600 }}
                />
                <Chip
                  icon={<MyLocationIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${displayUsers.length} nearby`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 26, fontWeight: 600 }}
                />
              </Stack>
            )}

            {state.settings.showOnlineOnly && (
              <Chip
                label="Online only"
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
          </Stack>
        </Paper>

        {/* Error / Geo Error */}
        {(state.error || reduxError) && (
          <Alert
            severity="error"
            onClose={() => {
              updateState({ error: null });
              setGeoError(null);
            }}
            sx={{ borderRadius: 2 }}
          >
            {state.error || reduxError}
          </Alert>
        )}
        {geoError && !state.error && (
          <Alert
            severity="warning"
            sx={{ borderRadius: 2 }}
            action={
              <Button
                size="small"
                onClick={handleLocationToggle}
                sx={{ textTransform: "none" }}
              >
                Retry
              </Button>
            }
          >
            {geoError}
          </Alert>
        )}

        {/* Map — ALWAYS visible (Gap #3 fixed) */}
        <Paper
          sx={{
            flex: 1,
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            minHeight: 300,
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution={TILE_LAYERS[tileLayerKey].attribution}
              url={TILE_LAYERS[tileLayerKey].url}
            />
            <ZoomControl position="bottomleft" />
            <MapAutoCenter position={state.centerPosition} />
            <MapEvents />

            {/* Search Radius Circle */}
            {state.sharingLocation &&
              currentLocation &&
              state.settings.showRadius && (
                <Circle
                  center={[currentLocation.latitude, currentLocation.longitude]}
                  radius={state.searchRadius}
                  color="#2e7d32"
                  weight={2}
                  opacity={0.3}
                  fill
                  fillColor="#2e7d32"
                  fillOpacity={0.08}
                />
              )}

            {/* Current User Marker */}
            {currentLocation && (
              <Marker
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={icons.userIcon}
              >
                <Popup>
                  <Stack sx={{ p: 0.5, minWidth: 180 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Your Location
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCoordinates(
                        currentLocation.latitude,
                        currentLocation.longitude,
                      )}
                    </Typography>
                    {state.sharingLocation && (
                      <Chip
                        label="Sharing"
                        size="small"
                        color="success"
                        sx={{ mt: 0.5, height: 22 }}
                      />
                    )}
                  </Stack>
                </Popup>
              </Marker>
            )}

            {/* Nearby Users Markers — uses online/offline/friend icons (Gap #12, #16) */}
            {displayUsers.map((user, index) => {
              const [lng, lat] = user.coordinates ||
                user.location?.coordinates || [0, 0];
              const [oLat, oLng] = offsetCoordinates([lat, lng], index);
              const distance = currentLocation
                ? calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    lat,
                    lng,
                  )
                : 0;
              const icon = getUserIcon(icons, user, friendIds);
              const isFriend = friendIds.has(user._id);

              // Ensure a stable unique key: prefer user._id, fall back to email + index
              const markerKey = `${user._id || user.email || "user"}-${index}`;

              return (
                <Marker
                  key={markerKey}
                  position={[oLat, oLng]}
                  icon={icon}
                  eventHandlers={{ click: () => handleUserSelect(user, index) }}
                >
                  <Popup>
                    <UserPopupContent
                      user={user}
                      distance={distance}
                      onChat={handleStartChat}
                      onNavigate={
                        state.sharingLocation ? handleNavigateToUser : null
                      }
                      showDistance={state.settings.showDistance}
                      isFriend={isFriend}
                    />
                  </Popup>
                </Marker>
              );
            })}

            {/* Route Display (Gap #1 — RouteDisplay now integrated) */}
            {routeTarget && currentLocation && (
              <RouteControl
                from={[currentLocation.latitude, currentLocation.longitude]}
                to={routeTarget}
                onRouteFound={setRouteInfo}
              />
            )}
          </MapContainer>

          {/* Floating Controls */}
          <FloatingControls
            onLocate={handleRecenter}
            onSettings={() => updateState({ settingsOpen: true })}
            locateDisabled={!currentLocation}
            settingsOpen={state.settingsOpen}
            onToggleLayer={handleToggleLayer}
          />

          {/* Radius Controls */}
          {state.sharingLocation && (
            <RadiusControls
              radius={state.searchRadius}
              setRadius={(r) => updateState({ searchRadius: r })}
            />
          )}

          {/* Route Info Panel */}
          {routeInfo && routeTarget && (
            <RouteInfoPanel
              routeInfo={routeInfo}
              onClose={handleClearRoute}
              targetName={routeTargetName}
            />
          )}

          {/* Tile layer badge */}
          <Chip
            label={TILE_LAYERS[tileLayerKey].label}
            size="small"
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
              zIndex: 1000,
              bgcolor: "rgba(255,255,255,0.9)",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
            }}
          />

          {/* Map legend */}
          <Paper
            sx={{
              position: "absolute",
              bottom: 12,
              right: 60,
              zIndex: 1000,
              borderRadius: 2,
              p: 1,
              bgcolor: "rgba(255,255,255,0.92)",
            }}
            elevation={2}
          >
            <Stack spacing={0.25}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontSize: "0.6rem" }}
              >
                Legend
              </Typography>
              {[
                { color: "#2e7d32", label: "Online" },
                { color: "#9e9e9e", label: "Offline" },
                { color: "#1565c0", label: "Friend (on)" },
                { color: "#5c6bc0", label: "Friend (off)" },
              ].map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: item.color,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: "0.55rem" }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Not sharing overlay hint */}
          {!state.sharingLocation && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.05)",
                pointerEvents: "none",
              }}
            >
              <Paper
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: 3,
                  textAlign: "center",
                  pointerEvents: "auto",
                }}
                elevation={4}
              >
                <LocationOnIcon
                  sx={{ fontSize: 36, color: "primary.main", mb: 1 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Share your location to see nearby users
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The map is browsable — click &quot;Share Location&quot; to
                  connect
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Nearby Users Sidebar */}
      {state.sharingLocation && (
        <NearbyUsersSidebar
          users={displayUsers}
          currentLocation={currentLocation}
          onUserSelect={handleUserSelect}
          loading={state.loading || reduxLoading}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
          friendIds={friendIds}
          showDistance={state.settings.showDistance}
        />
      )}

      {/* Settings Panel */}
      <MapSettingsPanel
        open={state.settingsOpen}
        onClose={() => updateState({ settingsOpen: false })}
        settings={state.settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Snackbar */}
      <Snackbar
        open={state.snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          updateState({ snackbar: { ...state.snackbar, open: false } })
        }
      >
        <Alert
          onClose={() =>
            updateState({ snackbar: { ...state.snackbar, open: false } })
          }
          severity={state.snackbar.severity || "info"}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {state.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
