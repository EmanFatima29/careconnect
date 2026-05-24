"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { createMuiTheme } from "@/theme/muiTheme";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";

export default function MuiThemeRegistry({ children }) {
  const { darkMode } = useAppTheme();

  const muiTheme = React.useMemo(
    () => createMuiTheme(darkMode ? "dark" : "light"),
    [darkMode]
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
