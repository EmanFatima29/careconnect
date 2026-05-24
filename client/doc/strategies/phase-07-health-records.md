# Phase 7 — Health Records Extension
**Status: PENDING**
**Depends on: Phase 1, Phase 4**
**Priority: Medium**

---

## Goal

Extend the existing prescriptions feature into a complete health record system that includes medical history, lab reports, diagnoses, and AI-powered symptom analysis — replacing the current placeholder services with real healthcare logic.

---

## Current State

- `prescriptionModel.js` exists with `healthHistory[]` and `currentHealth` sub-documents — partially used.
- `diagnosticService.js` is a GeoConnect satellite NDVI service adapted with healthcare names but still calls a farming API (`greenreport.ku.edu`) — needs full replacement.
- `symptomAnalysisService.js` calls `agentcrop.com/api/detect` (a crop disease API) — needs full replacement.
- `HealthMetricsCard.jsx` and `PatientHealthChart.jsx` exist but feed from placeholder data.
- `/api/health-metrics/route.js` exists but the backing service is not healthcare-aware.

---

## Tasks

### 7.1 — Replace Diagnostic Service with Real Healthcare Logic

**File to rewrite:** `server/src/services/diagnosticService.js`

Replace the satellite NDVI API call with a vitals assessment service:
- Accept `{ heartRate, bloodPressure, temperature, oxygenSaturation }` as inputs.
- Implement rule-based health status classification (no external API needed for MVP):
  ```js
  function classifyHealth({ heartRate, bloodPressure, temperature, oxygenSaturation }) {
    // Rule-based classification
    if (oxygenSaturation < 90 || heartRate > 150 || heartRate < 40) return "critical";
    if (oxygenSaturation < 95 || heartRate > 120 || temperature > 39.5) return "worsening";
    if (heartRate > 100 || temperature > 37.5) return "stable";
    return "healthy";
  }
  ```
- Return `{ healthStatus, recommendations[], confidence }`.

### 7.2 — Replace Symptom Analysis Service

**File to rewrite:** `server/src/services/symptomAnalysisService.js`

Replace the crop disease detection API with a symptom checker:
- Accept `{ symptoms: string[] }` (e.g. ["fever", "cough", "fatigue"]).
- Use a rule-based approach for MVP:
  - Map common symptom combinations to likely conditions with confidence scores.
  - Provide recommendation strings.
- Optional (post-MVP): integrate a real medical NLP API (e.g. Infermedica, MedPaLM, or an open-source model).

### 7.3 — Health Metrics Model

**File to create:** `server/src/models/healthMetricModel.js`

```js
const healthMetricSchema = new mongoose.Schema({
  patientId:       { type: ObjectId, ref: "User", required: true, index: true },
  recordedAt:      { type: Date, default: Date.now },
  heartRate:       { type: Number },          // bpm
  bloodPressure:   { systolic: Number, diastolic: Number },
  temperature:     { type: Number },          // Celsius
  oxygenSaturation:{ type: Number },          // %
  weight:          { type: Number },          // kg
  bloodGlucose:    { type: Number },          // mg/dL
  notes:           { type: String, maxlength: 500 },
  source:          { type: String, enum: ["manual", "device", "doctor"], default: "manual" },
}, { timestamps: true });

healthMetricSchema.index({ patientId: 1, recordedAt: -1 });
```

### 7.4 — Health Metrics Controller & Routes

**File to create:** `server/src/controllers/healthMetricController.js`
**File to create:** `server/src/routes/healthMetricRoutes.js`

Endpoints:
- `POST /api/health-metrics` — log a reading
- `GET /api/health-metrics` — list readings (paginated, date-range filter)
- `GET /api/health-metrics/latest` — most recent reading
- `GET /api/health-metrics/summary` — min/max/avg for each vital over last 30 days
- `DELETE /api/health-metrics/:id` — delete own reading

### 7.5 — Medical History / Diagnosis Record

**File to create:** `server/src/models/diagnosisModel.js`

```js
const diagnosisSchema = new mongoose.Schema({
  patientId:   { type: ObjectId, ref: "User", required: true, index: true },
  doctorId:    { type: ObjectId, ref: "User" },
  condition:   { type: String, required: true },
  icdCode:     { type: String },           // Optional ICD-10 code
  diagnosedAt: { type: Date, default: Date.now },
  severity:    { type: String, enum: ["mild", "moderate", "severe"] },
  status:      { type: String, enum: ["active", "resolved", "chronic"], default: "active" },
  notes:       { type: String, maxlength: 2000 },
  attachments: [{ type: String }],        // Cloudinary URLs for lab reports
}, { timestamps: true });
```

Controller + Routes follow same pattern as prescriptions.

### 7.6 — Health Metrics UI

**File to modify:** `client/src/components/HealthMetrics/HealthMetricsWidget.jsx`

Replace placeholder data with real API calls:
- Fetch from `GET /api/health-metrics/latest` on mount.
- Show real vitals with color-coded status indicators.
- "Log New Reading" button opens a form dialog.

**File to modify:** `client/src/components/Dashboard/PatientHealthChart.jsx`

Replace mock chart data with real time-series from `GET /api/health-metrics?limit=30`.

### 7.7 — Health Records Page

**File to create:** `client/src/app/health-records/page.js`
**File to create:** `client/src/app/health-records/loading.js`

Tabs:
1. **Vitals** — list of health metric readings with chart.
2. **Prescriptions** — existing prescriptions page content.
3. **Diagnoses** — list of diagnosis records.
4. **Lab Reports** — uploaded lab report images (Cloudinary).

### 7.8 — Symptom Checker UI

**File to create:** `client/src/components/HealthMetrics/SymptomChecker.jsx`

- Multi-select symptom input (chips).
- Submit → POST to `POST /api/symptoms/analyze`.
- Show result: likely condition, confidence, recommendations.
- Shown on the patient dashboard as a quick-access widget.

**File to create:** `server/src/routes/symptomRoutes.js`
**File to create:** `server/src/controllers/symptomController.js`

---

## Files to Create

| File | Purpose |
|------|---------|
| `server/src/models/healthMetricModel.js` | Vitals schema |
| `server/src/models/diagnosisModel.js` | Diagnosis/medical history schema |
| `server/src/controllers/healthMetricController.js` | Vitals CRUD |
| `server/src/controllers/symptomController.js` | Symptom analysis endpoint |
| `server/src/routes/healthMetricRoutes.js` | Vitals endpoints |
| `server/src/routes/symptomRoutes.js` | Symptom analysis endpoint |
| `client/src/app/health-records/page.js` | Health records tabbed page |
| `client/src/app/health-records/loading.js` | Loading skeleton |
| `client/src/components/HealthMetrics/SymptomChecker.jsx` | Symptom checker widget |

## Files to Rewrite

| File | Change |
|------|--------|
| `server/src/services/diagnosticService.js` | Replace NDVI/satellite with vitals classifier |
| `server/src/services/symptomAnalysisService.js` | Replace crop disease API with symptom checker |

## Files to Modify

| File | Change |
|------|--------|
| `client/src/components/HealthMetrics/HealthMetricsWidget.jsx` | Wire real API |
| `client/src/components/Dashboard/PatientHealthChart.jsx` | Real time-series data |
| `client/src/app/api/health-metrics/route.js` | Proxy to real backend endpoint |
| `client/src/components/SidebarNav.jsx` | Add Health Records nav item |

---

## Acceptance Criteria

- [ ] Patient can log vitals (heart rate, BP, temperature, O2 sat, weight, glucose)
- [ ] Health chart shows real time-series data from DB
- [ ] Symptom checker returns a meaningful result (not a placeholder/error)
- [ ] Diagnostic service classifies health status from real vitals
- [ ] Doctor can add a diagnosis record for a patient
- [ ] Health records page shows vitals, prescriptions, diagnoses in tabs
- [ ] `diagnosticService.js` no longer calls `greenreport.ku.edu`
- [ ] `symptomAnalysisService.js` no longer calls `agentcrop.com`
