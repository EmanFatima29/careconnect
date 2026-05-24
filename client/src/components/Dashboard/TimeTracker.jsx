"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { createDashboardCardSx, createDarkCardSx } from "@/utils/themeUtils";

/**
 * TimeTracker — v0-inspired live timer widget with dark inverted card.
 *
 * @param {Object}  props
 * @param {number}  [props.initialSeconds=0] – Starting seconds
 * @param {string}  [props.title="Time Tracker"]
 * @param {number}  [props.index=0]   – Stagger animation index
 * @param {Function} [props.onStop]   – Called with total seconds when stopped
 */
export default function TimeTracker({
  initialSeconds = 0,
  title = "Time Tracker",
  index = 0,
  onStop,
}) {
  const theme = useTheme();
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(true);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const fmt = (n) => String(n).padStart(2, "0");

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    onStop?.(seconds);
  };

  return (
    <Card
      sx={{
        ...createDashboardCardSx(index),
        ...createDarkCardSx(theme),
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative wave lines */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <svg
            key={i}
            style={{
              position: "absolute",
              top: `${i * 50}px`,
              right: `${-i * 10}px`,
              width: "150px",
              height: "80px",
            }}
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            <path
              d="M0,25 Q12.5,10 25,25 T50,25 T75,25 T100,25"
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="2"
            />
          </svg>
        ))}
      </Box>

      <CardContent
        sx={{
          position: "relative",
          zIndex: 1,
          p: 2.5,
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 2, color: "#fff" }}
        >
          {title}
        </Typography>

        {/* Timer display */}
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: { xs: "2.25rem", sm: "2.75rem" },
            fontWeight: 800,
            letterSpacing: "-0.02em",
            mb: 2,
            color: "#fff",
            wordBreak: "break-all",
          }}
        >
          {fmt(hours)}:{fmt(minutes)}:{fmt(secs)}
        </Typography>

        {/* Controls */}
        <Stack direction="row" spacing={1.5}>
          <Tooltip title={isRunning ? "Pause" : "Resume"}>
            <IconButton
              onClick={() => setIsRunning((r) => !r)}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(255,255,255,0.9)",
                color: theme.palette.grey[900],
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#fff",
                  transform: "scale(1.1)",
                },
              }}
            >
              {isRunning ? (
                <PauseIcon sx={{ fontSize: 20 }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Stop & Reset">
            <IconButton
              onClick={handleStop}
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.error.main,
                color: "#fff",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: theme.palette.error.dark,
                  transform: "scale(1.1)",
                },
              }}
            >
              <StopIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
