"use client";
import { useState, useEffect } from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Stack,
  Typography,
} from "@mui/material";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import api from "@/lib/api";
import logger from "@/lib/logger";

const MOOD_CONFIG = {
  positive: { emoji: "\ud83d\ude0a", color: "success", label: "Positive" },
  negative: { emoji: "\ud83d\ude14", color: "error", label: "Negative" },
  neutral: { emoji: "\ud83d\ude10", color: "default", label: "Neutral" },
};

/**
 * SentimentWidget — Admin dashboard widget showing sentiment trends across users.
 * Fetches sentiment for all users and displays a ranked list.
 * @param {Array} users - Array of user objects to analyze
 */
export default function SentimentWidget({ users = [] }) {
  const [sentiments, setSentiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!users.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchAll = async () => {
      const results = [];
      // Fetch sentiment for up to 20 users (admin sees all)
      const subset = users.slice(0, 20);
      await Promise.allSettled(
        subset.map(async (user) => {
          try {
            const res = await api.get(`/api/messages/sentiment/${user._id}`);
            if (!cancelled && res.data && !res.data.restricted) {
              results.push({
                userId: user._id,
                name: user.name || "User",
                profilePic:
                  typeof user.profilePic === "object"
                    ? user.profilePic?.thumbnail
                    : user.profilePic,
                ...res.data,
              });
            }
          } catch {
            // skip failed
          }
        }),
      );

      if (!cancelled) {
        // Sort: most positive first, then negative, then neutral
        results.sort((a, b) => b.score - a.score);
        setSentiments(results);
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [users]);

  const overall = sentiments.length > 0
    ? sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    : 0;
  const overallLabel = overall > 0.1 ? "positive" : overall < -0.1 ? "negative" : "neutral";

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <SentimentSatisfiedIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            User Sentiment Overview
          </Typography>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : sentiments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No sentiment data available yet.
          </Typography>
        ) : (
          <>
            {/* Overall mood */}
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography variant="h4">
                {MOOD_CONFIG[overallLabel]?.emoji}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall community mood: {MOOD_CONFIG[overallLabel]?.label}
              </Typography>
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* User list */}
            <List dense disablePadding>
              {sentiments.slice(0, 10).map((s) => {
                const config = MOOD_CONFIG[s.label] || MOOD_CONFIG.neutral;
                return (
                  <ListItem key={s.userId} disablePadding sx={{ py: 0.5 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar src={getProfilePicUrl(s.profilePic, "thumbnail")} sx={{ width: 28, height: 28 }}>
                        {(s.name || "U").charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {s.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {s.messageCount} msgs analyzed
                        </Typography>
                      }
                    />
                    <Chip
                      size="small"
                      label={`${config.emoji} ${config.label}`}
                      color={config.color}
                      variant="outlined"
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
}
