/**
 * Theme Utilities and Constants
 * Medical theme with earth tones
 */

import { alpha } from "@mui/material/styles";

export const THEME_CONSTANTS = {
  // Color Palette - Medical/Healthcare Theme
  colors: {
    primary: {
      main: "#2e7d32",
      light: "#90ca77",
      dark: "#1b5e20",
      lighter: "#c8e6c9",
      contrastText: "#fff",
    },
    secondary: {
      main: "#8B5A2B",
      light: "#b8956f",
      dark: "#5a3a1f",
      contrastText: "#fff",
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },
    warning: {
      main: "#FFC107",
      light: "#FFD54F",
      dark: "#FFA000",
    },
    info: {
      main: "#1976D2",
      light: "#42A5F5",
      dark: "#1565C0",
    },
    error: {
      main: "#D32F2F",
      light: "#EF5350",
      dark: "#C62828",
    },
    neutral: {
      50: "#F5F5F5",
      100: "#EEEEEE",
      200: "#E0E0E0",
      300: "#BDBDBD",
      400: "#9E9E9E",
      500: "#757575",
      600: "#616161",
      700: "#424242",
      800: "#212121",
      900: "#000000",
    },
  },

  // Accent Colors - Medical Theme
  accents: {
    warm: "#F5DEB3",
    cocoa: "#795548",
    leaf: "#81C784",
    sun: "#FFD54F",
    earth: "#8B5A2B",
    sky: "#87CEEB",
  },

  // Typography
  typography: {
    fontFamily: '"Inter", "Poppins", "Montserrat", sans-serif',
    fontFamilyHeading: '"Poppins", "Montserrat", sans-serif',
  },

  // Shadows
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 2px 4px rgba(0, 0, 0, 0.08)",
    md: "0 4px 12px rgba(0, 0, 0, 0.1)",
    lg: "0 8px 24px rgba(46, 125, 50, 0.12)",
    xl: "0 12px 32px rgba(46, 125, 50, 0.15)",
    xxl: "0 20px 48px rgba(46, 125, 50, 0.2)",
  },

  // Border Radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Transitions
  transitions: {
    fast: "all 0.15s ease",
    normal: "all 0.3s ease",
    slow: "all 0.5s ease",
    easeInOut: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Z-Index
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },
};

// ===== GRADIENT UTILITIES =====

export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary.main} 0%, ${THEME_CONSTANTS.colors.primary.dark} 100%)`,
  secondary: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.secondary.main} 0%, ${THEME_CONSTANTS.colors.secondary.dark} 100%)`,
  success: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.success.main} 0%, ${THEME_CONSTANTS.colors.success.dark} 100%)`,
  warning: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.warning.main} 0%, ${THEME_CONSTANTS.colors.warning.dark} 100%)`,
  info: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.info.main} 0%, ${THEME_CONSTANTS.colors.info.dark} 100%)`,
  earth: `linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)`,
  treatment: `linear-gradient(135deg, #F5DEB3 0%, #CD853F 100%)`,
  sunset: `linear-gradient(135deg, #FFB347 0%, #FF6B6B 100%)`,
};

// ===== UTILITY FUNCTIONS =====

/**
 * Create a hover effect for cards
 */
export const createCardHoverEffect = (theme) => ({
  transition: THEME_CONSTANTS.transitions.normal,
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: THEME_CONSTANTS.shadows.lg,
    borderColor: alpha(THEME_CONSTANTS.colors.primary.main, 0.24),
  },
});

/**
 * Create a focus effect
 */
export const createFocusEffect = () => ({
  outline: "none",
  boxShadow: `0 0 0 3px ${alpha(THEME_CONSTANTS.colors.primary.main, 0.1)}`,
  borderColor: THEME_CONSTANTS.colors.primary.main,
});

/**
 * Create a badge style
 */
export const createBadgeStyle = (
  bgColor = THEME_CONSTANTS.colors.primary.main,
) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  borderRadius: THEME_CONSTANTS.borderRadius.sm,
  backgroundColor: alpha(bgColor, 0.12),
  border: `1.5px solid ${bgColor}`,
  fontSize: "0.75rem",
  fontWeight: 600,
  color: bgColor,
});

/**
 * Create a skeleton loading effect
 */
export const createSkeletonEffect = () => ({
  background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
  backgroundSize: "200% 100%",
  animation: "loading 1.5s infinite",
  "@keyframes loading": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
});

/**
 * Create smooth transitions for all state changes
 */
export const createTransition = (
  property = "all",
  duration = 300,
  timing = "ease",
) => ({
  transition: `${property} ${duration}ms ${timing}`,
});

/**
 * Create responsive font sizes
 */
export const createResponsiveFontSize = (
  mobile,
  tablet = null,
  desktop = null,
) => ({
  fontSize: mobile,
  "@media (min-width: 640px)": {
    fontSize: tablet || mobile,
  },
  "@media (min-width: 1280px)": {
    fontSize: desktop || tablet || mobile,
  },
});

/**
 * Create a flex center utility
 */
export const flexCenter = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * Create a flex row utility
 */
export const flexRowCenter = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

/**
 * Create a flex column utility
 */
export const flexColCenter = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

// ===== ANIMATION KEYFRAMES =====

export const ANIMATIONS = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  rotate: `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
  `,
  barSlideUp: `
    @keyframes barSlideUp {
      from { transform: scaleY(0); opacity: 0; }
      to { transform: scaleY(1); opacity: 1; }
    }
  `,
  pulseRing: `
    @keyframes pulseRing {
      0% { box-shadow: 0 0 0 0 rgba(46,125,50,0.4); }
      70% { box-shadow: 0 0 0 10px rgba(46,125,50,0); }
      100% { box-shadow: 0 0 0 0 rgba(46,125,50,0); }
    }
  `,
  progressFill: `
    @keyframes progressFill {
      from { stroke-dashoffset: var(--progress-circumference, 283); }
      to { stroke-dashoffset: var(--progress-offset, 0); }
    }
  `,
  countUp: `
    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
};

// ===== v0-STYLE ANIMATION SX HELPERS =====
// Use these with MUI's sx prop for entrance animations

/**
 * Create a staggered entrance animation sx object
 * @param {number} index - Child index for stagger delay
 * @param {string} animation - Animation name (default: slideInUp)
 * @param {number} duration - Duration in ms (default: 500)
 */
export const createEntranceAnimation = (
  index = 0,
  animation = "slideInUp",
  duration = 500,
) => ({
  opacity: 0,
  animation: `${animation} ${duration}ms ease-out forwards`,
  animationDelay: `${index * 100}ms`,
});

/**
 * Create a hover scale effect (v0 pattern)
 * @param {number} scale - Scale factor (default: 1.02)
 */
export const createHoverScale = (scale = 1.02) => ({
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: `scale(${scale})`,
  },
});

/**
 * Create a card entrance for dashboard widgets (v0 pattern)
 * @param {number} index - Grid position for stagger
 */
export const createDashboardCardSx = (index = 0) => ({
  opacity: 0,
  animation: `slideInUp 0.5s ease-out forwards`,
  animationDelay: `${index * 100}ms`,
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px) scale(1.01)",
  },
});

/**
 * Create a stats card primary style (filled gradient background)
 */
export const createStatsCardPrimarySx = (theme) => ({
  background: theme.customTokens?.gradients?.statsCard || GRADIENTS.primary,
  color: "#FFFFFF",
  "& *": { color: "#FFFFFF" },
});

/**
 * Create a dark inverted card style (v0 time-tracker / mobile-app pattern)
 */
export const createDarkCardSx = (theme) => ({
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #1a1a1a 0%, #0d1f0d 100%)"
      : "linear-gradient(135deg, #2C3E50 0%, #1B5E20 100%)",
  color: "#FFFFFF",
  "& *": { color: "#FFFFFF" },
});

// ===== CHART UTILITIES (v0 pattern) =====

/**
 * Get Recharts-compatible chart colors from theme
 * @param {object} theme - MUI theme object
 * @returns {string[]} Array of color hex values
 */
export const getChartColors = (theme) =>
  theme.customTokens?.chartColors || [
    "#1B5E20",
    "#2E7D32",
    "#4CAF50",
    "#81C784",
    "#C8E6C9",
  ];

/**
 * Recharts tooltip style matching v0 dark tooltip pattern
 */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(30, 30, 30, 0.95)",
  border: "none",
  borderRadius: 12,
  color: "#FFFFFF",
  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  padding: "12px 16px",
  fontSize: "0.8125rem",
};

/**
 * Common Recharts BarChart gradient definition helper
 * Returns a defs element ID and color stops for a green gradient bar
 */
export const CHART_GRADIENT_ID = "greenBarGradient";
export const CHART_GRADIENT_STOPS = [
  { offset: "0%", stopColor: "#059669", stopOpacity: 1 },
  { offset: "50%", stopColor: "#10B981", stopOpacity: 0.9 },
  { offset: "100%", stopColor: "#34D399", stopOpacity: 0.8 },
];

// ===== RESPONSIVE BREAKPOINTS =====

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

// ===== EXPORT THEME AS DEFAULT =====

const themeUtils = {
  THEME_CONSTANTS,
  GRADIENTS,
  createCardHoverEffect,
  createFocusEffect,
  createBadgeStyle,
  createSkeletonEffect,
  createTransition,
  createResponsiveFontSize,
  flexCenter,
  flexRowCenter,
  flexColCenter,
  ANIMATIONS,
  BREAKPOINTS,
  // v0-style helpers
  createEntranceAnimation,
  createHoverScale,
  createDashboardCardSx,
  createStatsCardPrimarySx,
  createDarkCardSx,
  getChartColors,
  CHART_TOOLTIP_STYLE,
  CHART_GRADIENT_ID,
  CHART_GRADIENT_STOPS,
};

export default themeUtils;
