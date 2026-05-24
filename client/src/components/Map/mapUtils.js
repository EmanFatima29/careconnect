/**
 * Map constants and utility functions
 */
import L from "leaflet";

// ========== CONSTANTS ==========
export const MIN_RADIUS = 500; // meters
export const MAX_RADIUS = 10000; // meters
export const INITIAL_RADIUS = 1000; // meters
export const COORDINATE_OFFSET = 0.00005; // degrees
export const DEFAULT_UPDATE_INTERVAL = 10000; // 10 seconds

// Default center: Pakistan (neutral center for this app)
export const DEFAULT_CENTER = [30.3753, 69.3451];
export const DEFAULT_ZOOM = 5;

// Tile layer options for map layer switching
export const TILE_LAYERS = {
  standard: {
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
  },
  diagnostic: {
    label: "Diagnostic",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};
export const TILE_LAYER_KEYS = Object.keys(TILE_LAYERS);

// ========== ICON HELPERS ==========
function makeSvgIcon(svg, size, anchor) {
  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [size, size],
    iconAnchor: anchor || [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

// ========== ICON CONFIGURATION ==========
export const createIcons = () => ({
  // Current user — pulsing green circle
  userIcon: (() => {
    const icon = L.divIcon({
      className: "pulse-marker",
      html: `<div style="width:36px;height:36px;border-radius:50%;background:#2e7d32;border:3px solid white;box-shadow:0 0 0 4px rgba(46,125,50,0.3),0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <div style="width:12px;height:12px;border-radius:50%;background:white;"></div>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
    return icon;
  })(),

  // Online user — green marker
  onlineIcon: makeSvgIcon(
    `<div style="width:30px;height:30px;border-radius:50%;background:#2e7d32;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`, 30
  ),

  // Offline user — grey marker
  offlineIcon: makeSvgIcon(
    `<div style="width:30px;height:30px;border-radius:50%;background:#9e9e9e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`, 30
  ),

  // Friend (online) — green with star
  friendOnlineIcon: makeSvgIcon(
    `<div style="width:30px;height:30px;border-radius:50%;background:#1565c0;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`, 30
  ),

  // Friend (offline) — blue-grey
  friendOfflineIcon: makeSvgIcon(
    `<div style="width:30px;height:30px;border-radius:50%;background:#5c6bc0;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`, 30
  ),
});

// ========== HELPER FUNCTIONS ==========
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatCoordinates = (lat, lng) =>
  `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

export const offsetCoordinates = ([lat, lng], index) => {
  const offset = COORDINATE_OFFSET * index;
  return [lat + offset, lng + offset];
};

export const getUserIcon = (icons, user, friendIds) => {
  const isFriend = friendIds?.has(user._id);
  const isOnline = user.status === "online";
  if (isFriend) return isOnline ? icons.friendOnlineIcon : icons.friendOfflineIcon;
  return isOnline ? icons.onlineIcon : icons.offlineIcon;
};

export const getProfilePicUrl = (user) => {
  if (!user?.profilePic) return null;
  if (typeof user.profilePic === "string") return user.profilePic;
  return user.profilePic.thumbnail || user.profilePic.small || user.profilePic.medium || user.profilePic.original || null;
};
