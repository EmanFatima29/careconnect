# Appointment System

## Overview

CareConnect allows patients to book appointments with doctors directly from the map or from anywhere the doctor's profile is shown. Doctors manage their appointment queue — confirming, completing, or marking no-shows. All status changes are RBAC-gated so only the appropriate actor can perform each transition.

---

## Appointment Schema (`server/src/models/appointmentModel.js`)

```js
{
  patientId:       { type: ObjectId, ref: "User", required: true, index: true },
  doctorId:        { type: ObjectId, ref: "User", required: true, index: true },
  date:            { type: Date, required: true },
  durationMinutes: { type: Number, default: 30, min: 10, max: 240 },
  reason:          { type: String, maxlength: 500, default: "" },
  notes:           { type: String, maxlength: 2000, default: "" },
  status:          {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
    default: "pending",
    index: true
  },
  cancelledBy:     { type: String, enum: ["patient", "doctor", null], default: null },
  cancelReason:    { type: String, maxlength: 300, default: "" },
  createdAt, updatedAt
}

// Compound indexes for efficient queries
index({ doctorId: 1, date: 1 })
index({ patientId: 1, date: -1 })
```

---

## Status Lifecycle

```
          ┌─────────────────────────────────┐
          │                                 │
[Booked] → pending ──► confirmed ──► completed
                  │         │
                  └─►cancelled◄──────────────
                            │
                        no-show (doctor only)
```

### Status Transition Rules

| Status | Who can set it |
|--------|---------------|
| `pending` | System (on creation only) |
| `confirmed` | Doctor only |
| `completed` | Doctor only |
| `cancelled` | Patient (own pending), Doctor (any confirmed/pending), Admin (any) |
| `no-show` | Doctor only |

Enforced server-side in `appointmentController.updateAppointmentStatus`:

```js
const allowed = {
  patient: ["cancelled"],
  doctor:  ["confirmed", "cancelled", "completed", "no-show"],
  admin:   ["pending", "confirmed", "cancelled", "completed", "no-show"],
};

if (!allowed[role].includes(status)) {
  return res.status(400).json({ error: `Cannot set '${status}' as ${role}` });
}
```

---

## REST API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/appointments` | Patient | Book a new appointment |
| `GET` | `/api/appointments` | Authenticated | Get own appointments (role-filtered) |
| `PATCH` | `/api/appointments/:id/status` | Authenticated | Update appointment status |
| `GET` | `/api/appointments/availability/:doctorId` | Public | Get booked slots for a doctor on a date |

---

## Booking Flow

### Client Side (`BookAppointmentDialog`)

1. Patient opens map → clicks on a doctor marker → "Book Appointment" button appears
2. Dialog opens with:
   - Doctor info card (name, specialty, avatar)
   - Date picker (min = today)
   - Time picker
   - Duration chips (15 / 30 / 45 / 60 min)
   - Reason textarea (500 chars)
3. Patient submits → `bookAppointment` Redux thunk → `POST /api/appointments`

### Server Side (`appointmentController.bookAppointment`)

```js
1. Confirm req.user.roles === "patient"
2. Validate doctorId → fetch user → confirm roles === "doctor"
3. Validate date is in the future
4. Conflict check:
   Appointment.findOne({
     doctorId,
     status: { $in: ["pending", "confirmed"] },
     date: { $lt: slotEnd, $gte: appointmentDate }
   })
   → 409 Conflict if overlap found
5. Create appointment document
6. Return populated appointment (patient + doctor info)
```

---

## Appointments Page (`client/src/app/appointments/page.js`)

A tabbed page with filters: **All / Pending / Confirmed / Completed / Cancelled**

### Patient view

- Lists all their booked appointments
- Shows doctor name, date/time, duration, reason
- Status chip with color coding
- "Cancel" button for pending appointments

### Doctor view

- Lists all appointments for their patients
- **Pending** → [Confirm] [Cancel] buttons
- **Confirmed** → [Mark Complete] [No Show] buttons
- Uses `inferRole()` to determine which action buttons to render

---

## Redux State — Appointments

```js
// appointmentSlice
{
  appointments: [],     // flat array, all statuses
  total:        0,
  loading:      false,
  submitting:   false,
  error:        null
}
```

**Not persisted** (transient data, always fetched fresh).

### Key Thunks (`client/src/utils/redux/thunks/appointmentThunks.js`)

| Thunk | Action |
|-------|--------|
| `fetchMyAppointments(params)` | Load appointments for current user |
| `bookAppointment(payload)` | Create new appointment |
| `updateAppointmentStatus({ id, status, cancelReason })` | Change status |

After `bookAppointment` succeeds, the new appointment is prepended to `state.appointments` immediately.

After `updateAppointmentStatus`, the affected appointment is replaced in-place in the array.

---

## Doctor Availability Check

The availability endpoint returns already-booked slots for a given date — useful for a future calendar view to show only open time slots:

```
GET /api/appointments/availability/:doctorId?date=2026-06-01

Response:
{
  date: "2026-06-01",
  bookedSlots: [
    { date: "2026-06-01T09:00:00Z", durationMinutes: 30 },
    { date: "2026-06-01T14:00:00Z", durationMinutes: 60 }
  ]
}
```

Only slots with status `"pending"` or `"confirmed"` are returned.

---

## Doctor Dashboard Integration

The doctor dashboard (`DoctorDashboard.jsx`) shows appointment-adjacent data:

- **Total Patients** — distinct `patientId` values from prescriptions issued by this doctor
- **Prescriptions This Week** — prescriptions created in the last 7 days
- **Average Rating** — from `ratingSummary.averageRating`

The appointments page is separate from the dashboard — it shows the full appointment list with action buttons.

---

## Conflict Detection

The server performs a simple overlap check before creating an appointment:

```js
const slotEnd = new Date(appointmentDate.getTime() + durationMinutes * 60_000);
const conflict = await Appointment.findOne({
  doctorId,
  status: { $in: ["pending", "confirmed"] },
  date: { $lt: slotEnd, $gte: appointmentDate }
});
if (conflict) return res.status(409).json({ error: "Doctor already has an appointment at that time" });
```

This is a simple point-in-time check. Overlapping intervals within the same slot are not yet handled (future improvement).

---

## Key Invariants

1. Only `patient` role can call `POST /api/appointments` — doctors cannot self-book
2. Ownership is verified on every status update — a patient cannot confirm their own appointment
3. A cancelled appointment cannot be re-opened — status transitions are one-directional from `cancelled`
4. `cancelledBy` tracks who initiated the cancellation (`"patient"` or `"doctor"`)
5. The conflict check only looks at `pending` and `confirmed` — `cancelled`/`completed` slots are considered free
6. Duration is constrained to 10–240 minutes by the schema
