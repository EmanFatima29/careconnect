import logger from "../../lib/logger.js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Speech-to-Text using ElevenLabs Scribe.
 */
export async function speechToText(audioBuffer, mimeType = "audio/webm", language = null) {
  if (!ELEVENLABS_API_KEY) {
    logger.error("[ElevenLabs] API key not configured");
    return null;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, `recording.${mimeType.split("/")[1] || "webm"}`);
    formData.append("model_id", "scribe_v1");
    if (language) formData.append("language_code", language);

    const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error(`[ElevenLabs STT] API error ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      text: data.text || "",
      language: data.language_code || language || "auto",
      confidence: data.language_probability || null,
    };
  } catch (err) {
    logger.error("[ElevenLabs STT] Failed:", err.message);
    return null;
  }
}

/**
 * Text-to-Speech using ElevenLabs.
 * Returns audio Buffer (mp3) or null.
 */
export async function textToSpeech(text, voiceId = "21m00Tcm4TlvDq8ikWAM", modelId = "eleven_multilingual_v2") {
  if (!ELEVENLABS_API_KEY) {
    logger.error("[ElevenLabs] API key not configured");
    return null;
  }
  if (!text?.trim()) return null;

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error(`[ElevenLabs TTS] API error ${response.status}`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    logger.error("[ElevenLabs TTS] Failed:", err.message);
    return null;
  }
}
