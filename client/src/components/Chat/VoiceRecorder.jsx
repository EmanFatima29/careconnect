"use client";
import { useState, useRef, useCallback } from "react";
import { Box, IconButton, Tooltip, Typography, CircularProgress } from "@mui/material";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import StopIcon from "@mui/icons-material/Stop";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import api from "@/lib/api";

/**
 * VoiceRecorder — Record audio and transcribe via ElevenLabs Scribe (STT).
 * @param {function} onTranscribe - Called with transcribed text
 * @param {function} onError - Called with error message
 * @param {boolean} disabled
 */
export function VoiceRecorder({ onTranscribe, onError, disabled = false }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        if (blob.size < 1000) {
          onError?.("Recording too short");
          return;
        }

        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const response = await api.post("/api/speech/stt", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          });

          if (response.data?.text) {
            onTranscribe?.(response.data.text);
          } else {
            onError?.("Could not transcribe audio");
          }
        } catch (err) {
          onError?.(err.response?.data?.error || "Transcription failed");
        } finally {
          setTranscribing(false);
          setDuration(0);
        }
      };

      mediaRecorder.start(250);
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      onError?.("Microphone access denied");
    }
  }, [onTranscribe, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (transcribing) {
    return (
      <Tooltip title="Transcribing...">
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CircularProgress size={20} />
          <Typography variant="caption" color="text.secondary">
            Transcribing...
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  if (recording) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "error.main",
            animation: "pulse 1s infinite",
          }}
        />
        <Typography variant="caption" color="error" sx={{ minWidth: 32 }}>
          {formatDuration(duration)}
        </Typography>
        <Tooltip title="Stop recording">
          <IconButton size="small" onClick={stopRecording} color="error">
            <StopIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Tooltip title="Record voice message (Speech-to-Text)">
      <span>
        <IconButton size="small" onClick={startRecording} disabled={disabled}>
          <MicNoneOutlinedIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * MessageTTS — "Listen" button for text-to-speech on received messages.
 * Uses ElevenLabs TTS with browser SpeechSynthesis fallback.
 * @param {string} text - Message text to read aloud
 */
export function MessageTTS({ text }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/api/speech/tts",
        { text },
        { responseType: "blob", timeout: 30000 },
      );

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setPlaying(true);
    } catch {
      // Fallback: use browser's built-in SpeechSynthesis
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlaying(false);
        speechSynthesis.speak(utterance);
        setPlaying(true);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  if (!text) return null;

  return (
    <Tooltip title={playing ? "Stop" : "Listen"}>
      <IconButton size="small" onClick={handlePlay} disabled={loading} sx={{ opacity: 0.6 }}>
        {loading ? (
          <CircularProgress size={14} />
        ) : (
          <VolumeUpIcon sx={{ fontSize: 14, color: playing ? "primary.main" : "text.secondary" }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
