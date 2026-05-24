import logger from "../../lib/logger.js";

const PRESCRIPTION_ANALYSIS_API_URL = "https://agentcrop.com/api/detect";

/**
 * Analyze a prescription image for diseases using a compliant prescription analysis API.
 * Fully free — no API key needed. Accepts PNG/JPG up to 50MB.
 * Auto-deletes images after analysis (privacy-focused).
 */
export async function detectPrescriptionDisease(imageSource, mimeType = "image/jpeg") {
  try {
    let body;
    let headers = {};

    if (typeof imageSource === "string" && imageSource.startsWith("http")) {
      body = JSON.stringify({ image_url: imageSource });
      headers["Content-Type"] = "application/json";
    } else {
      const formData = new FormData();
      const blob = new Blob([imageSource], { type: mimeType });
      formData.append("image", blob, `upload.${mimeType.split("/")[1] || "jpg"}`);
      body = formData;
    }

    const response = await fetch(PRESCRIPTION_ANALYSIS_API_URL, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error(`[PrescriptionAnalysis] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      disease: data.diagnosis || data.disease || data.result || null,
      confidence: data.confidence || null,
      treatment: data.recommendation || data.treatment || null,
      conditionName: data.plant || data.species || null,
      raw: data,
    };
  } catch (err) {
    logger.error("[PrescriptionAnalysis] Disease detection failed:", err.message);
    return null;
  }
}
