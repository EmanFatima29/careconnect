"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import VideocamIcon from "@mui/icons-material/Videocam";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * ReminderCard — v0-inspired reminder / event widget.
 *
 * @param {Object}  props
 * @param {string}  props.title       – Event name
 * @param {string}  props.time        – Time range string (e.g. "02:00 PM – 04:00 PM")
 * @param {string}  [props.actionLabel="View Details"]
 * @param {React.ElementType} [props.actionIcon] – Icon for the action button
 * @param {Function} [props.onAction] – Click handler for the action button
 * @param {number}  [props.index=0]   – Stagger animation index
 */
export default function ReminderCard({
  title,
  time,
  actionLabel = "View Details",
  actionIcon: ActionIcon = VideocamIcon,
  onAction,
  index = 0,
}) {
  const theme = useTheme();

  return (
    <Card sx={{ ...createDashboardCardSx(index), height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <EventIcon sx={{ fontSize: 20, color: "text.secondary", mt: 0.25 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Reminders
          </Typography>
        </Stack>

        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            p: 2,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: theme.shadows[4],
              transform: "scale(1.02)",
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Time : {time}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ActionIcon sx={{ fontSize: 18 }} />}
            onClick={onAction}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              py: 1,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            {actionLabel}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
