# Phase 5 — Pharmacy Features
**Status: PENDING**
**Depends on: Phase 1, Phase 3**
**Priority: High**

---

## Goal

Give pharmacy users a dedicated dashboard and profile that showcases their services, operating hours, and fulfilled prescriptions. Patients should be able to discover nearby pharmacies on the map and view their details.

---

## Current State

- No pharmacy role exists yet (added in Phase 1).
- No pharmacy-specific pages, routes, or dashboard components exist.
- The sidebar `PHARMACY_MENU` is a stub (added in Phase 1).
- Prescriptions exist but have no "fulfilled by pharmacy" concept.

---

## Tasks

### 5.1 — Pharmacy Dashboard

**File to create:** `client/src/app/pharmacy/page.js` (fleshed out from the stub created in Phase 1)
**File to create:** `client/src/components/Dashboard/PharmacyDashboard.jsx`

Sections:
- **Stats Row**: Prescriptions fulfilled this week | Active services | Average rating | Operating status (Open/Closed based on hours)
- **Recent Fulfilled Prescriptions**: Prescriptions marked as fulfilled by this pharmacy.
- **Services List**: Editable list of offered services (Delivery, 24hr, Lab Tests, etc.).
- **Rating Summary**: Average rating and last 5 patient reviews.

### 5.2 — Pharmacy Profile Page

**File to modify:** `client/src/app/profile/page.js`

When the logged-in user is a pharmacy, show additional fields:
- Pharmacy Name
- License Number (editable)
- Operating Hours (open/close time pickers)
- Services Offered (multi-select chips: Delivery, 24hr, Lab Tests, Vaccinations, etc.)
- Verified badge (set by admin)

When a *patient* or *doctor* views a *pharmacy's* profile:
- Show operating hours, services, and rating.
- Show "Rate this Pharmacy" button (Phase 3).
- License number hidden.
- Show "Get Directions" button → navigates on map to pharmacy location.

### 5.3 — Prescription Fulfillment

**File to create:** `server/src/models/prescriptionFulfillmentModel.js`

```js
const fulfillmentSchema = new mongoose.Schema({
  prescriptionId: { type: ObjectId, ref: "Prescription", required: true },
  patientId:      { type: ObjectId, ref: "User", required: true },
  pharmacyId:     { type: ObjectId, ref: "User", required: true },
  fulfilledAt:    { type: Date, default: Date.now },
  notes:          { type: String, maxlength: 500 },
}, { timestamps: true });
```

**File to create:** `server/src/controllers/pharmacyController.js`

Endpoints:
- `POST /api/pharmacy/fulfill/:prescriptionId` — pharmacy marks a prescription as fulfilled.
- `GET /api/pharmacy/fulfilled` — list prescriptions this pharmacy has fulfilled.
- `GET /api/pharmacy/stats` — fulfillments this week, total, rating.

**File to create:** `server/src/routes/pharmacyRoutes.js`

### 5.4 — Pharmacy Sidebar Menu (Finalize)

**File to modify:** `client/src/components/SidebarNav.jsx`

The `PHARMACY_MENU` stub from Phase 1 is finalized here — the pharmacy route `/pharmacy` is now live, so remove the stub comment and verify the link resolves correctly.

### 5.5 — Pharmacy Settings

**File to modify:** `client/src/app/settings/page.js`

For pharmacies: add "Pharmacy Profile" settings section:
- Operating Hours (open/close)
- Services offered (multi-select)
- License number
- Location sharing settings

Calls `PATCH /api/users/me` with `pharmacyProfile.*` fields.

### 5.6 — Pharmacy Discovery (Map Integration)

After Phase 2 is done, pharmacies already appear on the map with orange "Rx" markers.

Additional map enhancements for pharmacies:
- Pharmacy popup includes "Get Directions" button (triggers route display).
- Pharmacy popup includes "View Profile" link.
- Sidebar role filter already covers pharmacy (from Phase 2).

### 5.7 — Patient: Prescription Send to Pharmacy

**File to modify:** `client/src/app/prescriptions/page.js`

Add "Send to Pharmacy" button on each prescription:
- Opens a map-based pharmacy finder (nearby pharmacies).
- Patient selects a pharmacy.
- Sends notification to the pharmacy (`sendPushNotification` to pharmacy user).
- Status: patient-initiated; pharmacy confirms fulfillment (Phase 5.3).

---

## Files to Create

| File | Purpose |
|------|---------|
| `client/src/components/Dashboard/PharmacyDashboard.jsx` | Pharmacy dashboard view |
| `server/src/models/prescriptionFulfillmentModel.js` | Fulfillment record schema |
| `server/src/controllers/pharmacyController.js` | Pharmacy-specific API logic |
| `server/src/routes/pharmacyRoutes.js` | Pharmacy routes |

## Files to Modify

| File | Change |
|------|--------|
| `client/src/app/pharmacy/page.js` | Flesh out from Phase 1 stub |
| `client/src/app/profile/page.js` | Pharmacy profile fields + patient view |
| `client/src/app/settings/page.js` | Pharmacy profile settings section |
| `client/src/app/dashboard/page.js` | Render PharmacyDashboard for pharmacy role |
| `client/src/app/prescriptions/page.js` | "Send to Pharmacy" flow |
| `client/src/components/SidebarNav.jsx` | Finalize PHARMACY_MENU |
| Server entry point | Register pharmacyRoutes |

---

## Acceptance Criteria

- [ ] Pharmacy dashboard shows stats, fulfilled prescriptions, services, rating
- [ ] Pharmacy profile shows operating hours, services, verified badge
- [ ] Patient can view a pharmacy profile and see operating hours + services
- [ ] Pharmacy can mark a prescription as fulfilled
- [ ] Patient can send a prescription to a specific pharmacy from the prescriptions page
- [ ] Pharmacy receives push notification when a patient sends a prescription
- [ ] "Get Directions" button in pharmacy map popup triggers route display
- [ ] Pharmacy settings page allows updating operating hours and services
