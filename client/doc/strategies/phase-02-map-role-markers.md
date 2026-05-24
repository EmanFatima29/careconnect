# Phase 2 — Map: Role-Based Markers & Filters
**Status: PENDING**
**Depends on: Phase 1**
**Priority: Critical**

---

## Goal

Every user on the map should display a marker whose color and icon label clearly shows their role — **Patient**, **Doctor**, or **Pharmacy** — so any viewer can instantly know who they are looking at. Admins see all roles on the monitoring map.

---

## Current State

- Map markers are differentiated only by online/offline status and friend status (4 icon types).
- `mapUtils.js` → `createIcons()` creates `userIcon`, `onlineIcon`, `offlineIcon`, `friendOnlineIcon`, `friendOfflineIcon` — none role-aware.
- `getUserIcon()` picks icon based on `isFriend` + `isOnline` — no role check.
- Nearby users sidebar shows name and distance — no role badge.
- Map popup (`UserPopupContent`) shows name, distance, chat/navigate buttons — no role display.
- Map legend lists Online/Offline/Friend states — no role legend.

---

## Design: Role Color Scheme

| Role | Marker Color | Label on Marker |
|------|-------------|-----------------|
| Patient | `#1976d2` (blue) | "P" |
| Doctor | `#2e7d32` (green) | "Dr" |
| Pharmacy | `#ed6c02` (orange) | "Rx" |
| Current User | `#7b1fa2` (purple, pulsing) | — |
| Admin (monitoring) | `#c62828` (red) | "A" |

---

## Tasks

### 2.1 — Map Icons: Role-Aware Markers

**File:** `client/src/components/Map/mapUtils.js`

Replace the four generic icons with role-based icons. Each icon shows a circle in the role color with the role abbreviation label inside.

```js
function makeRoleIcon(color, label, isOnline = true) {
  const opacity = isOnline ? 1 : 0.55;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};opacity:${opacity};
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;gap:1px;">
      <span style="color:white;font-size:9px;font-weight:800;line-height:1">${label}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export const ROLE_COLORS = {
  patient:  "#1976d2",
  doctor:   "#2e7d32",
  pharmacy: "#ed6c02",
  admin:    "#c62828",
};

export const ROLE_LABELS = {
  patient:  "P",
  doctor:   "Dr",
  pharmacy: "Rx",
  admin:    "A",
};

export const createIcons = () => ({
  // Current user — pulsing purple
  userIcon: /* existing pulse icon but purple */,

  // Role-based icons (online + offline variants)
  patientOnline:   makeRoleIcon(ROLE_COLORS.patient,  ROLE_LABELS.patient,  true),
  patientOffline:  makeRoleIcon(ROLE_COLORS.patient,  ROLE_LABELS.patient,  false),
  doctorOnline:    makeRoleIcon(ROLE_COLORS.doctor,   ROLE_LABELS.doctor,   true),
  doctorOffline:   makeRoleIcon(ROLE_COLORS.doctor,   ROLE_LABELS.doctor,   false),
  pharmacyOnline:  makeRoleIcon(ROLE_COLORS.pharmacy, ROLE_LABELS.pharmacy, true),
  pharmacyOffline: makeRoleIcon(ROLE_COLORS.pharmacy, ROLE_LABELS.pharmacy, false),
  adminOnline:     makeRoleIcon(ROLE_COLORS.admin,    ROLE_LABELS.admin,    true),
  adminOffline:    makeRoleIcon(ROLE_COLORS.admin,    ROLE_LABELS.admin,    false),
});
```

Update `getUserIcon()`:
```js
export const getUserIcon = (icons, user) => {
  const role = user.roles || "patient";
  const isOnline = user.status === "online";
  const key = `${role}${isOnline ? "Online" : "Offline"}`;
  return icons[key] || (isOnline ? icons.patientOnline : icons.patientOffline);
};
```

### 2.2 — Map Component: Pass Role Icon

**File:** `client/src/components/Map/Map.jsx`

- Remove `friendIds` from `getUserIcon()` call (role takes priority).
- Update marker key comment: `markerKey = user._id || user.email`.
- Update map legend to show role colors instead of online/friend states.

New legend:
```jsx
[
  { color: ROLE_COLORS.doctor,   label: "Doctor" },
  { color: ROLE_COLORS.pharmacy, label: "Pharmacy" },
  { color: ROLE_COLORS.patient,  label: "Patient" },
  { color: "#9e9e9e",            label: "Offline" },
]
```

### 2.3 — Map Popup: Show Role Badge

**File:** `client/src/components/Map/MapSubComponents.jsx`

In `UserPopupContent`, add a role chip below the user name:
```jsx
<Chip
  label={user.roles === "doctor" ? "Doctor" : user.roles === "pharmacy" ? "Pharmacy" : "Patient"}
  size="small"
  sx={{ bgcolor: ROLE_COLORS[user.roles] || ROLE_COLORS.patient, color: "#fff", height: 20, fontSize: "0.65rem" }}
/>
```

If the user is a doctor, also show specialty:
```jsx
{user.roles === "doctor" && user.doctorProfile?.specialty && (
  <Typography variant="caption" color="text.secondary">
    {user.doctorProfile.specialty}
  </Typography>
)}
```

If the user is a pharmacy, show operating hours:
```jsx
{user.roles === "pharmacy" && user.pharmacyProfile?.operatingHours && (
  <Typography variant="caption" color="text.secondary">
    Open: {user.pharmacyProfile.operatingHours.open} – {user.pharmacyProfile.operatingHours.close}
  </Typography>
)}
```

Show average rating if available (Phase 3 prerequisite):
```jsx
{user.ratingSummary?.totalRatings > 0 && (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <StarIcon sx={{ fontSize: 12, color: "warning.main" }} />
    <Typography variant="caption">
      {user.ratingSummary.averageRating.toFixed(1)} ({user.ratingSummary.totalRatings})
    </Typography>
  </Stack>
)}
```

### 2.4 — Nearby Users Sidebar: Role Badge

**File:** `client/src/components/Map/MapSubComponents.jsx` (NearbyUsersSidebar)

- Add a colored role badge chip next to each user's name in the sidebar list.
- Add role filter dropdown at top of sidebar:
  ```
  Filter: [All] [Doctors] [Pharmacies] [Patients]
  ```
- Filter logic: `displayUsers.filter(u => roleFilter === "all" || u.roles === roleFilter)`

### 2.5 — Location Controller: Include Role Fields in Nearby Query

**File:** `server/src/controllers/locationController.js`

Ensure `fetchNearbyUsers` projection includes `roles`, `doctorProfile.specialty`, `pharmacyProfile.operatingHours`, `ratingSummary`.

Example:
```js
User.find({...})
  .select("name email roles status location profilePic ratingSummary doctorProfile.specialty pharmacyProfile.operatingHours")
```

### 2.6 — Admin Monitoring Map: Show All Roles

**File:** `client/src/app/monitoring/AdminMonitoringMap.jsx`

- Update monitoring map to use role-based icons same as the user map.
- Add role filter in monitoring panel for admins.
- Monitoring API should return `roles` field for each user.

---

## Files to Modify

| File | Change |
|------|--------|
| `client/src/components/Map/mapUtils.js` | Role-based icon system |
| `client/src/components/Map/Map.jsx` | Pass role icon, update legend |
| `client/src/components/Map/MapSubComponents.jsx` | Role chip in popup, role filter in sidebar |
| `server/src/controllers/locationController.js` | Include roles in nearby users projection |
| `client/src/app/monitoring/AdminMonitoringMap.jsx` | Role-aware monitoring map |

---

## Acceptance Criteria

- [ ] Doctor markers are green with "Dr" label
- [ ] Pharmacy markers are orange with "Rx" label
- [ ] Patient markers are blue with "P" label
- [ ] Offline markers are visually dimmed (reduced opacity)
- [ ] Map popup shows role chip with role color
- [ ] Doctor popup shows specialty
- [ ] Pharmacy popup shows operating hours
- [ ] Sidebar has a role filter dropdown
- [ ] Map legend reflects role colors
- [ ] Admin monitoring map uses role-based icons
