"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
import AddIcon from "@mui/icons-material/Add";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * ItemList — v0-inspired project-list widget.
 *
 * @param {Object}  props
 * @param {string}  props.title         – Section heading
 * @param {Array}   props.items         – [{ name, subtitle, icon?, color? }]
 * @param {Function} [props.onAdd]      – Click handler for "New" button
 * @param {string}  [props.addLabel="New"]
 * @param {number}  [props.index=0]     – Stagger animation index
 */
export default function ItemList({
  title = "Items",
  items = [],
  onAdd,
  addLabel = "New",
  index = 0,
}) {
  const theme = useTheme();

  // Color palette for items without explicit color
  const defaultColors = [
    theme.palette.info.main,
    "#06b6d4",
    theme.palette.primary.main,
    theme.palette.warning.main,
    "#8b5cf6",
  ];

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
          {onAdd && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={onAdd}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {addLabel}
            </Button>
          )}
        </Stack>

        {/* List */}
        {items.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 4, opacity: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              No items yet
            </Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {items.map((item, i) => {
              const itemColor =
                item.color || defaultColors[i % defaultColors.length];
              return (
                <ListItem
                  key={item.name || i}
                  disablePadding
                  sx={{
                    py: 0.75,
                    px: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.text.primary,
                        theme.palette.mode === "dark" ? 0.06 : 0.04,
                      ),
                    },
                    "& .item-icon": {
                      transition: "transform 0.3s ease",
                    },
                    "&:hover .item-icon": {
                      transform: "scale(1.1) rotate(12deg)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 44,
                    }}
                  >
                    <Box
                      className="item-icon"
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: itemColor,
                        fontSize: "1.1rem",
                        color: "#fff",
                      }}
                    >
                      {item.icon || "📋"}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={item.subtitle}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      fontSize: "0.7rem",
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
