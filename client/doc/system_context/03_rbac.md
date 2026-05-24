# Role-Based Access Control (RBAC)

## Overview

CareConnect enforces access control at **three levels**:

1. **Server middleware** — protects API routes by checking `req.user.roles` after JWT verification
2. **Frontend `RoleGuard` component** — redirects unauthorized users at the page level
3. **Conditional UI rendering** — hides/shows buttons, menus, and features based on role

All three layers use the same role hierarchy: **admin > doctor > pharmacy > patient**

---

## Role Hierarchy

```
superadmin ┐
           ├─ admin     → full platform access + verification workflow
doctor     ┤
           ├─ doctor    → own prescriptions, appointments, patients
pharmacy   ┤
           ├─ pharmacy  → available prescriptions, pharmacy profile
patient    ┘            → own prescriptions, book appointments, rate
```

---

## Layer 1 — Server Middleware

### Key Middleware Functions (`server/src/middleware/auth.js`)

#### `authenticate` (alias: `requireAuth`, `verifyToken`)
Applied to every protected route. Decodes the JWT and attaches `req.user`:

```js
req.user = {
  userId: "64abc...",
  roles:  "doctor",      // single string from the JWT
  email:  "dr@example.com"
}
```

#### `requireAdmin`
Applied after `authenticate` on all `/api/admin/*` routes. Rejects if `roles` is not `admin` or `superadmin`.

```js
router.use(requireAuth);
router.use(requireAdmin);
router.get("/stats/users", getUserStatistics);  // admin only
```

### Controller-Level Guards

Many controllers implement inline role checks for finer-grained control that middleware alone can't express.

**Doctor-only guard** (in `doctorController.js`):
```js
const requireDoctor = (req, res) => {
  const role = req.user?.roles;
  if (role !== "doctor" && role !== "admin" && role !== "superadmin") {
    res.status(403).json({ error: "Doctor access required" });
    return false;
  }
  return true;
};
```

**Pharmacy-only guard** (in `pharmacyController.js`):
```js
const requirePharmacy = (req, res) => {
  const role = req.user?.roles;
  if (role !== "pharmacy" && role !== "admin" && role !== "superadmin") {
    res.status(403).json({ error: "Pharmacy access required" });
    return false;
  }
  return true;
};
```

**Ownership guard** (in `appointmentController.js`):
```js
const isPatient = appointment.patientId.toString() === userId;
const isDoctor  = appointment.doctorId.toString()  === userId;
const isAdmin   = ["admin", "superadmin"].includes(roles);
if (!isPatient && !isDoctor && !isAdmin) {
  return res.status(403).json({ error: "Not authorised" });
}
```

### Route-Level RBAC Matrix

| Route prefix | Middleware | Who can access |
|-------------|-----------|---------------|
| `GET /api/users/profile` | `authenticate` | Any authenticated user |
| `GET /api/doctor/stats` | `authenticate` | Doctor, Admin |
| `GET /api/pharmacy/stats` | `authenticate` | Pharmacy, Admin |
| `GET /api/appointments` | `authenticate` | Any (filtered by role in controller) |
| `POST /api/appointments` | `authenticate` | Patient only (enforced in controller) |
| `GET /api/admin/*` | `authenticate` + `requireAdmin` | Admin, Superadmin only |
| `GET /api/ratings/:userId` | none | Public (no auth required) |
| `POST /api/ratings` | `authenticate` | Patient only (enforced in controller) |
| `GET /api/location/nearby` | `authenticate` | Any authenticated user |

---

## Layer 2 — Frontend `RoleGuard` Component

**Location**: `client/src/components/RoleGuard.jsx`

Wraps any page or component that requires a specific role. It:
1. Checks `useSession()` status
2. Calls `inferRole(session.user.roles)` to determine the user's role
3. Redirects unauthenticated users to `/login`
4. Redirects unauthorized users to a fallback URL (default: role-appropriate dashboard)

```jsx
// Usage example
<RoleGuard allowedRoles={["admin", "superadmin"]} fallbackUrl="/dashboard">
  <AdminPage />
</RoleGuard>
```

```jsx
// Internal logic
const role = inferRole(session?.user?.roles);
const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

if (!session) {
  redirect("/login");
}
if (!allowed.includes(role)) {
  redirect(fallbackUrl || "/dashboard");
}
```

**Note**: `RoleGuard` is a client-side guard only. It provides UX protection (prevents page flash) but is NOT a security boundary — the server middleware is the actual security layer.

---

## Layer 3 — Conditional UI Rendering

### Dashboard: Role-Aware Routing (`client/src/app/dashboard/page.js`)

```jsx
const role = inferRole(currentUser?.roles || session?.user?.roles);

return (
  <Box>
    {role === "patient"  && <PatientDashboard  ... />}
    {role === "doctor"   && <DoctorDashboard   ... />}
    {role === "pharmacy" && <PharmacyDashboard ... />}
    {role === "admin"    && <AdminDashboard    ... />}
  </Box>
);
```

### Sidebar Navigation: Role-Aware Menus (`client/src/components/SidebarNav.jsx`)

Each role has its own menu array:

| Menu | Shown to |
|------|---------|
| `PATIENT_MENU` | Patients |
| `DOCTOR_MENU` | Doctors (includes Appointments) |
| `PHARMACY_MENU` | Pharmacies |
| `ADMIN_MENU` | Admins (includes Verifications page) |

```js
const menu = role === "admin"
  ? ADMIN_MENU
  : role === "doctor"
    ? DOCTOR_MENU
    : role === "pharmacy"
      ? PHARMACY_MENU
      : PATIENT_MENU;
```

### Map Popup: Context-Sensitive Actions

```jsx
// In MapSubComponents.jsx — UserPopupContent
const canBook = currentUserRole === "patient" && role === "doctor";

{canBook && (
  <Button onClick={() => setBookOpen(true)}>Book Appointment</Button>
)}
```

### Rating System: Who Can Rate

```js
// In RatingSummary.jsx
const canRate = ["doctor", "pharmacy"].includes(targetRole)
  && currentUserRole === "patient"
  && targetUser._id !== currentUser._id;
```

Only patients can rate doctors and pharmacies. Users cannot rate themselves.

### Appointment Status Changes: Action Availability

```js
// Only shown to the right actor
{role === "doctor" && appt.status === "pending" && (
  <Button onClick={() => onAction(appt._id, "confirmed")}>Confirm</Button>
)}
{role === "patient" && appt.status === "pending" && (
  <Button onClick={() => onAction(appt._id, "cancelled")}>Cancel</Button>
)}
```

---

## RBAC Permission Table — Full System

| Action | Patient | Doctor | Pharmacy | Admin |
|--------|---------|--------|----------|-------|
| View map | ✅ | ✅ | ✅ | ✅ |
| Share location | ✅ | ✅ | ✅ | ✅ |
| Chat 1-on-1 | ✅ | ✅ | ✅ | ✅ |
| Create/join groups | ✅ | ✅ | ✅ | ✅ |
| View own prescriptions | ✅ | ✅ | ❌ | ✅ |
| Assign prescription | ❌ | ✅ | ❌ | ✅ |
| Rate a doctor | ✅ | ❌ | ❌ | ❌ |
| Rate a pharmacy | ✅ | ❌ | ❌ | ❌ |
| Book appointment with doctor | ✅ | ❌ | ❌ | ❌ |
| Confirm/complete appointment | ❌ | ✅ | ❌ | ✅ |
| View doctor dashboard | ❌ | ✅ | ❌ | ✅ |
| View pharmacy dashboard | ❌ | ❌ | ✅ | ✅ |
| Approve/reject professionals | ❌ | ❌ | ❌ | ✅ |
| View admin analytics | ❌ | ❌ | ❌ | ✅ |
| Delete any user | ❌ | ❌ | ❌ | ✅ |
| View activity logs | ❌ | ❌ | ❌ | ✅ |

---

## Key Invariants

1. **Server is the authority** — client-side guards are UX helpers only; the server validates every request independently
2. **Admin inherits all** — admin and superadmin can call any role-gated endpoint (doctor, pharmacy, patient)
3. **Self-rating blocked** — `raterUserId !== ratedUserId` enforced at controller level
4. **Verified flag gates map visibility** — unverified doctors/pharmacies are filtered out of `/api/location/nearby` results
5. **Role cannot be elevated at signup** — `createUser` rejects roles of `admin` or `superadmin`; those must be set by an existing admin directly in the DB or via admin panel
