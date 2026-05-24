# Phase 1 — Foundation: Role System & Extended Profiles
**Status: PENDING**
**Priority: Critical — must complete before all other phases**

---

## Goal

Add the missing `pharmacy` role, extend user profiles with role-specific medical fields, and update all role-guard and navigation code so that the four-role system (patient, doctor, pharmacy, admin) is fully wired throughout the app.

---

## Current State

- `userModel.js` has `roles: enum["patient", "doctor", "admin", "superadmin"]` — pharmacy is missing.
- `roleUtils.js` only recognises `admin`, `doctor`, `patient` — no pharmacy branch.
- `SidebarNav.jsx` has `PATIENT_MENU`, `DOCTOR_MENU`, `ADMIN_MENU` — no `PHARMACY_MENU`.
- `RoleGuard.jsx` likely only guards admin/patient — pharmacy unguarded.
- User model has no doctor-specific or pharmacy-specific profile fields.

---

## Tasks

### 1.1 — User Model: Add Pharmacy Role & Profile Fields

**File:** `server/src/models/userModel.js`

Changes:
- Add `"pharmacy"` to `roles` enum → `["patient", "doctor", "admin", "superadmin", "pharmacy"]`
- Add `doctorProfile` sub-document:
  ```js
  doctorProfile: {
    specialty: String,          // e.g. "Cardiology"
    licenseNumber: String,
    experience: Number,         // years
    availableDays: [String],    // ["Monday","Tuesday",...]
    availableFrom: String,      // "09:00"
    availableTo: String,        // "17:00"
    consultationFee: Number,
    verified: { type: Boolean, default: false },
  }
  ```
- Add `pharmacyProfile` sub-document:
  ```js
  pharmacyProfile: {
    licenseNumber: String,
    operatingHours: {
      open: String,   // "08:00"
      close: String,  // "22:00"
    },
    services: [String],          // ["Delivery","24hr","Lab Tests"]
    verified: { type: Boolean, default: false },
  }
  ```
- Add `ratingSummary` sub-document (used by Phase 3):
  ```js
  ratingSummary: {
    averageRating: { type: Number, default: 0 },
    totalRatings:  { type: Number, default: 0 },
  }
  ```
- Add index: `userSchema.index({ roles: 1, "location.coordinates": "2dsphere" })`

### 1.2 — Role Utilities: Add Pharmacy Branch

**File:** `client/src/utils/roleUtils.js`

- Update `inferRole()` to return `"pharmacy"` when role includes `"pharmacy"`.
- Add `isPharmacy(sessionRoles)` export.

### 1.3 — Sidebar Navigation: Add Pharmacy Menu

**File:** `client/src/components/SidebarNav.jsx`

Add `PHARMACY_MENU`:
```js
const PHARMACY_MENU = [
  { href: "/dashboard",     label: "Dashboard",    icon: DashboardIcon },
  { href: "/home",          label: "Home",         icon: HomeIcon },
  { href: "/prescriptions", label: "Prescriptions", icon: LocalHospitalIcon },
  { href: "/monitoring",    label: "Monitoring",   icon: MonitorHeartIcon },
  { href: "/groups",        label: "Groups",       icon: GroupsIcon },
  { href: "/analytics",     label: "Analytics",    icon: InsightsIcon },
  { href: "/profile",       label: "Profile",      icon: AccountCircleIcon },
];
```
Update menu selection logic to include `role === "pharmacy"`.

### 1.4 — Role Guard: Extend for Pharmacy

**File:** `client/src/components/RoleGuard.jsx`

- Add `pharmacy` as a valid protected role.
- Add pharmacy-specific page guards where needed (e.g. pharmacy dashboard).

### 1.5 — Signup Flow: Role Selection

**File:** `client/src/app/signup/page.js`

- Add role selector dropdown on signup: `Patient | Doctor | Pharmacy`.
- When `Doctor` is selected → show specialty and license fields.
- When `Pharmacy` is selected → show pharmacy name and license fields.

### 1.6 — User Controller: Handle Pharmacy Registration

**File:** `server/src/controllers/userController.js`

- On signup, accept `roles` field and validate it is one of `["patient","doctor","pharmacy"]` (admin cannot self-register).
- Save `doctorProfile` or `pharmacyProfile` fields depending on role.
- Set `verified: false` for doctor/pharmacy — they require admin approval (Phase 8).

### 1.7 — Auth Middleware: Role Awareness

**File:** `server/src/middleware/auth.js`

- Ensure JWT payload includes `roles` field for all four role types.
- No changes needed if `roles` is already embedded in token — verify this.

---

## Files to Create

| File | Purpose |
|------|---------|
| `client/src/app/pharmacy/page.js` | Pharmacy dashboard page (stub — fleshed out in Phase 5) |
| `client/src/app/pharmacy/loading.js` | Loading skeleton |

---

## Files to Modify

| File | Change |
|------|--------|
| `server/src/models/userModel.js` | Add pharmacy role, doctorProfile, pharmacyProfile, ratingSummary |
| `client/src/utils/roleUtils.js` | Add pharmacy branch |
| `client/src/components/SidebarNav.jsx` | Add PHARMACY_MENU |
| `client/src/components/RoleGuard.jsx` | Add pharmacy guard |
| `client/src/app/signup/page.js` | Add role selector |
| `server/src/controllers/userController.js` | Handle pharmacy/doctor registration fields |

---

## Acceptance Criteria

- [ ] A user can sign up as `patient`, `doctor`, or `pharmacy`
- [ ] Each role sees a different sidebar menu
- [ ] Doctor/pharmacy accounts are flagged as `verified: false` until admin approves
- [ ] `inferRole()` correctly returns `"pharmacy"` for pharmacy users
- [ ] `doctorProfile` and `pharmacyProfile` fields persist in MongoDB
- [ ] `ratingSummary` field exists on all users (default 0/0)
