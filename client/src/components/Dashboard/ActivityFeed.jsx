"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * Format a date / ISO string into a human-readable relative time.
 */
function timeAgo(date) {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Resolve an activity type to an avatar colour.
 */
const TYPE_COLORS = {
  message: "#1976D2",
  prescription: "#2E7D32",
  login: "#7B1FA2",
  group: "#E64A19",
  alert: "#D32F2F",
  system: "#616161",
};

/**
 * ActivityFeed — recent activity timeline widget.
 *
 * @param {Object}   props
 * @param {Array}    props.items        – Activity items
 *   Each item: { id, user, action, detail?, type?, timestamp, avatarUrl? }
 * @param {string}   [props.title="Recent Activity"]
 * @param {number}   [props.maxItems=6]
 * @param {number}   [props.index=0]    – Stagger animation index
 * @param {React.ReactNode} [props.headerAction] – Optional action in header
 */
export default function ActivityFeed({
  items = [],
  title = "Recent Activity",
  maxItems = 6,
  index = 0,
  headerAction,
}) {
  const theme = useTheme();
  const visible = items.slice(0, maxItems);

  return (
    <Card sx={{ ...createDashboardCardSx(index), height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {headerAction}
        </Stack>

        {visible.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No recent activity.
          </Typography>
        ) : (
          <List disablePadding>
            {visible.map((item, i) => {
              const color = TYPE_COLORS[item.type] || TYPE_COLORS.system;
              const initials = (item.user || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <React.Fragment key={item.id || i}>
                  {i > 0 && (
                    <Divider variant="inset" component="li" sx={{ my: 0.5 }} />
                  )}
                  <ListItem
                    alignItems="flex-start"
                    disableGutters
                    sx={{
                      py: 1,
                      opacity: 0,
                      animation: "slideInUp 0.4s ease-out forwards",
                      animationDelay: `${(index + i) * 80}ms`,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        src={item.avatarUrl || undefined}
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor: alpha(color, 0.15),
                          color: color,
                        }}
                      >
                        {initials}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, lineHeight: 1.3 }}
                          >
                            {item.user}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.3 }}
                          >
                            {item.action}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mt: 0.25 }}
                        >
                          {item.detail && (
                            <Chip
                              label={item.detail}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                bgcolor: alpha(color, 0.08),
                                color: color,
                              }}
                            />
                          )}
                          <Typography variant="caption" color="text.disabled">
                            {timeAgo(item.timestamp)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
