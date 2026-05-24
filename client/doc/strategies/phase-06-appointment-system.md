# Phase 6 — Appointment System
**Status: PENDING**
**Depends on: Phase 1, Phase 4**
**Priority: Medium**

---

## Goal

Patients can book appointments with doctors. Doctors can accept or decline. Appointments appear in the calendar for both parties.

---

## Current State

- A calendar page exists (`/calendar`) but is a basic stub with no appointment data.
- No appointment model, controller, or routes exist.
- Doctor availability fields (`availableDays`, `availableFrom`, `availableTo`) are added in Phase 1.

---

## Tasks

### 6.1 — Appointment Model

**File to create:** `server/src/models/appointmentModel.js`

```js
const appointmentSchema = new mongoose.Schema({
  patientId:   { type: ObjectId, ref: "User", required: true, index: true },
  doctorId:    { type: ObjectId, ref: "User", required: true, index: true },
  scheduledAt: { type: Date, required: true },
  durationMin: { type: Number, default: 30 },
  reason:      { type: String, maxlength: 500, default: "" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "declined", "completed", "cancelled"],
    default: "pending",
  },
  notes:       { type: String, maxlength: 1000, default: "" },
  type:        { type: String, enum: ["in-person", "online"], default: "in-person" },
}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
appointmentSchema.index({ patientId: 1, scheduledAt: 1 });
```

### 6.2 — Appointment Controller

**File to create:** `server/src/controllers/appointmentController.js`

Endpoints:
- `POST /api/appointments` — patient books (status: pending)
- `GET /api/appointments` — list appointments for logged-in user (as patient or doctor)
- `GET /api/appointments/:id` — get single appointment
- `PATCH /api/appointments/:id/status` — doctor confirms/declines; patient cancels
- `PATCH /api/appointments/:id` — update notes (doctor only)
- `DELETE /api/appointments/:id` — cancel (patient own pending only)

Business rules:
- Booking is only allowed during doctor's `availableDays` and `availableFrom–availableTo` window.
- No double-booking: check for conflicting appointments for the same doctor at the same time.
- On status change, send push notification to the other party.

### 6.3 — Appointment Routes

**File to create:** `server/src/routes/appointmentRoutes.js`

Register under `/api/appointments` in server entry point.

### 6.4 — Book Appointment Dialog

**File to create:** `client/src/components/Appointments/BookAppointmentDialog.jsx`

Steps:
1. Pick a date (MUI DatePicker) — shows only available days based on doctor's `availableDays`.
2. Pick a time slot (30-minute slots within `availableFrom–availableTo`).
3. Enter reason (optional).
4. Select type: In-Person / Online.
5. Submit → calls `POST /api/appointments`.

Triggered from: doctor profile page "Book Appointment" button.

### 6.5 — Appointments List Page

**File to create:** `client/src/app/appointments/page.js`
**File to create:** `client/src/app/appointments/loading.js`

Patient view:
- Upcoming appointments (confirmed/pending) with doctor name, date, time, type.
- Past appointments with status.
- Cancel button on pending appointments.

Doctor view:
- Pending requests (Accept / Decline buttons).
- Confirmed upcoming appointments.
- Past appointments with "Add Notes" button.

### 6.6 — Calendar Integration

**File to modify:** `client/src/app/calendar/page.js`

- Fetch appointments from `GET /api/appointments`.
- Render each appointment as a calendar event (colored by status).
- Click on event → show appointment details popup.

### 6.7 — Appointments Redux Slice

**File to create:** `client/src/utils/redux/appointmentSlice.js`

State: `{ appointments: [], loading: false, error: null }`

Thunks (in `appointmentThunks.js`):
- `fetchAppointments()`
- `bookAppointment(data)`
- `updateAppointmentStatus({ id, status })`
- `cancelAppointment(id)`

### 6.8 — Sidebar Navigation: Add Appointments

**File to modify:** `client/src/components/SidebarNav.jsx`

Add `{ href: "/appointments", label: "Appointments", icon: EventIcon }` to `PATIENT_MENU` and `DOCTOR_MENU`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `server/src/models/appointmentModel.js` | Appointment schema |
| `server/src/controllers/appointmentController.js` | Appointment CRUD + status |
| `server/src/routes/appointmentRoutes.js` | Appointment endpoints |
| `client/src/components/Appointments/BookAppointmentDialog.jsx` | Booking dialog |
| `client/src/app/appointments/page.js` | Appointments list page |
| `client/src/app/appointments/loading.js` | Loading skeleton |
| `client/src/utils/redux/appointmentSlice.js` | Appointments Redux state |
| `client/src/utils/redux/thunks/appointmentThunks.js` | Appointment thunks |
| `client/src/lib/appointmentApi.js` | Appointment API client |

## Files to Modify

| File | Change |
|------|--------|
| `client/src/app/calendar/page.js` | Show appointments as calendar events |
| `client/src/app/profile/page.js` | "Book Appointment" button for doctor profiles |
| `client/src/components/SidebarNav.jsx` | Add Appointments menu item |
| `client/src/utils/redux/store.js` | Register appointmentSlice |
| Server entry point | Register appointmentRoutes |

---

## Acceptance Criteria

- [ ] Patient can book an appointment with a doctor for available days/times
- [ ] Doctor receives push notification for new booking
- [ ] Doctor can accept or decline; patient is notified
- [ ] Patient can cancel a pending appointment
- [ ] Double-booking is prevented server-side
- [ ] Appointments appear in the calendar page for both parties
- [ ] Doctor dashboard shows pending appointment requests
- [ ] Appointments page shows upcoming and past appointments with correct status
