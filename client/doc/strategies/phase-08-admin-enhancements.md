# Phase 8 — Admin Dashboard Enhancements
**Status: PENDING**
**Depends on: Phase 1, Phase 2, Phase 3**
**Priority: High**

---

## Goal

Extend the admin dashboard with healthcare-specific controls: approving/rejecting doctor and pharmacy registrations, viewing role-based stats, and seeing all user types on the monitoring map.

---

## Current State

- Admin dashboard (`/admin/users`, `/admin/logs`) exists — ported from GeoConnect.
- Admin user management page lists all users but has no role-specific actions (approve doctor, approve pharmacy).
- Monitoring map (`/monitoring/AdminMonitoringMap.jsx`) shows all users but uses generic icons (no roles).
- Analytics page exists but shows generic stats (no healthcare breakdown).
- No approval workflow for doctors/pharmacies.

---

## Tasks

### 8.1 — Doctor & Pharmacy Approval Workflow

**File to modify:** `server/src/controllers/adminController.js`

Add endpoints:
- `PATCH /api/admin/users/:id/verify` — set `doctorProfile.verified` or `pharmacyProfile.verified` to `true`
- `PATCH /api/admin/users/:id/reject` — set `account: "locked"` and notify user of rejection
- `GET /api/admin/users?role=doctor&verified=false` — list pending doctor approvals
- `GET /api/admin/users?role=pharmacy&verified=false` — list pending pharmacy approvals

Business rules:
- Only `admin` or `superadmin` can verify accounts.
- Verified doctors/pharmacies appear on the map; unverified accounts are hidden from map queries.
- On verification, send push notification: "Your account has been verified. You can now share your location and appear on the map."
- On rejection, send push notification with reason.

**File to modify:** `server/src/controllers/locationController.js`

In `fetchNearbyUsers`, add filter: `$or: [{ roles: "patient" }, { "doctorProfile.verified": true }, { "pharmacyProfile.verified": true }]` so unverified doctors/pharmacies are not shown.

### 8.2 — Admin Users Page: Approval UI

**File to modify:** `client/src/app/admin/users/page.js`

Add tabs:
- **All Users** (existing)
- **Pending Doctors** — list of doctors with `verified: false`, with Approve/Reject buttons
- **Pending Pharmacies** — list of pharmacies with `verified: false`, with Approve/Reject buttons

Each row in pending lists shows:
- Name, email, license number, registration date.
- "Approve" button (green) → calls `PATCH /api/admin/users/:id/verify`
- "Reject" button (red) → opens a dialog for rejection reason → calls `PATCH /api/admin/users/:id/reject`

### 8.3 — Admin Monitoring Map: Role-Aware

**File to modify:** `client/src/app/monitoring/AdminMonitoringMap.jsx`

- Apply role-based icons from Phase 2 (`mapUtils.js` icons).
- Add role filter panel in monitoring sidebar:
  - Show All / Patients Only / Doctors Only / Pharmacies Only
- Show verification badge on doctor/pharmacy markers (green checkmark if verified, yellow warning if not).
- Add stats overlay: total online patients / doctors / pharmacies count.

### 8.4 — Admin Dashboard: Healthcare Stats

**File to modify:** `client/src/app/dashboard/page.js` (admin view)
**File to modify:** `server/src/controllers/analyticsController.js`

Add to admin analytics:
- Total registered users by role (patients / doctors / pharmacies).
- Pending verifications count (doctors + pharmacies awaiting approval).
- Total prescriptions created today / this week.
- Total appointments booked (Phase 6).
- Top-rated doctors (by `ratingSummary.averageRating`).
- Top-rated pharmacies.

New API endpoint:
- `GET /api/admin/stats` — returns role breakdown, pending verifications, prescription counts.

### 8.5 — Admin: Ratings Moderation

**File to modify:** `server/src/controllers/ratingController.js`
**File to modify:** `client/src/app/admin/users/page.js`

- Admin can view and delete any rating (report abuse).
- Admin users page: show rating count and average for each doctor/pharmacy.
- `GET /api/admin/ratings?reported=true` — list flagged/reported ratings.

### 8.6 — Admin: Activity Logs Enhancement

**File to modify:** `server/src/controllers/adminController.js`

Ensure activity logs capture new healthcare events:
- `rating.create`, `rating.delete`
- `appointment.book`, `appointment.confirm`, `appointment.cancel`
- `prescription.assign` (doctor assigns to patient)
- `pharmacy.fulfill` (pharmacy fulfills prescription)
- `user.verify` (admin verifies doctor/pharmacy)

These are logged via the existing `logActivity` service — just ensure the new controllers call it.

---

## Files to Create

| File | Purpose |
|------|---------|
| (none — all modifications) | |

## Files to Modify

| File | Change |
|------|--------|
| `server/src/controllers/adminController.js` | Verify/reject endpoints, stats endpoint |
| `server/src/controllers/locationController.js` | Filter unverified doctors/pharmacies |
| `server/src/controllers/analyticsController.js` | Healthcare stats |
| `client/src/app/admin/users/page.js` | Pending approvals tabs + verify/reject UI |
| `client/src/app/monitoring/AdminMonitoringMap.jsx` | Role-aware icons + role filter |
| `client/src/app/dashboard/page.js` | Admin healthcare stats cards |

---

## Acceptance Criteria

- [ ] Admin sees a "Pending Doctors" tab with unverified doctor accounts
- [ ] Admin sees a "Pending Pharmacies" tab with unverified pharmacy accounts
- [ ] Admin can approve a doctor/pharmacy → account verified, user notified
- [ ] Admin can reject with reason → account locked, user notified
- [ ] Unverified doctors/pharmacies are NOT shown on the map for other users
- [ ] Admin monitoring map uses role-based icons (from Phase 2)
- [ ] Admin monitoring map has a role filter (All / Patients / Doctors / Pharmacies)
- [ ] Admin dashboard shows role breakdown stats (patients/doctors/pharmacies count)
- [ ] Admin can delete any rating (moderation)
- [ ] New healthcare events appear in activity logs
