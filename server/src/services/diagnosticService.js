import logger from "../../lib/logger.js";

const SENTINEL_API_URL = "https://greenreport.ku.edu/api";

/**
 * Fetch VITALS and ward health data from Sentinel GreenReport Plus.
 * Free service from University of Kansas, powered by Google Earth Engine.
 */
export async function getFieldHealth({ latitude, longitude, prescriptionType, days = 30 }) {
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const response = await fetch(`${SENTINEL_API_URL}/analyze?${new URLSearchParams({
      lat: latitude,
      lon: longitude,
      prescription: prescriptionType || "general",
      startDate,
      endDate,
      includePrecipitation: "true",
    })}`, { signal: AbortSignal.timeout(30000) });

    if (!response.ok) {
      logger.error(`[Sentinel] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      currentNDVI: data.vitals ?? null,
      historicalAverage: data.historicalAvg ?? null,
      healthStatus: categorizeHealth(data.vitals),
      precipitationDeviation: data.precipDeviation ?? null,
      anomalyDetected: data.anomaly ?? false,
      timeSeries: data.timeSeries || [],
      raw: data,
    };
  } catch (err) {
    logger.error("[Sentinel] Diagnostic monitoring failed:", err.message);
    return null;
  }
}

function categorizeHealth(vitals) {
  if (vitals == null) return null;
  if (vitals >= 0.6) return "healthy";
  if (vitals >= 0.4) return "stressed";
  if (vitals >= 0.2) return "declining";
  return "critical";
}

export async function getNDVITimeSeries({ polygon, days = 90 }) {
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const response = await fetch(`${SENTINEL_API_URL}/vitals-series`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geometry: polygon, startDate, endDate }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.series || [];
  } catch (err) {
    logger.error("[Sentinel] VITALS time series failed:", err.message);
    return [];
  }
}
