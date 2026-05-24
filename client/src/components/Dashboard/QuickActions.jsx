"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * QuickActions — grid of shortcut action cards.
 *
 * @param {Object}  props
 * @param {Array}   props.actions – Array of action objects:
 *   { label, href, icon: MuiIconComponent, color?, description? }
 * @param {number}  [props.index=0] – Base stagger index
 * @param {number}  [props.columns=4] – Grid columns (xs always 2)
 */
export default function QuickActions({ actions = [], index = 0, columns = 4 }) {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {actions.map((action, i) => {
        const Icon = action.icon;
        const color =
          theme.palette[action.color]?.main || theme.palette.primary.main;

        return (
          <Grid item xs={6} sm={4} md={12 / columns} key={action.label}>
            <Card
              sx={{
                ...createDashboardCardSx(index + i),
                height: "100%",
                border: `1px solid ${alpha(color, 0.12)}`,
                "&:hover": {
                  transform: "translateY(-4px) scale(1.01)",
                  borderColor: alpha(color, 0.3),
                  boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
                },
              }}
            >
              <CardActionArea
                component={Link}
                href={action.href}
                sx={{
                  height: "100%",
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(color, 0.1),
                    transition: "background-color 0.3s ease",
                    ".MuiCardActionArea-root:hover &": {
                      bgcolor: alpha(color, 0.18),
                    },
                  }}
                >
                  {Icon && <Icon sx={{ fontSize: 24, color: color }} />}
                </Box>
                <Stack spacing={0.25} sx={{ textAlign: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {action.label}
                  </Typography>
                  {action.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.3 }}
                    >
                      {action.description}
                    </Typography>
                  )}
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
