# Prescription System

## Overview

Prescriptions are the primary health record object in CareConnect. A prescription represents a medication or treatment assigned to a patient. It can be created by the patient themselves or assigned by a doctor. The model also stores a health history — a log of AI-analyzed vitals, symptom analysis results, and uploaded images — attached directly to each prescription.

---

## Prescription Schema (`server/src/models/prescriptionModel.js`)

```js
{
  // Core fields
  patientId:  { type: ObjectId, ref: "User", required: true, index: true },
  doctorId:   { type: ObjectId, ref: "User", default: null },  // optional
  name:       { type: String, required: true, maxlength: 120 },
  dosage:     { type: String, maxlength: 120, default: "" },
  duration:   { type: Number, default: null, min: 0 },    // days
  startDate:  { type: Date, default: null },
  status:     {
    type: String,
    enum: ["Prescribed", "Active", "Completed", "Archived"],
    default: "Prescribed"
  },
  notes:      { type: String, maxlength: 2000, default: "" },

  // Location (where the prescription was issued / patient's location)
  location: {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }   // [lng, lat]
  },

  // AI health analysis log (append-only)
  healthHistory: [{
    date:            Date,
    vitals:          Number,          // health score 0–1
    healthStatus:    String,          // "healthy"|"stable"|"worsening"|"critical"|null
    symptomAnalysis: String,
    confidence:      Number,
    recommendations: [String],
    source:          String           // "diagnostic"|"photo"|"manual"
  }],

  // Latest health snapshot (denormalized from healthHistory[-1])
  currentHealth: {
    status:      String,
    lastChecked: Date,
    vitals:      Number
  },

  createdAt, updatedAt
}
```

### Status Lifecycle

```
Prescribed → Active → Completed
                  ↘ Archived
```

| Status | Meaning |
|--------|---------|
| `Prescribed` | Newly issued, not yet started |
| `Active` | Patient is currently taking this medication |
| `Completed` | Full course finished |
| `Archived` | Discontinued or no longer relevant |

Status is shown as a color-coded chip throughout the UI:
- `Prescribed` → info (blue)
- `Active` → success (green)
- `Completed` → default (grey)
- `Archived` → warning (orange)

---

## REST API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/prescriptions` | Patient | Get own prescriptions |
| `GET` | `/api/prescriptions/all` | Admin | Get all prescriptions |
| `POST` | `/api/prescriptions` | Patient | Create a new prescription |
| `PATCH` | `/api/prescriptions/:id` | Patient | Update prescription fields |
| `DELETE` | `/api/prescriptions/:id` | Patient | Delete (soft or hard) |

---

## Doctor Assignment

When a doctor creates or assigns a prescription:
```js
// POST /api/prescriptions
{
  patientId: "64abc...",
  doctorId: "64def...",     // set to the doctor's own ID
  name: "Amoxicillin",
  dosage: "500mg twice daily",
  duration: 7,
  status: "Prescribed"
}
```

The doctor's `getDoctorPrescriptions` endpoint returns all prescriptions where `doctorId` matches the requesting doctor:

```js
Prescription.find({ doctorId: req.user.userId })
  .populate("patientId", "name email profilePic")
  .sort({ createdAt: -1 })
```

---

## Health History — AI Analysis Log

The `healthHistory` array is an **append-only log**. Each entry is added when:
- The monitoring service runs a diagnostic check (`source: "diagnostic"`)
- A patient uploads a monitoring image (`source: "photo"`)
- A doctor or patient manually enters vitals (`source: "manual"`)

The `currentHealth` sub-document is a denormalized snapshot of the most recent history entry. It is updated in the same write operation as appending to `healthHistory`:

```js
await Prescription.findByIdAndUpdate(prescriptionId, {
  $push: { healthHistory: { date: new Date(), vitals: score, healthStatus, source } },
  $set: { "currentHealth.vitals": score, "currentHealth.status": healthStatus, "currentHealth.lastChecked": new Date() }
});
```

---

## Pharmacy Interaction

The prescription model has no direct `pharmacyId` field. Pharmacies see **all prescriptions with status `"Prescribed"`** as available work — this represents prescriptions that need to be filled.

```js
// pharmacyController.getPharmacyPrescriptions
Prescription.find({ status: "Prescribed" })
  .populate("patientId", "name email profilePic")
  .populate("doctorId",  "name email")
  .sort({ createdAt: -1 })
```

---

## Prescription CRUD UI (`client/src/app/prescriptions/page.js`)

The prescriptions page provides:
- A card grid of all prescriptions for the current user
- Add/Edit dialog with fields: Name, Dosage, Start Date, Duration, Status, Notes
- Delete with confirmation
- Status chip coloring

The edit dialog field `plantedDate` (GeoConnect legacy name) maps to `startDate` on the server — this is a naming inconsistency in the UI layer that does not affect functionality.

---

## Redux State — Prescriptions

```js
// prescriptionSlice
{
  prescriptions: [],    // array of Prescription objects
  loading:       false,
  error:         null
}
```

**Persisted** in redux-persist whitelist.

### Key thunks

| Thunk | Action |
|-------|--------|
| `fetchPrescriptions()` | Load own prescriptions |
| `fetchAllPrescriptions()` | Load all (admin only) |
| `createPrescription(data)` | Create new |
| `updatePrescription({ id, data })` | Edit existing |
| `deletePrescription(id)` | Remove |

---

## Monitoring Integration

The `/api/monitoring` routes extend the prescription system with health analysis:

| Route | Description |
|-------|-------------|
| `POST /api/monitoring/upload` | Upload a monitoring image (Cloudinary) |
| `GET /api/monitoring/images` | Get monitoring images for current user |
| `POST /api/monitoring/analyze-disease/:prescriptionId` | Submit image for review |
| `GET /api/monitoring/diagnostic/:prescriptionId` | Get health data from history |
| `GET /api/monitoring/health-report/:prescriptionId` | Unified health report |
| `POST /api/monitoring/analyze-symptoms` | Symptom checker (returns condition matches) |
| `POST /api/monitoring/assess-vitals` | Vitals assessment (returns health score) |

---

## Key Invariants

1. `patientId` is always required — every prescription belongs to a patient
2. `doctorId` is optional — patients can create self-reported prescriptions
3. `healthHistory` is append-only — entries are never deleted
4. `currentHealth` is a derived snapshot — always derived from `healthHistory`, not edited directly
5. Status transitions are not enforced by the server — any status value can be set at any time
6. The `location` field uses `[longitude, latitude]` order (GeoJSON), same as the User model
