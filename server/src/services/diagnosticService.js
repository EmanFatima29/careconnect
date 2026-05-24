import logger from "../../lib/logger.js";

/**
 * Assess patient vital signs against standard medical thresholds.
 * Returns a health score (0–1) and categorized status.
 */
export function assessPatientVitals({ heartRate, systolic, diastolic, temperature, oxygenSaturation, bmi } = {}) {
  const issues = [];
  let score = 1.0;

  if (heartRate != null) {
    if (heartRate < 50 || heartRate > 120) { issues.push("Abnormal heart rate"); score -= 0.2; }
    else if (heartRate < 60 || heartRate > 100) { issues.push("Heart rate out of optimal range"); score -= 0.1; }
  }

  if (systolic != null && diastolic != null) {
    if (systolic >= 180 || diastolic >= 120) { issues.push("Hypertensive crisis"); score -= 0.35; }
    else if (systolic >= 140 || diastolic >= 90) { issues.push("High blood pressure"); score -= 0.2; }
    else if (systolic < 90 || diastolic < 60) { issues.push("Low blood pressure"); score -= 0.15; }
  }

  if (temperature != null) {
    if (temperature >= 39.5) { issues.push("High fever"); score -= 0.25; }
    else if (temperature >= 38.0) { issues.push("Fever"); score -= 0.15; }
    else if (temperature < 35.5) { issues.push("Hypothermia"); score -= 0.25; }
  }

  if (oxygenSaturation != null) {
    if (oxygenSaturation < 90) { issues.push("Critical low oxygen"); score -= 0.4; }
    else if (oxygenSaturation < 95) { issues.push("Low oxygen saturation"); score -= 0.2; }
  }

  if (bmi != null) {
    if (bmi < 16 || bmi >= 40) { issues.push("Severely abnormal BMI"); score -= 0.2; }
    else if (bmi < 18.5 || bmi >= 30) { issues.push("BMI outside healthy range"); score -= 0.1; }
  }

  score = Math.max(0, Math.min(1, score));

  return {
    score,
    healthStatus: categorizeScore(score),
    issues,
    recommendations: buildRecommendations(issues),
    assessedAt: new Date().toISOString(),
  };
}

function categorizeScore(score) {
  if (score >= 0.85) return "healthy";
  if (score >= 0.65) return "stable";
  if (score >= 0.4)  return "worsening";
  return "critical";
}

function buildRecommendations(issues) {
  const recs = [];
  if (issues.some((i) => i.includes("blood pressure"))) recs.push("Monitor blood pressure daily and consult your doctor.");
  if (issues.some((i) => i.includes("oxygen")))        recs.push("Seek immediate medical attention for low oxygen levels.");
  if (issues.some((i) => i.includes("fever")))         recs.push("Stay hydrated and rest. Consult a doctor if fever persists > 48 hours.");
  if (issues.some((i) => i.includes("heart rate")))    recs.push("Avoid strenuous activity and monitor heart rate.");
  if (issues.some((i) => i.includes("BMI")))           recs.push("Consider a nutritionist consultation for healthy weight management.");
  if (issues.length === 0)                             recs.push("Vitals look good. Maintain regular health check-ups.");
  return recs;
}

/**
 * Calculate BMI from weight (kg) and height (cm).
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm === 0) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Get health data for a prescription — computes based on its health history.
 * Drop-in replacement for the removed GeoConnect Sentinel API call.
 */
export async function getFieldHealth({ prescriptionId, prescriptionRecord } = {}) {
  try {
    if (!prescriptionRecord) return null;

    const latestHistory = prescriptionRecord.healthHistory?.slice(-1)[0];
    const current = prescriptionRecord.currentHealth;

    const score = current?.vitals ?? (latestHistory?.vitals ?? null);
    const healthStatus = current?.status ?? categorizeScore(score ?? 0.8);

    return {
      score,
      healthStatus,
      lastChecked: current?.lastChecked ?? null,
      history: prescriptionRecord.healthHistory?.slice(-30) || [],
    };
  } catch (err) {
    logger.error("[Diagnostic] assessPatientVitals failed:", err.message);
    return null;
  }
}
