# Map System

## Overview

The map is the central feature of CareConnect. It shows all users who have enabled location sharing, rendered as role-colored markers on an interactive Leaflet map. Patients can find nearby doctors and pharmacies, see their ratings, and interact with them directly from the map popup.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Map library | Leaflet + react-leaflet |
| Tile layers | OpenStreetMap, CartoDB (multiple switchable layers) |
| Real-time location | Socket.IO (`location-update`, `nearby-users`) events |
| Backend geospatial | MongoDB `$near` / `$geoWithin` with 2dsphere index |
| Location service | `server/src/services/locationService.js` |

---

## Architecture

```
Client Map Component
    ↓
useLocationSocket() hook
    ↓  (subscribe to nearby users)
Socket.IO event: "nearby-users"
    ↓
Server socketHandler → locationService.getNearbyUsers()
    ↓
MongoDB $near query on User.location.coordinates
    ↓
Returns: [{_id, name, roles, location, status, ratingSummary, doctorProfile, pharmacyProfile}]
    ↓
Client renders Leaflet Markers with role-colored icons
```

---

## Location Sharing

A user's location is only visible on the map if `settings.locationSharing === true`. This is toggled by the user in settings or via the map's location-sharing switch.

### Enabling location sharing

```
Client: navigator.geolocation.watchPosition()
    → Socket emit: "update-location" { userId, latitude, longitude }
    ↓
Server locationService.updateUserLocation():
    1. Confirms settings.locationSharing === true
    2. Validates coordinates (array of 2 Numbers)
    3. db.User.updateOne({ location.coordinates: [lng, lat], lastSeen: now })
    4. Emits "location-updated" back to user room
```

### Disabling location sharing

```
Server locationService.stopLocationSharing():
    1. settings.locationSharing = false
    2. location.coordinates = [0, 0]  ← resets to null island
    3. Emits "location-stopped" to user room
```

**Important**: Coordinates are stored as `[longitude, latitude]` (GeoJSON order), not `[lat, lng]`. The client must reverse this when displaying.

---

## Nearby Users Query

**Route**: `GET /api/location/nearby?radius=<km>`

The `locationService.getNearbyUsers()` function uses MongoDB's `$near` operator:

```js
User.find({
  _id: { $ne: currentUserId },
  "settings.locationSharing": true,
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [userLng, userLat] },
      $maxDistance: radiusMeters
    }
  }
}).select("name location profilePic status lastSeen roles ratingSummary doctorProfile pharmacyProfile")
```

**Verified filter**: Only doctors and pharmacies with `verified: true` are shown to patients. Unverified professionals are excluded from map results.

The response shape per user:
```js
{
  _id, name, email, roles,
  coordinates: [lng, lat],
  status: "online" | "offline",
  ratingSummary: { averageRating, totalRatings },
  doctorProfile: { specialty, consultationFee, verified },  // only if doctor
  pharmacyProfile: { operatingHours, services, verified }   // only if pharmacy
}
```

---

## Role-Colored Markers (`client/src/components/Map/mapUtils.js`)

Each role has a distinct color and letter label:

```js
export const ROLE_COLORS = {
  patient:  "#1976d2",   // MUI blue
  doctor:   "#2e7d32",   // MUI green
  pharmacy: "#ed6c02",   // MUI orange
  admin:    "#c62828",   // MUI red
};

export const ROLE_LABELS = {
  patient:  "P",
  doctor:   "Dr",
  pharmacy: "Rx",
  admin:    "A",
};
```

### `makeRoleIcon(color, label, isOnline)`

Creates a Leaflet `divIcon` with:
- Colored circle background
- Role letter label
- Green pulsing ring if `isOnline === true`

```js
L.divIcon({
  className: "",
  html: `<div style="background:${color}; width:32px; height:32px; border-radius:50%...">
           <span>${label}</span>
           ${isOnline ? '<div class="pulse-ring"></div>' : ""}
         </div>`,
  iconAnchor: [16, 16]
})
```

### Icon Variants

`createIcons()` generates 8 icons:
- `patientOnline`, `patientOffline`
- `doctorOnline`, `doctorOffline`
- `pharmacyOnline`, `pharmacyOffline`
- `adminOnline`, `adminOffline`

Plus `userIcon` — a purple pulsing icon for the current user's own location.

### `getUserIcon(icons, user)`

Picks the correct icon from the generated set based on `user.roles` and `user.status`.

---

## User Popup (`client/src/components/Map/MapSubComponents.jsx`)

When a marker is clicked, a Leaflet `<Popup>` renders `UserPopupContent`:

```
┌─────────────────────────────┐
│ [Avatar]  Dr. John Smith    │
│           [Doctor] ● Online │
│ Cardiology                  │
│ ★ 4.5  (12 ratings)         │
│ 2.3 km away                 │
│ [Chat] [Route]              │
│ [Book Appointment]          │  ← only shown to patients viewing doctors
└─────────────────────────────┘
```

**Conditional content by role**:
- `doctor`: shows `doctorProfile.specialty`
- `pharmacy`: shows `pharmacyProfile.operatingHours.open/close`
- All: shows `ratingSummary.averageRating` if totalRatings > 0
- `patient` viewing `doctor`: shows "Book Appointment" button

The "Book Appointment" button opens `BookAppointmentDialog` directly from the map popup.

---

## Nearby Users Sidebar

A collapsible sidebar lists all visible users with:
- Role filter dropdown (All / Doctors / Pharmacies / Patients) with role color dots
- Distance display (km from current user)
- Online/offline chip
- Role chip colored by `ROLE_COLORS`

```jsx
const [roleFilter, setRoleFilter] = useState("all");
const filteredUsers = users.filter(u =>
  roleFilter === "all" || u.roles === roleFilter
);
```

---

## Map Settings

Users can configure:

| Setting | Description |
|---------|-------------|
| Search radius | 1–50 km, displayed as a circle on the map |
| Show distance | Toggle distance labels in sidebar |
| Auto-refresh | Periodically re-fetch nearby users |
| Tile layer | Switch between OSM, CartoDB Light/Dark, Satellite |

These settings are stored in local component state (not persisted to the database).

---

## Route Display

When a user clicks "Route" in a popup, the `RouteControl` component uses Leaflet Routing Machine to draw a turn-by-turn route from the current user's location to the target user.

---

## Admin Monitoring Map (`client/src/app/monitoring/AdminMonitoringMap.jsx`)

Admins see a separate monitoring map that:
- Shows all users (not filtered by `locationSharing === true`)
- Uses the same `makeUserIcon(role, online)` factory for role-aware icons
- Has a role filter panel (All / Doctors / Pharmacies / Patients) with counts
- Shows role chip + rating in each popup

---

## Key Invariants

1. `location.coordinates` is `[longitude, latitude]` — not [lat, lng]
2. Users with `locationSharing: false` are invisible on the map
3. Unverified doctors/pharmacies (`verified: false`) are excluded from patient map results
4. The current user's own marker uses a distinct purple pulsing `userIcon`
5. Socket `nearby-users` events trigger re-render of all markers
6. Distance is calculated client-side using the Haversine formula (`calculateDistance()` in mapUtils.js)
