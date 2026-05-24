/**
 * Reusable Styled Components
 * Follows the medical theme with earth tones and professional design
 * Color palette: Primary green (#2e7d32), secondary brown (#8B5A2B), accents
 */

import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  styled,
  alpha,
  CircularProgress,
  Skeleton,
  Grid,
} from "@mui/material";

// ===== STYLED BUTTONS =====

export const StyledButton = styled(Button)(({
  theme,
  variant: variantType,
}) => {
  const colors = {
    primary: {
      main: "#2e7d32",
      light: "#90ca77",
      dark: "#1b5e20",
      contrastText: "#fff",
    },
    secondary: {
      main: "#8B5A2B",
      light: "#b8956f",
      dark: "#5a3a1f",
      contrastText: "#fff",
    },
  };

  const getPrimaryStyles = () => ({
    background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
    color: colors.primary.contrastText,
    textTransform: "none",
    fontWeight: 600,
    letterSpacing: 0.4,
    padding: "10px 24px",
    borderRadius: 8,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      boxShadow: `0 8px 24px ${alpha(colors.primary.main, 0.4)}`,
      transform: "translateY(-2px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  });

  const getSecondaryStyles = () => ({
    background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
    color: colors.secondary.contrastText,
    textTransform: "none",
    fontWeight: 600,
    padding: "10px 24px",
    borderRadius: 8,
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: `0 8px 24px ${alpha(colors.secondary.main, 0.4)}`,
      transform: "translateY(-2px)",
    },
  });

  const getOutlinedStyles = () => ({
    border: `2px solid ${colors.primary.main}`,
    color: colors.primary.main,
    textTransform: "none",
    fontWeight: 600,
    padding: "8px 24px",
    borderRadius: 8,
    backgroundColor: "transparent",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: alpha(colors.primary.main, 0.08),
      transform: "translateY(-2px)",
    },
  });

  if (variantType === "secondary") {
    return getSecondaryStyles();
  } else if (variantType === "outlined") {
    return getOutlinedStyles();
  } else {
    return getPrimaryStyles();
  }
});

// ===== STYLED CARDS =====

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${alpha("#2e7d32", 0.12)}`,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    boxShadow: `0 12px 32px ${alpha("#2e7d32", 0.15)}`,
    transform: "translateY(-4px)",
    borderColor: alpha("#2e7d32", 0.24),
  },
}));

export const GradientCard = styled(Card)(
  ({ theme, gradientStart, gradientEnd }) => ({
    background: `linear-gradient(135deg, ${gradientStart || "#2e7d32"} 0%, ${gradientEnd || "#1b5e20"} 100%)`,
    borderRadius: 12,
    color: "white",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: `0 12px 32px ${alpha("#2e7d32", 0.4)}`,
      transform: "translateY(-4px)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: -40,
      right: -40,
      width: 120,
      height: 120,
      borderRadius: "50%",
      opacity: 0.1,
      backgroundColor: "white",
    },
  }),
);

// ===== STYLED TEXT FIELDS =====

export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    transition: "all 0.3s ease",
    backgroundColor: alpha("#2e7d32", 0.02),
    "& fieldset": {
      borderColor: alpha("#2e7d32", 0.2),
      borderWidth: 1.5,
    },
    "&:hover fieldset": {
      borderColor: "#2e7d32",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2e7d32",
      borderWidth: 2,
      boxShadow: `0 0 0 4px ${alpha("#2e7d32", 0.1)}`,
    },
  },
  "& .MuiOutlinedInput-input": {
    margin: 0,
    fontWeight: 500,
    "&::placeholder": {
      opacity: 0.7,
    },
  },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0 1000px ${alpha("#2e7d32", 0.02)} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
  },
}));

// ===== SECTION HEADER =====

export const SectionHeader = ({ title, subtitle, action }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "center" }}
    spacing={2}
    sx={{ mb: 3 }}
  >
    <Stack spacing={0.5}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 900,
          background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
    {action && <Box>{action}</Box>}
  </Stack>
);

// ===== KPI CARD =====

export const KPICard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
}) => {
  const colorMap = {
    primary: { start: "rgba(46, 125, 50, 0.9)", end: "rgba(27, 94, 32, 0.95)" },
    success: {
      start: "rgba(76, 175, 80, 0.9)",
      end: "rgba(56, 142, 60, 0.95)",
    },
    info: { start: "rgba(25, 118, 210, 0.9)", end: "rgba(13, 71, 161, 0.95)" },
    warning: {
      start: "rgba(251, 192, 45, 0.9)",
      end: "rgba(245, 127, 23, 0.95)",
    },
  };

  return (
    <GradientCard
      gradientStart={colorMap[color]?.start}
      gradientEnd={colorMap[color]?.end}
      sx={{ p: 2.5 }}
    >
      <CardContent sx={{ p: 0, position: "relative", zIndex: 1 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, mt: 0.5, letterSpacing: "-0.02em" }}
              >
                {value}
              </Typography>
            </Box>
            {Icon && <Icon sx={{ fontSize: 40, opacity: 0.8 }} />}
          </Stack>
          {trend && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                width: "fit-content",
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                📈 {trend}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </GradientCard>
  );
};

// ===== LOADING SKELETON =====

export const CardSkeleton = () => (
  <StyledCard>
    <CardContent>
      <Stack spacing={2}>
        <Skeleton variant="rounded" width="60%" height={24} />
        <Skeleton variant="rounded" width="40%" height={40} />
        <Skeleton variant="rounded" width="80%" height={16} />
      </Stack>
    </CardContent>
  </StyledCard>
);

export const ChartSkeleton = () => (
  <StyledCard sx={{ p: 2 }}>
    <Skeleton variant="rounded" width="40%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rounded" width="100%" height={250} />
  </StyledCard>
);

// Stats Card Skeleton - mimics StatsCard layout
export const StatsCardSkeleton = () => (
  <StyledCard sx={{ height: "100%" }}>
    <CardContent>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
        <Skeleton variant="text" width="40%" height={36} />
        <Skeleton variant="text" width="80%" height={14} />
      </Stack>
    </CardContent>
  </StyledCard>
);

// List Skeleton - for activity feeds, tasks, etc.
export const ListSkeleton = ({ rows = 4 }) => (
  <StyledCard sx={{ p: 2, height: "100%" }}>
    <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
    <Stack spacing={2}>
      {[...Array(rows)].map((_, i) => (
        <Stack key={i} direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={32} height={32} />
          <Stack flex={1} spacing={0.5}>
            <Skeleton
              variant="text"
              width={`${Math.random() * 40 + 50}%`}
              height={18}
            />
            <Skeleton
              variant="text"
              width={`${Math.random() * 30 + 20}%`}
              height={14}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  </StyledCard>
);

// Dashboard Skeleton - complete page loading state
export const DashboardSkeleton = () => (
  <Stack spacing={3} sx={{ py: 1 }}>
    {/* Stats Cards Row */}
    <Grid container spacing={2}>
      {[...Array(4)].map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Chart + HealthMetrics Row */}
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <ChartSkeleton />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <StyledCard sx={{ p: 2, height: "100%" }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
          <Skeleton
            variant="rounded"
            width="100%"
            height={100}
            sx={{ mb: 2 }}
          />
          <Stack spacing={1}>
            <Skeleton variant="text" width="80%" height={18} />
            <Skeleton variant="text" width="60%" height={14} />
          </Stack>
        </StyledCard>
      </Grid>
    </Grid>

    {/* Activity + Tasks Row */}
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ListSkeleton rows={4} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ListSkeleton rows={3} />
      </Grid>
    </Grid>
  </Stack>
);

// Chat Page Skeleton
export const ChatSkeleton = () => (
  <Box
    sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}
  >
    {/* Sidebar */}
    <Box sx={{ width: 320, borderRight: 1, borderColor: "divider", p: 2 }}>
      <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
      <Stack spacing={1}>
        {[...Array(8)].map((_, i) => (
          <Stack
            key={i}
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ p: 1 }}
          >
            <Skeleton variant="circular" width={48} height={48} />
            <Stack flex={1}>
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton variant="text" width="90%" height={14} />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>

    {/* Chat Area */}
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Stack>
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width={60} height={14} />
          </Stack>
        </Stack>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <Stack
              key={i}
              direction="row"
              justifyContent={i % 2 ? "flex-end" : "flex-start"}
            >
              <Skeleton
                variant="rounded"
                width={`${Math.random() * 30 + 20}%`}
                height={60}
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Skeleton variant="rounded" width="100%" height={56} />
      </Box>
    </Box>
  </Box>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
  <Stack spacing={3} sx={{ p: 3 }}>
    {/* Header */}
    <Stack direction="row" spacing={3} alignItems="center">
      <Skeleton variant="circular" width={120} height={120} />
      <Stack spacing={1} flex={1}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="30%" height={20} />
        <Skeleton variant="text" width="50%" height={16} />
      </Stack>
    </Stack>

    {/* Form Wards */}
    <Grid container spacing={3}>
      {[...Array(6)].map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6 }}>
          <Stack spacing={1}>
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Stack>
        </Grid>
      ))}
    </Grid>

    {/* Actions */}
    <Stack direction="row" spacing={2} justifyContent="flex-end">
      <Skeleton variant="rounded" width={100} height={40} />
      <Skeleton variant="rounded" width={120} height={40} />
    </Stack>
  </Stack>
);

// ===== EMPTY STATE =====

export const EmptyState = ({ title, subtitle, action, icon: Icon }) => (
  <StyledCard
    sx={{
      p: 4,
      textAlign: "center",
      minHeight: 240,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      {Icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: `linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(27, 94, 32, 0.08) 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "#2e7d32", fontSize: 32 }} />
        </Box>
      )}
      <Stack spacing={1}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  </StyledCard>
);

// ===== LOADING OVERLAY =====

export const LoadingOverlay = ({ show, message }) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: show ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <Stack
      sx={{
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 2,
        p: 4,
      }}
      spacing={2}
    >
      <CircularProgress sx={{ color: "#2e7d32" }} size={48} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Stack>
  </Box>
);

// ===== PAGE CONTAINER =====

export const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: "calc(100vh - 80px)",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

// ===== BANNER CARD =====

export const BannerCard = ({
  title,
  description,
  action,
  bgColor = "#2e7d32",
}) => (
  <Box
    sx={{
      background: `linear-gradient(135deg, ${bgColor} 0%, ${alpha(bgColor, 0.8)} 100%)`,
      borderRadius: 2,
      p: 3,
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 2,
      flexWrap: { xs: "wrap", sm: "nowrap" },
    }}
  >
    <Stack spacing={1}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {description}
        </Typography>
      )}
    </Stack>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

// ===== STATUS BADGE =====

export const StatusBadge = ({ status, label }) => {
  const statusMap = {
    online: { bg: "#4CAF50", text: "Online" },
    offline: { bg: "#9E9E9E", text: "Offline" },
    busy: { bg: "#FF9800", text: "Busy" },
    away: { bg: "#FFC107", text: "Away" },
  };

  const current = statusMap[status] || statusMap.offline;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 20,
        backgroundColor: alpha(current.bg, 0.12),
        border: `1.5px solid ${current.bg}`,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: current.bg,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: current.bg,
          animation:
            status === "online" || status === "busy"
              ? "pulse 2s infinite"
              : "none",
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
        }}
      />
      {label || current.text}
    </Box>
  );
};

// ===== FEATURE BADGE =====

export const FeatureBadge = ({ label, icon: Icon, variant = "filled" }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.75,
      px: 1.5,
      py: 0.75,
      borderRadius: 2,
      backgroundColor:
        variant === "filled" ? alpha("#2e7d32", 0.12) : "transparent",
      border: variant === "outlined" ? "1.5px solid #2e7d32" : "none",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#2e7d32",
    }}
  >
    {Icon && <Icon sx={{ fontSize: 16 }} />}
    {label}
  </Box>
);

// export default StyledComponents;
