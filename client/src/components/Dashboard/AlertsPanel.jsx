"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { createDashboardCardSx } from "@/utils/themeUtils";

const SEVERITY_CONFIG = {
  critical: {
    icon: ErrorOutlineIcon,
    color: "#D32F2F",
    bg: "rgba(211,47,47,0.08)",
    label: "Critical",
  },
  warning: {
    icon: WarningAmberIcon,
    color: "#ED6C02",
    bg: "rgba(237,108,2,0.08)",
    label: "Warning",
  },
  info: {
    icon: InfoOutlinedIcon,
    color: "#0288D1",
    bg: "rgba(2,136,209,0.08)",
    label: "Info",
  },
  success: {
    icon: CheckCircleOutlineIcon,
    color: "#2E7D32",
    bg: "rgba(46,125,50,0.08)",
    label: "Resolved",
  },
};

/**
 * AlertsPanel — compact notification / alert list widget.
 *
 * @param {Object}  props
 * @param {Array}   props.alerts – Alert items:
 *   { id, title, message?, severity: "critical"|"warning"|"info"|"success", timestamp?, dismissible? }
 * @param {string}  [props.title="Alerts"]
 * @param {number}  [props.maxItems=5]
 * @param {number}  [props.index=0]
 * @param {Function} [props.onDismiss] – Called with alert id
 * @param {React.ReactNode} [props.headerAction]
 */
export default function AlertsPanel({
  alerts = [],
  title = "Alerts",
  maxItems = 5,
  index = 0,
  onDismiss,
  headerAction,
}) {
  const theme = useTheme();
  const visible = alerts.slice(0, maxItems);

  // Count by severity
  const counts = alerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card sx={{ ...createDashboardCardSx(index), height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {alerts.length > 0 && (
              <Chip
                label={alerts.length}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor: counts.critical
                    ? alpha(SEVERITY_CONFIG.critical.color, 0.12)
                    : alpha(theme.palette.primary.main, 0.1),
                  color: counts.critical
                    ? SEVERITY_CONFIG.critical.color
                    : theme.palette.primary.main,
                }}
              />
            )}
          </Stack>
          {headerAction}
        </Stack>

        {/* Severity summary chips */}
        {Object.keys(counts).length > 1 && (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ mb: 1.5, flexWrap: "wrap" }}
          >
            {Object.entries(counts).map(([sev, count]) => {
              const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.info;
              return (
                <Chip
                  key={sev}
                  label={`${count} ${cfg.label}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    bgcolor: cfg.bg,
                    color: cfg.color,
                  }}
                />
              );
            })}
          </Stack>
        )}

        {visible.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CheckCircleOutlineIcon
              sx={{ fontSize: 36, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              All clear — no active alerts.
            </Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {visible.map((alert, i) => {
              const cfg =
                SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const SevIcon = cfg.icon;

              return (
                <React.Fragment key={alert.id || i}>
                  {i > 0 && <Divider component="li" sx={{ my: 0.5 }} />}
                  <ListItem
                    disableGutters
                    sx={{
                      py: 1,
                      opacity: 0,
                      animation: "slideInUp 0.4s ease-out forwards",
                      animationDelay: `${(index + i) * 80}ms`,
                      alignItems: "flex-start",
                    }}
                    secondaryAction={
                      alert.dismissible !== false && onDismiss ? (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => onDismiss(alert.id)}
                          sx={{ mt: 0.5 }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : null
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: cfg.bg,
                        }}
                      >
                        <SevIcon sx={{ fontSize: 16, color: cfg.color }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.title}
                        </Typography>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                      secondary={
                        <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                          {alert.message && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ lineHeight: 1.4 }}
                            >
                              {alert.message}
                            </Typography>
                          )}
                          {alert.timestamp && (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {new Date(alert.timestamp).toLocaleString()}
                            </Typography>
                          )}
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
