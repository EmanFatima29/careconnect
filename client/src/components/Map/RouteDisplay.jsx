"use client";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DirectionsIcon from "@mui/icons-material/Directions";
import CloseIcon from "@mui/icons-material/Close";
import NavigationIcon from "@mui/icons-material/Navigation";

/**
 * RouteControl — Renders a route on the Leaflet map using OSRM (free, no API key).
 * Requires leaflet-routing-machine package.
 *
 * @param {[number, number]} from - Start [lat, lng]
 * @param {[number, number]} to - End [lat, lng]
 * @param {function} onRouteFound - Called with { distance, duration, instructions }
 * @param {function} onClose - Called when route is dismissed
 */
export function RouteControl({ from, to, onRouteFound, onClose }) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!from || !to || !map) return;

    // Dynamic import to avoid SSR issues
    import("leaflet-routing-machine").then(() => {
      if (routingRef.current) {
        try { map.removeControl(routingRef.current); } catch {}
      }

      const routing = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "driving",
        }),
        lineOptions: {
          styles: [
            { color: "#2196f3", weight: 5, opacity: 0.8 },
            { color: "#1976d2", weight: 3, opacity: 1 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        createMarker: () => null,
        show: false,
      });

      routing.on("routesfound", (e) => {
        const route = e.routes[0];
        if (route && onRouteFound) {
          onRouteFound({
            distance: route.summary.totalDistance,
            duration: route.summary.totalTime,
            instructions: route.instructions?.map((inst) => ({
              text: inst.text,
              distance: inst.distance,
              time: inst.time,
            })) || [],
          });
        }
      });

      routing.addTo(map);
      routingRef.current = routing;
    });

    return () => {
      if (routingRef.current) {
        try { map.removeControl(routingRef.current); } catch {}
        routingRef.current = null;
      }
    };
  }, [from, to, map, onRouteFound]);

  return null;
}

/**
 * RouteInfoPanel — Shows distance, duration, and turn-by-turn instructions.
 */
export function RouteInfoPanel({ routeInfo, onClose, targetName }) {
  if (!routeInfo) return null;

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        width: 280,
        maxHeight: 400,
        overflow: "auto",
        borderRadius: 2,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <NavigationIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Route to {targetName || "Destination"}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip size="small" label={formatDistance(routeInfo.distance)} color="primary" variant="outlined" />
          <Chip size="small" label={formatDuration(routeInfo.duration)} color="success" variant="outlined" />
        </Stack>

        {routeInfo.instructions?.length > 0 && (
          <Stack spacing={0.5} sx={{ maxHeight: 250, overflow: "auto" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Turn-by-turn
            </Typography>
            {routeInfo.instructions.slice(0, 15).map((inst, i) => (
              <Typography key={i} variant="caption" color="text.secondary">
                {i + 1}. {inst.text} ({formatDistance(inst.distance)})
              </Typography>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

/**
 * NavigateButton — "Navigate" button shown in user popups on the map.
 */
export function NavigateButton({ onClick }) {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<DirectionsIcon />}
      onClick={onClick}
      sx={{ textTransform: "none", mt: 0.5 }}
    >
      Navigate
    </Button>
  );
}
