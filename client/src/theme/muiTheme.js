// theme/index.js
import { createTheme, alpha } from "@mui/material/styles";

// ═══════════════════════════════════════════════════════
// Sophisticated medical color palette (merged with v0 tokens)
// ═══════════════════════════════════════════════════════

const colors = {
  primary: {
    main: "#004346", // Deep teal
    light: "#74B3CE", // Soft blue-teal
    dark: "#172A3A", // Navy teal
    subtle: "#D6F3F4", // Soft wellness background
  },
  secondary: {
    main: "#74B3CE", // Calm aqua
    light: "#508991", // Sea glass
    dark: "#172A3A", // Deep navy
    subtle: "#D6F3F4", // Light accent
  },
  accent: {
    warm: "#D6F3F4", // Soft airy blue
    cocoa: "#508991", // Muted teal
    leaf: "#74B3CE", // Fresh accent blue
    sun: "#004346", // Deep accent teal
  },
  neutral: {
    white: "#FFFFFF",
    background: "#D6F3F4", // Wellness background
    paper: "#FFFFFF",
    text: "#172A3A", // Deep navy text
    textLight: "#508991", // Soft teal text
    border: "#74B3CE", // Light teal border
  },
  // v0 chart gradient palette using the wellness palette
  chart: {
    1: "#172A3A",
    2: "#004346",
    3: "#508991",
    4: "#74B3CE",
    5: "#D6F3F4",
  },
  // Semantic status colors (v0 pattern)
  status: {
    completed: "#508991", // Muted teal
    inProgress: "#74B3CE", // Calm aqua
    pending: "#172A3A", // Deep navy
    online: "#004346",
    offline: "#6B7280",
  },
  // Sidebar tokens (v0 pattern)
  sidebar: {
    background: "#D6F3F4",
    foreground: "#172A3A",
    primary: "#004346",
    primaryForeground: "#FFFFFF",
    accent: "#74B3CE",
    accentForeground: "#172A3A",
    border: "#74B3CE",
  },
};

// Dark mode color variations
const darkColors = {
  primary: {
    main: "#74B3CE", // Bright aqua
    light: "#508991", // Muted teal
    dark: "#004346", // Deep teal
    subtle: "#172A3A", // Dark navy
  },
  secondary: {
    main: "#508991", // Sea glass
    light: "#74B3CE", // Calm aqua
    dark: "#172A3A", // Deep navy
    subtle: "#004346", // Dark teal
  },
  accent: {
    warm: "#D6F3F4", // Soft airy blue
    cocoa: "#508991", // Muted teal
    leaf: "#74B3CE", // Fresh accent blue
    sun: "#004346", // Deep accent teal
  },
  neutral: {
    white: "#172A3A", // Dark background
    background: "#0F1F24", // Rich dark teal
    paper: "#172A3A", // Dark paper
    text: "#D6F3F4", // Light text
    textLight: "#74B3CE", // Soft text
    border: "#004346", // Dark border
  },
  chart: {
    1: "#172A3A",
    2: "#004346",
    3: "#508991",
    4: "#74B3CE",
    5: "#D6F3F4",
  },
  status: {
    completed: "#74B3CE",
    inProgress: "#508991",
    pending: "#D6F3F4",
    online: "#004346",
    offline: "#9CA3AF",
  },
  sidebar: {
    background: "#004346",
    foreground: "#D6F3F4",
    primary: "#74B3CE",
    primaryForeground: "#172A3A",
    accent: "#508991",
    accentForeground: "#D6F3F4",
    border: "#172A3A",
  },
};

export function createMuiTheme(mode = "light") {
  const isDark = mode === "dark";
  const themeColors = isDark ? darkColors : colors;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: themeColors.primary.main,
        light: themeColors.primary.light,
        dark: themeColors.primary.dark,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: themeColors.secondary.main,
        light: themeColors.secondary.light,
        dark: themeColors.secondary.dark,
        contrastText: "#FFFFFF",
      },
      background: {
        default: themeColors.neutral.background,
        paper: themeColors.neutral.paper,
      },
      text: {
        primary: themeColors.neutral.text,
        secondary: themeColors.neutral.textLight,
      },
      divider: themeColors.neutral.border,
      success: {
        main: themeColors.status.completed,
        light: isDark ? "#6EE7B7" : "#81C784",
        dark: isDark ? "#047857" : "#1B5E20",
      },
      info: {
        main: isDark ? "#64B5F6" : "#1976d2",
      },
      error: {
        main: themeColors.status.pending,
        light: isDark ? "#FB7185" : "#EF5350",
        dark: isDark ? "#BE123C" : "#C62828",
      },
      warning: {
        main: themeColors.status.inProgress,
        light: isDark ? "#FBBF24" : "#FFD54F",
        dark: isDark ? "#B45309" : "#F57F17",
      },
      // Custom palette entries for v0 design system
      chart: themeColors.chart,
      status: themeColors.status,
      sidebar: themeColors.sidebar,
      accent: themeColors.accent,
    },
    typography: {
      fontFamily: [
        "var(--font-geist-sans)",
        "Inter",
        "Poppins",
        "Montserrat",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(","),
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.025em",
        fontSize: "2.25rem",
        lineHeight: 1.2,
        "@media (min-width:600px)": { fontSize: "2.5rem" },
        "@media (min-width:1024px)": { fontSize: "3rem" },
      },
      h2: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontSize: "1.875rem",
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 700,
        letterSpacing: "-0.015em",
        fontSize: "1.5rem",
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontSize: "1.25rem",
      },
      h5: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
        fontSize: "1.125rem",
      },
      h6: {
        fontWeight: 600,
        fontSize: "1rem",
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },
      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.5,
        color: themeColors.neutral.textLight,
      },
      overline: {
        fontSize: "0.625rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.875rem",
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      "none",
      // 1 – xs
      "0 1px 2px rgba(0,0,0,0.05)",
      // 2 – sm
      `0 2px 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)"}`,
      // 3 – md
      `0 4px 12px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)"}`,
      // 4 – default
      `0 6px 16px ${isDark ? "rgba(0,0,0,0.45)" : "rgba(46,125,50,0.08)"}`,
      // 5
      `0 8px 20px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(46,125,50,0.10)"}`,
      // 6 – lg
      `0 8px 24px ${isDark ? "rgba(0,0,0,0.55)" : "rgba(46,125,50,0.12)"}`,
      // 7
      `0 10px 28px ${isDark ? "rgba(0,0,0,0.55)" : "rgba(46,125,50,0.12)"}`,
      // 8 – xl
      `0 12px 32px ${isDark ? "rgba(0,0,0,0.6)" : "rgba(46,125,50,0.15)"}`,
      // 9
      `0 14px 36px ${isDark ? "rgba(0,0,0,0.6)" : "rgba(46,125,50,0.15)"}`,
      // 10 – 2xl
      `0 20px 48px ${isDark ? "rgba(0,0,0,0.7)" : "rgba(46,125,50,0.20)"}`,
      // 11-24: fill remaining MUI shadow slots
      ...Array(14).fill(
        `0 24px 56px ${isDark ? "rgba(0,0,0,0.75)" : "rgba(46,125,50,0.22)"}`,
      ),
    ],
    // ═══════════════════════════════════════════════════════
    // Custom tokens accessible via theme.customTokens
    // ═══════════════════════════════════════════════════════
    customTokens: {
      // Chart color ramp (use in Recharts / chart components)
      chartColors: Object.values(themeColors.chart),
      chartColorsNamed: {
        emerald900: isDark ? "#064E3B" : "#064E3B",
        emerald700: isDark ? "#047857" : "#047857",
        emerald600: "#059669",
        emerald500: "#10B981",
        emerald400: "#34D399",
        emerald300: "#6EE7B7",
        emerald200: "#A7F3D0",
      },
      // Status badge colors
      statusColors: {
        completed: {
          bg: alpha(themeColors.status.completed, 0.12),
          color: themeColors.status.completed,
        },
        inProgress: {
          bg: alpha(themeColors.status.inProgress, 0.12),
          color: themeColors.status.inProgress,
        },
        pending: {
          bg: alpha(themeColors.status.pending, 0.12),
          color: themeColors.status.pending,
        },
      },
      // Sidebar dimensions (v0 pattern)
      sidebarWidth: 264,
      sidebarCollapsedWidth: 72,
      headerHeight: 64,
      // Gradients
      gradients: {
        primary: `linear-gradient(135deg, ${themeColors.primary.main} 0%, ${themeColors.primary.dark} 100%)`,
        primarySoft: `linear-gradient(135deg, ${alpha(themeColors.primary.main, 0.08)} 0%, ${alpha(themeColors.primary.light, 0.04)} 100%)`,
        card: isDark
          ? "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(26,46,26,0.9) 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f9fdf9 100%)",
        statsCard: `linear-gradient(135deg, ${themeColors.primary.main} 0%, ${themeColors.primary.dark} 100%)`,
        dark: isDark
          ? "linear-gradient(135deg, #1a1a1a 0%, #0d1f0d 100%)"
          : "linear-gradient(135deg, #2C3E50 0%, #1B5E20 100%)",
      },
      // Animation durations & easings (v0 pattern)
      animation: {
        fast: "150ms ease",
        normal: "300ms ease",
        slow: "500ms ease",
        spring: "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        easeOut: "300ms cubic-bezier(0, 0, 0.2, 1)",
        easeInOut: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: "background-color 300ms ease, color 300ms ease",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          variant: "contained",
          disableElevation: false,
        },
        styleOverrides: {
          root: {
            borderRadius: 40, // Pill shape buttons
            padding: "10px 24px",
            transition: "all 0.3s ease",
          },
          contained: {
            boxShadow: isDark
              ? "0 8px 16px -4px rgba(0, 0, 0, 0.4)"
              : "0 8px 16px -4px rgba(46, 125, 50, 0.2)",
            "&:hover": {
              boxShadow: isDark
                ? "0 12px 24px -6px rgba(0, 0, 0, 0.6)"
                : "0 12px 24px -6px rgba(46, 125, 50, 0.3)",
              transform: "translateY(-2px)",
            },
          },
          outlined: {
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
            },
          },
          sizeSmall: {
            padding: "6px 16px",
            fontSize: "0.8125rem",
          },
          sizeLarge: {
            padding: "12px 32px",
            fontSize: "1rem",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              backgroundColor: isDark ? "#2C2C2C" : themeColors.neutral.white,
              transition: "all 0.3s ease",
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: themeColors.primary.main,
                },
              },
              "&.Mui-focused": {
                boxShadow: `0 4px 12px ${
                  isDark ? "rgba(76, 175, 80, 0.2)" : "rgba(46, 125, 50, 0.1)"
                }`,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            overflow: "hidden",
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow: isDark
              ? "0 2px 4px rgba(0,0,0,0.3)"
              : "0 2px 4px rgba(0,0,0,0.06)",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: themeColors.neutral.border,
            borderWidth: 1,
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          color: "default",
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${
              isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
            }`,
            backdropFilter: "blur(12px)",
            backgroundColor: isDark
              ? "rgba(18,18,18,0.85)"
              : "rgba(255,255,255,0.85)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${
              isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
            }`,
            backgroundColor: themeColors.sidebar.background,
          },
        },
      },
      MuiCard: {
        defaultProps: {
          variant: "outlined",
        },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${themeColors.neutral.border}`,
            transition:
              "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isDark
                ? "0 12px 24px rgba(0,0,0,0.6)"
                : "0 12px 24px rgba(46,125,50,0.12)",
              borderColor: isDark
                ? "rgba(76,175,80,0.3)"
                : "rgba(46,125,50,0.2)",
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: "20px",
            "&:last-child": {
              paddingBottom: "20px",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: "0.75rem",
          },
          colorPrimary: {
            backgroundColor: themeColors.primary.subtle,
            color: isDark
              ? themeColors.primary.light
              : themeColors.primary.dark,
          },
          colorSecondary: {
            backgroundColor: themeColors.secondary.subtle,
            color: isDark
              ? themeColors.secondary.light
              : themeColors.secondary.dark,
          },
          colorSuccess: {
            backgroundColor: alpha(themeColors.status.completed, 0.12),
            color: themeColors.status.completed,
          },
          colorWarning: {
            backgroundColor: alpha(themeColors.status.inProgress, 0.12),
            color: themeColors.status.inProgress,
          },
          colorError: {
            backgroundColor: alpha(themeColors.status.pending, 0.12),
            color: themeColors.status.pending,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: `2px solid ${alpha(themeColors.primary.main, 0.2)}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: "2px 8px",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateX(4px)",
              backgroundColor: alpha(themeColors.primary.main, 0.08),
            },
            "&.Mui-selected": {
              backgroundColor: themeColors.primary.main,
              color: "#FFFFFF",
              boxShadow: `0 4px 12px ${alpha(themeColors.primary.main, 0.3)}`,
              "&:hover": {
                backgroundColor: themeColors.primary.dark,
                transform: "translateX(4px)",
              },
              "& .MuiListItemIcon-root": {
                color: "#FFFFFF",
              },
              "& .MuiListItemText-primary": {
                color: "#FFFFFF",
                fontWeight: 600,
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            color: themeColors.neutral.textLight,
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          colorError: {
            backgroundColor: themeColors.status.pending,
            animation: "pulse 2s ease-in-out infinite",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: "0.75rem",
            fontWeight: 500,
            backgroundColor: isDark ? "#2C2C2C" : "#1E1E1E",
            color: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 8,
            backgroundColor: alpha(themeColors.primary.main, 0.12),
          },
          bar: {
            borderRadius: 8,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: themeColors.primary.main,
              "& + .MuiSwitch-track": {
                backgroundColor: themeColors.primary.main,
                opacity: 0.6,
              },
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: "12px !important",
            border: `1px solid ${themeColors.neutral.border}`,
            boxShadow: "none",
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: "8px 0",
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            minHeight: 44,
            borderRadius: 8,
            "&.Mui-selected": {
              fontWeight: 600,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            borderRadius: 4,
            height: 3,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          standardSuccess: {
            backgroundColor: alpha(themeColors.status.completed, 0.08),
            color: themeColors.status.completed,
          },
          standardWarning: {
            backgroundColor: alpha(themeColors.status.inProgress, 0.08),
            color: themeColors.status.inProgress,
          },
          standardError: {
            backgroundColor: alpha(themeColors.status.pending, 0.08),
            color: themeColors.status.pending,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: themeColors.neutral.textLight,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 0.15s ease",
            "&:hover": {
              backgroundColor: alpha(themeColors.primary.main, 0.04),
            },
          },
        },
      },
    },
  });
}
