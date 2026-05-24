"use client";
import React from "react";
import { Alert, Chip, Slide, Stack, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import { useNetwork } from "@/utils/hooks/useNetwork";

/**
 * Global offline banner — shows a persistent alert when the user loses internet.
 * Place once in AppShell; it auto-hides when back online.
 */
export default function NetworkBanner() {
  const { isOffline } = useNetwork();

  return (
    <Slide direction="down" in={isOffline} mountOnEnter unmountOnExit>
      <Alert
        severity="warning"
        icon={<WifiOffIcon />}
        sx={{
          borderRadius: 0,
          py: 0.5,
          "& .MuiAlert-message": { width: "100%" },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            You are offline — showing cached data. Some features require internet.
          </Typography>
          <Chip icon={<CloudOffIcon sx={{ fontSize: 14 }} />} label="Offline" size="small" color="warning" variant="outlined" sx={{ height: 24, fontWeight: 600 }} />
        </Stack>
      </Alert>
    </Slide>
  );
}

/**
 * Inline offline notice for sections that need internet.
 * Use inside specific cards/panels that can't function offline.
 */
export function OfflineNotice({ feature = "This feature" }) {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;
  return (
    <Alert severity="info" icon={<CloudOffIcon />} sx={{ borderRadius: 2, mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {feature} requires an internet connection. Showing cached data if available.
      </Typography>
    </Alert>
  );
}
