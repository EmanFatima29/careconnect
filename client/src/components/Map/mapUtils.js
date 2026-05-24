/**
 * Map constants and utility functions
 */
import L from "leaflet";

// ========== CONSTANTS ==========
export const MIN_RADIUS = 500;
export const MAX_RADIUS = 10000;
export const INITIAL_RADIUS = 1000;
export const COORDINATE_OFFSET = 0.00005;
export const DEFAULT_UPDATE_INTERVAL = 10000;

// Default center: Pakistan
export const DEFAULT_CENTER = [30.3753, 69.3451];
export const DEFAULT_ZOOM = 5;

// ========== ROLE COLORS & LABELS ==========
export const ROLE_COLORS = {
  patient:  "#1976d2", // blue
  doctor:   "#2e7d32", // green
  pharmacy: "#ed6c02", // orange
  admin:    "#c62828", // red
};

export const ROLE_LABELS = {
  patient:  "P",
  doctor:   "Dr",
  pharmacy: "Rx",
  admin:    "A",
};

export const ROLE_DISPLAY = {
  patient:  "Patient",
  doctor:   "Doctor",
  pharmacy: "Pharmacy",
  admin:    "Admin",
};

// Tile layer options
export const TILE_LAYERS = {
  standard: {
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: "Satellite",
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
function makeRoleIcon(color, label, isOnline = true) {
  const opacity = isOnline ? 1 : 0.55;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};
      opacity:${opacity};
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:${label.length > 1 ? "9" : "12"}px;font-weight:800;line-height:1;letter-spacing:-0.5px;">${label}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ========== ICON FACTORY ==========
export const createIcons = () => ({
  // Current user — pulsing purple marker
  userIcon: L.divIcon({
    className: "pulse-marker",
    html: `<div style="width:38px;height:38px;border-radius:50%;background:#7b1fa2;border:3px solid white;box-shadow:0 0 0 5px rgba(123,31,162,0.25),0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:12px;height:12px;border-radius:50%;background:white;"></div>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  }),

  // Patient icons
  patientOnline:   makeRoleIcon(ROLE_COLORS.patient,  ROLE_LABELS.patient,  true),
  patientOffline:  makeRoleIcon(ROLE_COLORS.patient,  ROLE_LABELS.patient,  false),

  // Doctor icons
  doctorOnline:    makeRoleIcon(ROLE_COLORS.doctor,   ROLE_LABELS.doctor,   true),
  doctorOffline:   makeRoleIcon(ROLE_COLORS.doctor,   ROLE_LABELS.doctor,   false),

  // Pharmacy icons
  pharmacyOnline:  makeRoleIcon(ROLE_COLORS.pharmacy, ROLE_LABELS.pharmacy, true),
  pharmacyOffline: makeRoleIcon(ROLE_COLORS.pharmacy, ROLE_LABELS.pharmacy, false),

  // Admin icons
  adminOnline:     makeRoleIcon(ROLE_COLORS.admin,    ROLE_LABELS.admin,    true),
  adminOffline:    makeRoleIcon(ROLE_COLORS.admin,    ROLE_LABELS.admin,    false),
});

// ========== GET ROLE ICON ==========
export const getUserIcon = (icons, user) => {
  const role = user.roles || "patient";
  const isOnline = user.status === "online";
  const key = `${role}${isOnline ? "Online" : "Offline"}`;
  return icons[key] || (isOnline ? icons.patientOnline : icons.patientOffline);
};

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

export const getProfilePicUrl = (user) => {
  if (!user?.profilePic) return null;
  if (typeof user.profilePic === "string") return user.profilePic;
  return user.profilePic.thumbnail || user.profilePic.small || user.profilePic.medium || user.profilePic.original || null;
};
