"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * ProgressRing — SVG circular progress widget (v0 project-progress pattern).
 *
 * Animates from 0 to the target percentage on mount.
 *
 * @param {Object}  props
 * @param {number}  props.percentage  – Target percentage (0-100)
 * @param {string}  [props.label="Progress"]
 * @param {string}  [props.subtitle]   – Text below percentage
 * @param {Array}   [props.legend]     – [{ label, color }] for legend dots
 * @param {number}  [props.index=0]   – Stagger animation index
 * @param {number}  [props.size=160]  – SVG viewBox size
 * @param {number}  [props.strokeWidth=12]
 */
export default function ProgressRing({
  percentage = 0,
  label = "Progress",
  subtitle,
  legend,
  index = 0,
  size = 160,
  strokeWidth = 12,
}) {
  const theme = useTheme();
  const [progress, setProgress] = React.useState(0);
  const target = Math.min(100, Math.max(0, percentage));

  // Animate progress count-up
  React.useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return Math.min(prev + 1, target);
      });
    }, 20);
    return () => clearInterval(timer);
  }, [target]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const defaultLegend = [
    { label: "Completed", color: theme.palette.primary.main },
    { label: "In Progress", color: theme.palette.text.primary },
    {
      label: "Pending",
      color: alpha(theme.palette.text.secondary, 0.3),
    },
  ];

  const legendItems = legend || defaultLegend;

  return (
    <Card
      sx={{
        ...createDashboardCardSx(index),
        height: "100%",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {label}
        </Typography>

        <Stack alignItems="center" spacing={2}>
          {/* Circular Progress */}
          <Box
            sx={{
              position: "relative",
              width: size,
              height: size,
            }}
          >
            {/* Decorative striped background circle */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                opacity: 0.15,
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 6px,
                  ${theme.palette.primary.main} 6px,
                  ${theme.palette.primary.main} 12px
                )`,
              }}
            />

            {/* SVG ring */}
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                transform: "rotate(-90deg)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Background track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={alpha(theme.palette.text.secondary, 0.15)}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Foreground arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={theme.palette.primary.main}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.8s ease-out",
                }}
              />
            </svg>

            {/* Center label */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {progress}%
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontSize: "0.65rem" }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Legend */}
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ gap: 1.5 }}
          >
            {legendItems.map((item) => (
              <Stack
                key={item.label}
                direction="row"
                alignItems="center"
                spacing={0.75}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: item.color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: "nowrap", fontSize: "0.7rem" }}
                >
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
