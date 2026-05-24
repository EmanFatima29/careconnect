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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * StatsCard — v0-inspired stat widget.
 *
 * Displays a single KPI with optional trend indicator and icon.
 * Supports two visual variants:
 *   • "default"  – surface card with colored icon circle
 *   • "gradient" – filled gradient card (white text)
 *
 * @param {Object}  props
 * @param {string}  props.title       – Metric label ("Total Prescriptions")
 * @param {string|number} props.value – Metric value ("1,234")
 * @param {React.ElementType} [props.icon] – MUI icon component
 * @param {string}  [props.trend]     – e.g. "+12% from last month"
 * @param {"up"|"down"|"neutral"} [props.trendDirection="up"]
 * @param {"default"|"gradient"} [props.variant="default"]
 * @param {string}  [props.color]     – Theme palette key (default "primary")
 * @param {number}  [props.index=0]   – Grid position for stagger animation
 * @param {string}  [props.subtitle]  – Extra description line
 */
export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = "up",
  variant = "default",
  color = "primary",
  index = 0,
  subtitle,
}) {
  const theme = useTheme();

  // Resolve palette color
  const palette = theme.palette[color] || theme.palette.primary;
  const isGradient = variant === "gradient";

  const trendColor =
    trendDirection === "up"
      ? isGradient
        ? "rgba(255,255,255,0.9)"
        : theme.palette.success.main
      : trendDirection === "down"
        ? isGradient
          ? "rgba(255,200,200,0.9)"
          : theme.palette.error.main
        : "inherit";

  const TrendIcon = trendDirection === "up" ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Card
      sx={{
        ...createDashboardCardSx(index),
        position: "relative",
        overflow: "hidden",
        ...(isGradient && {
          background: `linear-gradient(135deg, ${palette.main} 0%, ${palette.dark} 100%)`,
          color: "#fff",
          "& .MuiTypography-root": { color: "#fff" },
          "&::before": {
            content: '""',
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
          },
        }),
      }}
    >
      <CardContent sx={{ position: "relative", zIndex: 1, p: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Top row: label + icon */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                opacity: isGradient ? 0.9 : 0.7,
                letterSpacing: "0.01em",
              }}
            >
              {title}
            </Typography>

            {Icon && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(isGradient
                    ? { bgcolor: "rgba(255,255,255,0.15)" }
                    : {
                        bgcolor: alpha(palette.main, 0.1),
                      }),
                }}
              >
                <Icon
                  sx={{
                    fontSize: 22,
                    color: isGradient ? "#fff" : palette.main,
                  }}
                />
              </Box>
            )}
          </Stack>

          {/* Value */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {/* Subtitle */}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ opacity: isGradient ? 0.8 : 0.6 }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Trend */}
          {trend && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                width: "fit-content",
                bgcolor: isGradient
                  ? "rgba(255,255,255,0.15)"
                  : alpha(
                      trendDirection === "up"
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                      0.08,
                    ),
              }}
            >
              <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: trendColor }}
              >
                {trend}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
