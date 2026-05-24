# Admin Features

## Overview

Admin users have elevated platform-wide access. Their responsibilities include approving new doctor and pharmacy registrations, monitoring platform activity, managing users, viewing analytics, and reviewing healthcare statistics. All admin routes are double-protected: first by `requireAuth`, then by `requireAdmin`.

---

## Admin Role Access

Only users with `roles === "admin"` or `roles === "superadmin"` can access admin features. This is enforced at the route level:

```js
// server/src/routes/adminRoutes.js
router.use(requireAuth);    // must be logged in
router.use(requireAdmin);   // must be admin or superadmin
```

On the frontend, admin pages use `RoleGuard`:

```jsx
<RoleGuard allowedRoles={["admin", "superadmin"]}>
  <AdminPage />
</RoleGuard>
```

And the sidebar renders `ADMIN_MENU` (which includes admin-only links) only when `inferRole() === "admin"`.

---

## Admin REST API Endpoints

### Standard Admin Stats (`GET /api/admin/stats/*`)

| Route | Description |
|-------|-------------|
| `GET /api/admin/stats/users` | User breakdown by role, online status, growth over time |
| `GET /api/admin/stats/prescriptions` | Prescription counts, status distribution |
| `GET /api/admin/stats/chats` | Chat and message counts, top senders, activity by day |
| `GET /api/admin/healthcare-stats` | Doctor/pharmacy counts, pending verifications, appointment/prescription totals |

### Activity Logs (`GET /api/admin/activity-logs`)

Paginated system activity log. Supports filters:
- `from` / `to` (date range, defaults to last 30 days)
- `actorId` (filter by specific user)

### Professional Verification Workflow

| Route | Description |
|-------|-------------|
| `GET /api/admin/pending-verifications` | Lists all unverified doctors and pharmacies |
| `PATCH /api/admin/verify/:userId` | Approve a doctor or pharmacy |
| `PATCH /api/admin/reject/:userId` | Mark a professional as rejected |

---

## Healthcare Stats Response

```js
// GET /api/admin/healthcare-stats
{
  doctors: {
    total:    15,
    verified: 12,
    pending:  3
  },
  pharmacies: {
    total:    8,
    verified: 6,
    pending:  2
  },
  appointments: 142,
  prescriptions: 867
}
```

---

## Professional Verification Workflow

### Why verification exists

Doctors and pharmacies self-register by selecting their role at signup. To prevent anyone from claiming to be a medical professional without validation, all doctors and pharmacies start with `verified: false`. Until approved:
- They are **invisible on the patient map** (excluded from nearby users query)
- They see a **warning banner** on their dashboard: "Your account is pending verification"
- Patients cannot book appointments with them

### Admin approval flow

```
1. Doctor registers → doctorProfile.verified = false
                    ↓
2. Admin opens /admin/verifications
   → Sees all unverified doctors and pharmacies
   → Reviews: name, email, specialty, license number, registration date
                    ↓
3. Admin clicks "Approve"
   → PATCH /api/admin/verify/:userId
   → Server: user.doctorProfile.verified = true → user.save()
                    ↓
4. Doctor's verified banner changes to green "Account verified"
   → They appear on the public map
   → Patients can now see and book them
```

### `verifyProfessional` controller

```js
const user = await User.findById(req.params.userId);
if (user.roles === "doctor") {
  user.doctorProfile.verified = true;
} else if (user.roles === "pharmacy") {
  user.pharmacyProfile.verified = true;
} else {
  return res.status(400).json({ error: "Not a doctor or pharmacy" });
}
await user.save();
```

---

## Verification UI (`client/src/app/admin/verifications/page.js`)

A tabbed page with two tabs:
- **Doctors** (count badge)
- **Pharmacies** (count badge)

Each professional shows:
- Avatar + Name + Email
- Role chip (green for doctor, orange for pharmacy)
- Specialty (doctors) or License number
- Registration date
- **[Approve]** and **[Reject]** action buttons

Action buttons are disabled while an action is in progress. Success/error alerts appear inline.

---

## Admin Dashboard (`AdminDashboard` component in `dashboard/page.js`)

The admin dashboard shows platform-wide stats with auto-refresh:

### Stats cards
- Total Users
- Total Chats
- Total Prescriptions
- Online Users

### Charts (using `PatientHealthChart`)
- User Growth (new registrations per day, last 30 days)
- Prescription Distribution (by status)
- Messaging Activity (messages per day)

### Top Senders panel
Lists the top 5 most active message senders.

### User Breakdown card
- By Role: count per role (patient, doctor, pharmacy, admin)
- By Account Type: public / limited / private counts
- By Online Status: online vs. offline

### Sentiment Overview
`SentimentWidget` shows platform-wide chat sentiment distribution.

### Platform Health Alerts
Auto-generated alerts such as:
- "No users currently online"
- "X new users this month"
- "No recent messaging activity"

### Admin Quick Actions
Links to: User Management, Activity Logs, Analytics, Groups

---

## User Management (`client/src/app/admin/users/page.js`)

The admin users page provides:
- Search users by name/email
- View user details (role, status, join date)
- Change user roles
- Delete users (`DELETE /api/users/:_id`)

---

## Activity Logs (`client/src/app/admin/logs/page.js`)

Paginated view of the `ActivityLog` collection:

```js
// ActivityLog schema (simplified)
{
  actorId:    ObjectId,   // who performed the action
  actorName:  String,
  action:     String,     // e.g., "created", "updated", "deleted"
  entityType: String,     // e.g., "user", "prescription", "message"
  entityId:   ObjectId,
  createdAt:  Date
}
```

Filterable by:
- Date range (from/to)
- Actor ID

---

## Admin Monitoring Map

Admins have access to a special monitoring map (`AdminMonitoringMap.jsx`) at the `/monitoring` route that:
- Shows **all** users (not filtered by `locationSharing`)
- Uses role-aware colored markers (same `makeRoleIcon` factory)
- Has a role filter panel (All / Doctors / Pharmacies / Patients) with user counts
- Popup shows role chip + rating + online status

---

## Redux State — Admin

```js
// adminSlice
{
  userStats:         null,    // user breakdown, growth data
  prescriptionStats: null,    // prescription counts and status
  chatStats:         null,    // messaging metrics
  activityLogs:      null,    // { items: [], total }
  loading:           false,
  error:             null
}
```

**Not persisted** (admin data is always fetched fresh on mount).

### Key Thunks

| Thunk | Fetches |
|-------|---------|
| `fetchUserStats()` | `GET /api/admin/stats/users` |
| `fetchPrescriptionStats()` | `GET /api/admin/stats/prescriptions` |
| `fetchChatStats()` | `GET /api/admin/stats/chats` |
| `fetchActivityLogs({ limit })` | `GET /api/admin/activity-logs` |

---

## Key Invariants

1. All `/api/admin/*` routes require both `authenticate` AND `requireAdmin` middleware
2. `verified: false` makes a doctor/pharmacy invisible on the patient-facing map — this is the primary gate
3. `reject` does not delete the user — it simply leaves `verified: false`; the user can re-apply
4. Superadmin inherits all admin capabilities (treated identically in the codebase)
5. Admin cannot self-rate or rate others — the rating system RBAC blocks this (`roles !== "patient"`)
