# Phase 4 — Doctor Features
**Status: PENDING**
**Depends on: Phase 1, Phase 3**
**Priority: High**

---

## Goal

Give doctors a meaningful workspace: a dashboard showing their patients and pending prescriptions, a fully-fledged doctor profile (specialty, availability, ratings), and the ability to create and assign prescriptions directly to patients.

---

## Current State

- Doctor role exists in `userModel.js` but `doctorProfile` sub-document is not yet there (added in Phase 1).
- Prescription model has `doctorId` field but the controller (`prescriptionController.js`) does not yet enforce doctor-to-patient assignment.
- `SidebarNav.jsx` has a `DOCTOR_MENU` but it mirrors the patient menu — no doctor-specific routes.
- No doctor dashboard, no patient list, no doctor profile page.

---

## Tasks

### 4.1 — Doctor Dashboard

**File to create:** `client/src/components/Dashboard/DoctorDashboard.jsx`

Sections:
- **Stats Row**: Total active patients | Prescriptions this week | Average rating | Upcoming appointments
- **My Patients**: List of patients who have received prescriptions from this doctor, with quick "Add Prescription" button.
- **Recent Prescriptions**: Last 10 prescriptions the doctor issued, with status chips (Prescribed / Active / Completed).
- **Rating Summary**: Current average rating and last 5 reviews.

Backend API needed:
- `GET /api/users/doctor/patients` — returns unique patients for the logged-in doctor (query: prescriptions where `doctorId = me`).
- `GET /api/prescriptions?doctorId=me` — existing endpoint extended to filter by `doctorId`.

### 4.2 — Doctor Profile Page

**File to modify:** `client/src/app/profile/page.js`

When the logged-in user is a doctor, the profile page shows additional fields:
- Specialty (editable)
- License Number (editable, shown masked for public views)
- Years of Experience
- Available Days (multi-select chips: Mon–Sun)
- Available From / To (time pickers)
- Consultation Fee
- Verified badge (set by admin)

When a *patient* views a *doctor's* profile:
- Show specialty, availability, fee, and rating.
- Show "Rate this Doctor" button.
- Show "Book Appointment" button (Phase 6).
- License number is hidden.

### 4.3 — Assign Prescription to Patient (Doctor Flow)

**File to modify:** `server/src/controllers/prescriptionController.js`

Extend `createPrescription`:
- A doctor can pass `patientId` to assign the prescription to a specific patient.
- Validate: `patientId` must exist and have `roles === "patient"`.
- Set `doctorId` to the logged-in doctor's ID.
- Push prescription to both `patient.prescriptions` array and notify patient via push.

**File to modify:** `client/src/app/prescriptions/page.js`

Add a "Assign to Patient" button for doctors:
- Opens a patient search dialog.
- Doctor selects patient, fills prescription fields, submits.

### 4.4 — Doctor's Patient List (New Route)

**File to create:** `server/src/routes/doctorRoutes.js`
**File to create:** `server/src/controllers/doctorController.js`

Endpoints:
- `GET /api/doctor/patients` — list unique patients (by `doctorId` in prescriptions)
- `GET /api/doctor/stats` — total patients, prescriptions this week, avg rating

### 4.5 — Patient Search Component

**File to create:** `client/src/components/Doctor/PatientSearchDialog.jsx`

- Search input that queries `GET /api/users?role=patient&search=<query>`.
- Shows matching patients with avatar and name.
- On select, fills prescription form with `patientId`.

### 4.6 — Doctor Settings in User Settings Page

**File to modify:** `client/src/app/settings/page.js`

For doctors: add "Doctor Profile" settings section:
- Specialty selector
- Available days/hours
- Consultation fee
- License number input

Calls `PATCH /api/users/me` with `doctorProfile.*` fields.

### 4.7 — Update Prescription Controller for Doctor Assignment

**File to modify:** `server/src/controllers/prescriptionController.js`

Current `listPrescriptions` only shows `ownerId` prescriptions. Extend:
- If requester is a doctor: also return prescriptions where `doctorId === userId`.
- Add `GET /api/prescriptions/assigned` for prescriptions a doctor issued to patients.

---

## Files to Create

| File | Purpose |
|------|---------|
| `client/src/components/Dashboard/DoctorDashboard.jsx` | Doctor's main dashboard view |
| `client/src/components/Doctor/PatientSearchDialog.jsx` | Patient search for prescriptions |
| `server/src/controllers/doctorController.js` | Doctor-specific API logic |
| `server/src/routes/doctorRoutes.js` | Doctor-specific routes |

## Files to Modify

| File | Change |
|------|--------|
| `client/src/app/profile/page.js` | Doctor profile fields + patient view |
| `client/src/app/prescriptions/page.js` | Doctor "Assign to Patient" flow |
| `client/src/app/settings/page.js` | Doctor profile settings section |
| `client/src/app/dashboard/page.js` | Render DoctorDashboard for doctor role |
| `server/src/controllers/prescriptionController.js` | Doctor-assigned prescription logic |
| Server entry point | Register doctorRoutes |

---

## Acceptance Criteria

- [ ] Doctor dashboard shows patient list, recent prescriptions, rating summary
- [ ] Doctor can assign a prescription to a specific patient
- [ ] Patient receives push notification when doctor assigns a prescription
- [ ] Doctor profile shows specialty, availability, fee, verified badge
- [ ] Patient viewing doctor profile sees "Rate" and "Book Appointment" buttons
- [ ] `GET /api/doctor/patients` returns unique patients for logged-in doctor
- [ ] Prescription list for doctors shows both own and assigned-to-patient prescriptions
