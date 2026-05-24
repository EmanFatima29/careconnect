import logger from "../../lib/logger.js";

const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL || "http://localhost:5001";

/**
 * Analyze sentiment of a text message via the Python microservice.
 * Returns { score, label, language } or null on failure.
 */
export async function analyzeSentiment(text) {
  if (!text || typeof text !== "string" || text.trim().length < 3) return null;

  try {
    const response = await fetch(`${SENTIMENT_API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      score: data.score ?? 0,
      label: data.label || "neutral",
      language: data.language || "unknown",
    };
  } catch (err) {
    logger.error("[Sentiment] Analysis failed:", err.message);
    return null;
  }
}
