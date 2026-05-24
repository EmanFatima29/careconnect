"use client";
import { Tooltip, Box } from "@mui/material";

const SENTIMENT_CONFIG = {
  positive: { emoji: "\ud83d\ude0a", color: "#4caf50", label: "Positive" },
  negative: { emoji: "\ud83d\ude14", color: "#f44336", label: "Negative" },
  neutral: { emoji: "\ud83d\ude10", color: "#9e9e9e", label: "Neutral" },
};

/**
 * SentimentIndicator — Shows sentiment emoji on user cards and chat headers.
 * @param {{ score: number, label: string, messageCount?: number }} sentiment
 * @param {boolean} showNeutral - Whether to show neutral indicator (default false)
 */
export default function SentimentIndicator({ sentiment, showNeutral = false }) {
  if (!sentiment?.label) return null;
  if (!showNeutral && sentiment.label === "neutral") return null;

  const config = SENTIMENT_CONFIG[sentiment.label] || SENTIMENT_CONFIG.neutral;
  const confidence = sentiment.score != null
    ? `${Math.abs(Math.round(sentiment.score * 100))}%`
    : "";

  return (
    <Tooltip
      title={`${config.label}${confidence ? ` (${confidence})` : ""}${sentiment.messageCount ? ` \u2022 ${sentiment.messageCount} msgs analyzed` : ""}`}
      arrow
      placement="top"
    >
      <Box
        component="span"
        sx={{
          fontSize: "0.75rem",
          lineHeight: 1,
          cursor: "default",
          userSelect: "none",
          ml: 0.5,
        }}
      >
        {config.emoji}
      </Box>
    </Tooltip>
  );
}
