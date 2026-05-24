"use client";
if (typeof window !== "undefined") window.L = window.L || require("leaflet");
import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LayersIcon from "@mui/icons-material/Layers";
import CloseIcon from "@mui/icons-material/Close";
import NavigationIcon from "@mui/icons-material/Navigation";

// ── Tile layer configs ──────────────────────────────────
const TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  diagnostic: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap",
  },
};
const LAYER_KEYS = Object.keys(TILE_LAYERS);

// ── Custom icons ────────────────────────────────────────
const patientIcon = (online) =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${online ? "#2e7d32" : "#9e9e9e"};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const fieldIcon = (status) => {
  const color =
    status === "healthy"
      ? "#4caf50"
      : status === "stressed"
        ? "#ff9800"
        : status === "declining"
          ? "#f57c00"
          : status === "critical"
            ? "#f44336"
            : "#78909c";
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19.5 12c.93 0 1.78.28 2.5.76V8c0-1.1-.9-2-2-2h-6.29l-1.06-1.06 1.41-1.41-.71-.71-3.53 3.53.71.71 1.41-1.41L13 6.71V9c0 1.1-.9 2-2 2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6.69A6.508 6.508 0 0 1 19.5 12z"/></svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

const myLocationIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#1976d2;border:3px solid white;box-shadow:0 0 0 3px rgba(25,118,210,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Route Control (OSRM) ───────────────────────────────
function RouteLayer({ from, to, onRouteFound, onClose }) {
  const map = useMap();
  const routeRef = React.useRef(null);

  React.useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;

    import("leaflet-routing-machine").then(() => {
      if (cancelled) return;

      if (routeRef.current) {
        map.removeControl(routeRef.current);
      }

      const control = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [
            { color: "#1976d2", opacity: 0.8, weight: 6 },
            { color: "#42a5f5", opacity: 1, weight: 3 },
          ],
        },
        createMarker: () => null,
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      });

      control.on("routesfound", (e) => {
        const route = e.routes[0];
        if (route && onRouteFound) {
          onRouteFound({
            distance: route.summary.totalDistance,
            duration: route.summary.totalTime,
            instructions: route.instructions?.slice(0, 15) || [],
          });
        }
      });

      control.addTo(map);
      routeRef.current = control;

      // Hide the default routing container
      const container = document.querySelector(".leaflet-routing-container");
      if (container) container.style.display = "none";
    });

    return () => {
      cancelled = true;
      if (routeRef.current) {
        map.removeControl(routeRef.current);
        routeRef.current = null;
      }
    };
  }, [from, to, map, onRouteFound]);

  return null;
}

// ── Map auto-center ─────────────────────────────────────
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.flyTo(center, zoom || 14, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// ── Main Admin Map Component ────────────────────────────
export default function AdminMonitoringMap({
  patients = [],
  wards = [],
  onSelectPatient,
  onSelectField,
  routeTarget,
  onClearRoute,
  mapCenter,
}) {
  const [tileKey, setTileKey] = React.useState("standard");
  const [myLocation, setMyLocation] = React.useState(null);
  const [routeInfo, setRouteInfo] = React.useState(null);
  const [locating, setLocating] = React.useState(false);

  // Get admin's location
  const handleLocateMe = React.useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Auto-locate on mount
  React.useEffect(() => {
    handleLocateMe();
  }, [handleLocateMe]);

  const cycleTileLayer = () => {
    const idx = LAYER_KEYS.indexOf(tileKey);
    setTileKey(LAYER_KEYS[(idx + 1) % LAYER_KEYS.length]);
  };

  // Determine initial center
  const defaultCenter = React.useMemo(() => {
    if (mapCenter) return mapCenter;
    if (myLocation) return myLocation;
    if (patients.length > 0) {
      const f = patients[0];
      if (f.location?.coordinates)
        return [f.location.coordinates[1], f.location.coordinates[0]];
    }
    return [30.3753, 69.3451]; // Pakistan default
  }, [mapCenter, myLocation, patients]);

  const tile = TILE_LAYERS[tileKey];

  const formatDistance = (m) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "50vh",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        className="leaflet-container h-full w-full"
        zoomControl={false}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        {/* Fly to selected location */}
        {mapCenter && <MapFlyTo center={mapCenter} zoom={14} />}

        {/* Admin location marker */}
        {myLocation && (
          <>
            <Marker position={myLocation} icon={myLocationIcon}>
              <Popup>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Your Location
                </Typography>
              </Popup>
            </Marker>
            <Circle
              center={myLocation}
              radius={500}
              pathOptions={{
                color: "#1976d2",
                fillColor: "#1976d2",
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
          </>
        )}

        {/* Patient markers */}
        {patients.map((patient) => {
          const coords = patient.location?.coordinates;
          if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
          return (
            <Marker
              key={patient._id}
              position={[coords[1], coords[0]]}
              icon={patientIcon(patient.status === "online")}
              eventHandlers={{ click: () => onSelectPatient?.(patient) }}
            >
              <Popup>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {patient.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {patient.email}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={patient.status === "online" ? "Online" : "Offline"}
                      color={
                        patient.status === "online" ? "success" : "default"
                      }
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                    {patient.address?.city && (
                      <Chip
                        size="small"
                        label={patient.address.city}
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    )}
                  </Stack>
                  <Button
                    size="small"
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1, textTransform: "none", fontSize: "0.7rem" }}
                    onClick={() => onSelectPatient?.(patient)}
                  >
                    View Details
                  </Button>
                </Box>
              </Popup>
            </Marker>
          );
        })}

        {/* Care Unit markers */}
        {wards.map((ward) => {
          const coords = ward.location?.coordinates;
          if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
          return (
            <React.Fragment key={ward._id}>
              <Marker
                position={[coords[1], coords[0]]}
                icon={fieldIcon(ward.currentHealth?.status)}
                eventHandlers={{ click: () => onSelectField?.(ward) }}
              >
                <Popup>
                  <Box sx={{ minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {ward.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ward.dosage || "—"} · {ward.area || 0} ha · {ward.status}
                    </Typography>
                    {ward.currentHealth?.status && (
                      <Chip
                        size="small"
                        label={ward.currentHealth.status}
                        color={
                          ward.currentHealth.status === "healthy"
                            ? "success"
                            : ward.currentHealth.status === "critical"
                              ? "error"
                              : "warning"
                        }
                        sx={{ mt: 0.5, height: 20, fontSize: "0.65rem" }}
                      />
                    )}
                    {ward.ownerId?.name && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Owner: {ward.ownerId.name}
                      </Typography>
                    )}
                    <Button
                      size="small"
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 1, textTransform: "none", fontSize: "0.7rem" }}
                      onClick={() => onSelectField?.(ward)}
                    >
                      Analyze Care Unit
                    </Button>
                  </Box>
                </Popup>
              </Marker>

              {/* Care Unit polygon if available */}
              {ward.polygon?.coordinates?.[0]?.length > 2 && (
                <Polygon
                  positions={ward.polygon.coordinates[0].map(([lng, lat]) => [
                    lat,
                    lng,
                  ])}
                  pathOptions={{
                    color:
                      ward.currentHealth?.status === "healthy"
                        ? "#4caf50"
                        : ward.currentHealth?.status === "critical"
                          ? "#f44336"
                          : "#ff9800",
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => onSelectField?.(ward) }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Routing */}
        {routeTarget && myLocation && (
          <RouteLayer
            from={myLocation}
            to={routeTarget}
            onRouteFound={setRouteInfo}
            onClose={onClearRoute}
          />
        )}
      </MapContainer>

      {/* Floating Controls */}
      <Paper
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          borderRadius: 2,
          p: 0.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
        elevation={3}
      >
        <IconButton
          size="small"
          onClick={handleLocateMe}
          disabled={locating}
          sx={{
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <MyLocationIcon
            fontSize="small"
            sx={{ color: myLocation ? "primary.main" : "text.secondary" }}
          />
        </IconButton>
        <IconButton
          size="small"
          onClick={cycleTileLayer}
          sx={{
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <LayersIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Layer indicator */}
      <Chip
        label={tileKey.charAt(0).toUpperCase() + tileKey.slice(1)}
        size="small"
        variant="filled"
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

      {/* Route Info Panel */}
      {routeInfo && routeTarget && (
        <Paper
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 1000,
            borderRadius: 2,
            p: 2,
            maxWidth: 260,
            maxHeight: "50%",
            overflow: "auto",
          }}
          elevation={3}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={0.75} alignItems="center">
                <NavigationIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Route
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => {
                  setRouteInfo(null);
                  onClearRoute?.();
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={formatDistance(routeInfo.distance)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 24, fontWeight: 600 }}
              />
              <Chip
                label={formatDuration(routeInfo.duration)}
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 24, fontWeight: 600 }}
              />
            </Stack>
            {routeInfo.instructions?.length > 0 && (
              <Stack spacing={0.5} sx={{ maxHeight: 200, overflow: "auto" }}>
                {routeInfo.instructions.map((inst, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.3 }}
                  >
                    {i + 1}. {inst.text}{" "}
                    {inst.distance > 0 && `(${formatDistance(inst.distance)})`}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Legend */}
      <Paper
        sx={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 1000,
          borderRadius: 2,
          p: 1.5,
          bgcolor: "rgba(255,255,255,0.92)",
        }}
        elevation={2}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, fontSize: "0.65rem" }}
          >
            Legend
          </Typography>
          {[
            { color: "#2e7d32", label: "Online Patient" },
            { color: "#9e9e9e", label: "Offline Patient" },
            { color: "#4caf50", label: "Healthy Care Unit" },
            { color: "#ff9800", label: "Stressed Care Unit" },
            { color: "#f44336", label: "Critical Care Unit" },
          ].map((item) => (
            <Stack
              key={item.label}
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: item.label.includes("Patient") ? "50%" : "2px",
                  bgcolor: item.color,
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
