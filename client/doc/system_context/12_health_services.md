# Health Services (Symptom Checker & Diagnostic)

## Overview

CareConnect includes two server-side health analysis services that support patient self-assessment. Both operate without any external API dependencies — they use pure rule-based logic against medical knowledge built into the codebase. These services replaced GeoConnect's agricultural APIs (crop disease detection, satellite NDVI analysis).

---

## Symptom Analysis Service (`server/src/services/symptomAnalysisService.js`)

### Purpose
Matches a patient's reported symptoms against a curated set of 10 common medical conditions and returns ranked matches with urgency levels and recommendations.

### `analyzeSymptoms({ symptoms, age, gender })`

**Input**:
```js
{
  symptoms: ["fever", "cough", "shortness of breath"],  // string array
  age:      35,      // optional
  gender:   "male"   // optional
}
```

**Algorithm**:
1. Normalizes all symptom strings to lowercase
2. For each condition in `SYMPTOM_DB`, counts how many of the condition's known symptoms appear in the input
3. Sorts by `matchCount` descending, then by urgency
4. Returns top 3 matches

**Output**:
```js
{
  matches: [
    {
      condition:       "COVID-19",
      urgency:         "medium",
      matchedSymptoms: ["fever", "cough", "shortness of breath"],
      matchCount:      3,
      recommendations: [
        "Isolate immediately",
        "Get tested",
        "Monitor oxygen levels",
        "Seek emergency care if SpO2 < 94%"
      ]
    },
    ...
  ],
  overallUrgency: "medium",  // highest urgency among top matches
  disclaimer: "This is a preliminary analysis only..."
}
```

### Urgency Levels

| Level | Color in UI | Meaning |
|-------|------------|---------|
| `low` | green | Self-care appropriate, monitor at home |
| `medium` | orange | Should see a doctor within 24-48 hours |
| `critical` | red | Seek emergency care immediately |

### Condition Database (`SYMPTOM_DB`)

| Condition | Urgency | Key Symptoms |
|-----------|---------|-------------|
| Common Cold | low | runny nose, sneezing, mild fever, cough |
| Influenza | medium | high fever, body aches, fatigue, chills |
| COVID-19 | medium | fever, dry cough, loss of taste/smell |
| Hypertension | medium | headache, dizziness, blurred vision, chest pain |
| Migraine | low | severe headache, nausea, light sensitivity |
| Gastroenteritis | medium | diarrhea, vomiting, stomach cramps |
| UTI | medium | burning urination, pelvic pain, urgency |
| Anxiety/Panic | low | chest tightness, rapid heartbeat, trembling |
| Cardiac Emergency | **critical** | severe chest pain, left arm pain, jaw pain |
| Respiratory Infection | medium | productive cough, wheezing, chest pain |

The Cardiac Emergency condition always triggers a `critical` urgency level and recommends calling emergency services immediately.

### `detectPrescriptionDisease(imageUrl, notes)`

A stub function for image-based prescription analysis. Returns a structured response indicating that the image has been submitted for manual doctor review, since automated medical image analysis requires a licensed medical imaging API.

---

## Diagnostic Service (`server/src/services/diagnosticService.js`)

### Purpose
Provides vital sign assessment and BMI calculation using standard medical thresholds. Returns a health score (0–1) and categorized status.

### `assessPatientVitals({ heartRate, systolic, diastolic, temperature, oxygenSaturation, bmi })`

**Input**: Any combination of vital measurements (all optional)

**Output**:
```js
{
  score:          0.75,        // 0.0 (critical) → 1.0 (perfect)
  healthStatus:   "stable",    // "healthy"|"stable"|"worsening"|"critical"
  issues:         ["High blood pressure"],
  recommendations: ["Monitor blood pressure daily and consult your doctor."],
  assessedAt:     "2026-05-24T..."
}
```

### Health Score Thresholds

| Vital | Deduction | Condition |
|-------|-----------|-----------|
| Heart rate | −0.2 | < 50 or > 120 bpm |
| Heart rate | −0.1 | < 60 or > 100 bpm |
| Blood pressure | −0.35 | Hypertensive crisis (≥180/120) |
| Blood pressure | −0.2 | High (≥140/90) |
| Blood pressure | −0.15 | Low (< 90/60) |
| Temperature | −0.25 | High fever (≥39.5°C) |
| Temperature | −0.15 | Fever (≥38.0°C) |
| Temperature | −0.25 | Hypothermia (< 35.5°C) |
| Oxygen saturation | −0.4 | Critical (< 90%) |
| Oxygen saturation | −0.2 | Low (< 95%) |
| BMI | −0.2 | Severely abnormal (< 16 or ≥40) |
| BMI | −0.1 | Outside healthy range (< 18.5 or ≥30) |

### Status Categories

| Score Range | Status |
|-------------|--------|
| ≥ 0.85 | `"healthy"` |
| 0.65 – 0.84 | `"stable"` |
| 0.40 – 0.64 | `"worsening"` |
| < 0.40 | `"critical"` |

### `calculateBMI(weightKg, heightCm)`

```js
const heightM = heightCm / 100;
return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
```

Returns `null` if either input is missing or zero.

### `getFieldHealth({ prescriptionRecord })`

Derives health data from the prescription's stored `healthHistory` and `currentHealth`. This replaced the old satellite API call and reads only from the local database.

---

## REST Endpoints

All health service endpoints live under `/api/monitoring`:

### `POST /api/monitoring/analyze-symptoms`

```
Auth: Required (any role)

Request:
{
  symptoms: ["fever", "cough", "fatigue"],
  age: 28,       // optional
  gender: "female"  // optional
}

Response:
{
  matches: [...],
  overallUrgency: "medium",
  disclaimer: "..."
}
```

### `POST /api/monitoring/assess-vitals`

```
Auth: Required (any role)

Request:
{
  heartRate:        78,
  systolic:         130,
  diastolic:        85,
  temperature:      37.2,
  oxygenSaturation: 98,
  weightKg:         72,
  heightCm:         175
}

Response:
{
  score:           0.8,
  healthStatus:    "stable",
  issues:          ["High blood pressure"],
  recommendations: [...],
  bmi:             23.5,
  assessedAt:      "2026-05-24T..."
}
```

---

## `SymptomChecker` Component (`client/src/components/HealthMetrics/SymptomChecker.jsx`)

A self-contained React card component for patient use:

### Features
- **Common symptom chips**: Pre-defined common symptoms as toggleable chips
- **Custom input**: Type any symptom and press Enter to add it
- **Active symptom tags**: Shows selected symptoms as deletable chips
- **Analyze button**: Sends symptoms to `/api/monitoring/analyze-symptoms`
- **Results panel**: Shows top condition matches with urgency indicator

### Urgency display
- `low` → green `CheckCircleIcon`
- `medium` → orange `WarningIcon`
- `critical` → red `WarningIcon`

Each matched condition shows:
- Condition name
- Which submitted symptoms matched
- Tailored recommendations list
- Urgency-colored background

### Disclaimer
The component always displays: *"This is a preliminary analysis only. Please consult a licensed healthcare professional for a proper diagnosis."*

---

## Key Invariants

1. Both services are **pure local functions** — no network calls, no API keys required
2. The symptom matcher uses **partial string matching** — "shortness of breath" matches "short" in a user input
3. The vitals scorer is **additive penalty** — starts at 1.0, deducts for each abnormal reading; clamped to [0, 1]
4. `getFieldHealth()` is a **read-only function** — it never writes to the database
5. The image analysis (`detectPrescriptionDisease`) is a **stub** — it returns a flag `reviewRequired: true` to indicate that a doctor must manually review the image
6. These services are healthcare decision-support tools only — they must never be presented as medical diagnoses
