"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { createDashboardCardSx } from "@/utils/themeUtils";

const PRIORITY_CONFIG = {
  high: { color: "#D32F2F", label: "High" },
  medium: { color: "#ED6C02", label: "Medium" },
  low: { color: "#2E7D32", label: "Low" },
};

const STATUS_CONFIG = {
  pending: { color: "#ED6C02", label: "Pending" },
  "in-progress": { color: "#1976D2", label: "In Progress" },
  completed: { color: "#2E7D32", label: "Completed" },
  overdue: { color: "#D32F2F", label: "Overdue" },
};

/**
 * Format a date for display.
 */
function formatDueDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d left`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * UpcomingTasks — task list widget with due dates and status.
 *
 * @param {Object}  props
 * @param {Array}   props.tasks – Task items:
 *   { id, title, dueDate?, priority?: "high"|"medium"|"low",
 *     status?: "pending"|"in-progress"|"completed"|"overdue",
 *     category?, completed?: boolean }
 * @param {string}  [props.title="Upcoming Tasks"]
 * @param {number}  [props.maxItems=6]
 * @param {number}  [props.index=0]
 * @param {Function} [props.onToggle] – Called with (taskId, newCompleted)
 * @param {React.ReactNode} [props.headerAction]
 */
export default function UpcomingTasks({
  tasks = [],
  title = "Upcoming Tasks",
  maxItems = 6,
  index = 0,
  onToggle,
  headerAction,
}) {
  const theme = useTheme();
  const visible = tasks.slice(0, maxItems);

  const pendingCount = tasks.filter((t) => !t.completed).length;

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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.dark,
                }}
              />
            )}
          </Stack>
          {headerAction}
        </Stack>

        {visible.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CalendarTodayIcon
              sx={{ fontSize: 36, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No upcoming tasks.
            </Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {visible.map((task, i) => {
              const isCompleted = task.completed || task.status === "completed";
              const priority = PRIORITY_CONFIG[task.priority];
              const status = STATUS_CONFIG[task.status];
              const dueDateLabel = formatDueDate(task.dueDate);
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                !isCompleted;

              return (
                <React.Fragment key={task.id || i}>
                  {i > 0 && <Divider component="li" sx={{ my: 0.25 }} />}
                  <ListItem
                    disablePadding
                    sx={{
                      opacity: 0,
                      animation: "slideInUp 0.4s ease-out forwards",
                      animationDelay: `${(index + i) * 80}ms`,
                    }}
                  >
                    <ListItemButton
                      dense
                      sx={{ borderRadius: 1, py: 0.75, px: 0.5 }}
                      onClick={() =>
                        onToggle && onToggle(task.id, !isCompleted)
                      }
                      disabled={!onToggle}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={isCompleted}
                          size="small"
                          tabIndex={-1}
                          disableRipple
                          sx={{
                            color:
                              priority?.color || theme.palette.primary.main,
                            "&.Mui-checked": {
                              color: theme.palette.success.main,
                            },
                          }}
                        />
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              textDecoration: isCompleted
                                ? "line-through"
                                : "none",
                              color: isCompleted
                                ? "text.disabled"
                                : "text.primary",
                            }}
                          >
                            {task.title}
                          </Typography>
                        }
                        secondary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            sx={{ mt: 0.25 }}
                          >
                            {/* Due date */}
                            {dueDateLabel && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 500,
                                  color: isOverdue
                                    ? theme.palette.error.main
                                    : "text.secondary",
                                }}
                              >
                                {dueDateLabel}
                              </Typography>
                            )}

                            {/* Priority */}
                            {priority && (
                              <Chip
                                label={priority.label}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  bgcolor: alpha(priority.color, 0.1),
                                  color: priority.color,
                                }}
                              />
                            )}

                            {/* Category */}
                            {task.category && (
                              <Chip
                                label={task.category}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                }}
                              />
                            )}
                          </Stack>
                        }
                      />

                      {/* Status badge */}
                      {status && !isCompleted && (
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: alpha(status.color, 0.1),
                            color: status.color,
                            ml: 1,
                          }}
                        />
                      )}
                    </ListItemButton>
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
