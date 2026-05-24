import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { speechToText, textToSpeech } from "../services/elevenLabsService.js";
import { uploadGeneral } from "../middleware/upload.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const speechRateLimiter = rateLimiter(30, 15 * 60 * 1000);

/**
 * POST /api/speech/stt — Speech-to-Text via ElevenLabs Scribe
 */
router.post(
  "/stt",
  requireAuth,
  speechRateLimiter,
  uploadGeneral.single("audio"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    const audioUrl = req.file.path;
    const language = req.body.language || null;

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) return res.status(500).json({ error: "Failed to retrieve audio file" });
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    const result = await speechToText(audioBuffer, req.file.mimetype, language);
    if (!result) return res.status(500).json({ error: "Speech-to-text failed" });

    res.json({ success: true, ...result });
  }),
);

/**
 * POST /api/speech/tts — Text-to-Speech via ElevenLabs
 */
router.post(
  "/tts",
  requireAuth,
  speechRateLimiter,
  asyncHandler(async (req, res) => {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const audioBuffer = await textToSpeech(text, voiceId || undefined);
    if (!audioBuffer) return res.status(500).json({ error: "Text-to-speech failed" });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Content-Disposition": "inline; filename=speech.mp3",
    });
    res.send(audioBuffer);
  }),
);

export default router;
