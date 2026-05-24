"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  createDashboardCardSx,
  CHART_TOOLTIP_STYLE,
  CHART_GRADIENT_ID,
  CHART_GRADIENT_STOPS,
  getChartColors,
} from "@/utils/themeUtils";

/**
 * Custom Recharts tooltip matching v0 dark style.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={CHART_TOOLTIP_STYLE}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: "#fff" }}>
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Typography
          key={i}
          variant="caption"
          sx={{ display: "block", color: entry.color || "#81C784", mt: 0.25 }}
        >
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Box>
  );
}

/**
 * PatientHealthChart — Recharts bar chart for prescription health / activity data.
 *
 * @param {Object}  props
 * @param {Array}   props.data – Chart data array, each item: { name, value, [extra keys] }
 * @param {string}  [props.title="Prescription Health"]
 * @param {string}  [props.subtitle]
 * @param {string}  [props.dataKey="value"]    – Primary bar data key
 * @param {string}  [props.xKey="name"]        – X-axis data key
 * @param {number}  [props.height=280]
 * @param {number}  [props.index=0]   – Stagger animation index
 * @param {boolean} [props.loading=false]
 * @param {React.ReactNode} [props.headerAction]
 * @param {Array}   [props.bars] – Optional extra bar definitions
 *   Each: { dataKey, name?, color?, radius? }
 */
export default function PatientHealthChart({
  data = [],
  title = "Prescription Health",
  subtitle,
  dataKey = "value",
  xKey = "name",
  height = 280,
  index = 0,
  loading = false,
  headerAction,
  bars,
}) {
  const theme = useTheme();
  const colors = getChartColors(theme);

  // Default single bar using gradient
  const barDefs = bars || [{ dataKey, name: title }];

  return (
    <Card sx={{ ...createDashboardCardSx(index), height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerAction}
        </Stack>

        {/* Chart area */}
        {loading ? (
          <Skeleton
            variant="rounded"
            width="100%"
            height={height}
            sx={{ borderRadius: 2 }}
          />
        ) : data.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height, opacity: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              No data available
            </Typography>
          </Stack>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient
                  id={CHART_GRADIENT_ID}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  {CHART_GRADIENT_STOPS.map((stop, i) => (
                    <stop key={i} {...stop} />
                  ))}
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha(theme.palette.divider, 0.5)}
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
                tick={{
                  fontSize: 12,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />

              {barDefs.map((bar, bi) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name || bar.dataKey}
                  fill={
                    bi === 0
                      ? `url(#${CHART_GRADIENT_ID})`
                      : colors[bi % colors.length]
                  }
                  radius={bar.radius ?? [6, 6, 0, 0]}
                  animationDuration={800}
                  animationBegin={index * 100}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
