"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Zoom,
} from "@mui/material";
import {
  MedicalServices as MedicalServicesIcon,
  Map as MapIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  Medication as MedicationIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MyLocation as MyLocationIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";

const FEATURES = [
  {
    icon: <MapIcon />,
    title: "Live Map",
    description: "See nearby users in real time on an interactive map with location sharing.",
    color: "#2E7D32",
  },
  {
    icon: <ChatIcon />,
    title: "Real-Time Chat",
    description: "Instant messaging with voice notes, media sharing, and sentiment analysis.",
    color: "#1976d2",
  },
  {
    icon: <GroupIcon />,
    title: "Community Groups",
    description: "Create and join groups to collaborate with patients in your region.",
    color: "#8B5A2B",
  },
  {
    icon: <MedicationIcon />,
    title: "Prescription Management",
    description: "Track your prescriptions from prescribing to treatment with status monitoring.",
    color: "#388E3C",
  },
  {
    icon: <BarChartIcon />,
    title: "Analytics",
    description: "Real-time dashboards with insights on activity, messages, and growth.",
    color: "#7B1FA2",
  },
  {
    icon: <NotificationsIcon />,
    title: "Smart Alerts",
    description: "Push notifications for messages, group updates, and prescription events.",
    color: "#F57C00",
  },
];

const STATS = [
  { label: "Real-Time", value: "Chat", icon: <SpeedIcon /> },
  { label: "Medical", value: "Maps", icon: <MyLocationIcon /> },
  { label: "Secure", value: "Auth", icon: <SecurityIcon /> },
  { label: "Growth", value: "Track", icon: <TrendingUpIcon /> },
];

export default function LandingPage() {
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useAppTheme();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ═══ Background Pattern ═══ */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          opacity: darkMode ? 0.03 : 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L34 18 L42 18 L36 24 L39 32 L30 27 L21 32 L24 24 L18 18 L26 18 Z' fill='%232E7D32' /%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══ Floating Gradient Orbs ═══ */}
      <Box
        sx={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
          animation: "float 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: "-15%",
          left: "-10%",
          width: "40vw",
          height: "40vw",
          maxWidth: 550,
          maxHeight: 550,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 70%)`,
          animation: "float 10s ease-in-out infinite reverse",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══ Top Nav ═══ */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(16px)",
          bgcolor: darkMode ? "rgba(18,18,18,0.8)" : "rgba(255,255,255,0.8)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 40,
                  height: 40,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <MedicalServicesIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CareConnect
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={toggleDarkMode}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                {darkMode ? (
                  <LightModeIcon fontSize="small" />
                ) : (
                  <DarkModeIcon fontSize="small" />
                )}
              </IconButton>

              {!isAuthenticated && !isLoading && (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    component={Link}
                    href="/signup"
                    size="small"
                    sx={{ color: "common.white" }}
                  >
                    Sign Up
                  </Button>
                </>
              )}

              {isAuthenticated && (
                <Button
                  component={Link}
                  href="/home"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  Go to App
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ═══ Hero Section ═══ */}
      <Box
        component="section"
        sx={{
          position: "relative",
          zIndex: 1,
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="md">
          <Fade in={mounted} timeout={800}>
            <Stack alignItems="center" textAlign="center" spacing={4}>
              {/* Badge */}
              <Zoom in={mounted} timeout={600} style={{ transitionDelay: "200ms" }}>
                <Chip
                  label="Built for Medical Communities"
                  icon={<MedicationIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: "primary.main",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    py: 2.5,
                    px: 1,
                    borderRadius: 10,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  }}
                />
              </Zoom>

              {/* Headline */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.25rem", sm: "3rem", md: "3.75rem" },
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  maxWidth: 720,
                  animation: "slideInUp 0.8s ease-out",
                }}
              >
                Connect, Chat &{" "}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Grow Together
                </Box>
              </Typography>

              {/* Sub-headline */}
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  fontWeight: 400,
                  maxWidth: 560,
                  lineHeight: 1.6,
                  fontSize: { xs: "1rem", md: "1.15rem" },
                  animation: "slideInUp 0.8s ease-out 0.1s backwards",
                }}
              >
                A real-time medical platform where patients discover nearby users,
                manage prescriptions, and collaborate with their community — all on one map.
              </Typography>

              {/* CTA Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ animation: "slideInUp 0.8s ease-out 0.2s backwards" }}
              >
                {!isAuthenticated ? (
                  <>
                    <Button
                      component={Link}
                      href="/signup"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "common.white",
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
                        "&:hover": {
                          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.45)}`,
                        },
                      }}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      component={Link}
                      href="/login"
                      variant="outlined"
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        borderColor: "divider",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      Sign In
                    </Button>
                  </>
                ) : (
                  <Button
                    component={Link}
                    href="/home"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ px: 5, py: 1.5, fontSize: "1rem", fontWeight: 700 }}
                  >
                    Open Dashboard
                  </Button>
                )}
              </Stack>
            </Stack>
          </Fade>
        </Container>
      </Box>

      {/* ═══ Stats Strip ═══ */}
      <Box
        component="section"
        sx={{
          position: "relative",
          zIndex: 1,
          py: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction="row"
            justifyContent="center"
            spacing={{ xs: 3, md: 6 }}
            sx={{
              animation: "fadeIn 1s ease-out 0.4s backwards",
            }}
          >
            {STATS.map((stat) => (
              <Stack key={stat.label} alignItems="center" spacing={0.5}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    width: 44,
                    height: 44,
                    border: "none",
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, fontSize: "0.9rem" }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  {stat.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ═══ Features Grid ═══ */}
      <Box
        component="section"
        sx={{
          position: "relative",
          zIndex: 1,
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={6}>
            <Stack alignItems="center" spacing={1.5} textAlign="center">
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  animation: "slideInUp 0.6s ease-out",
                }}
              >
                Everything You Need
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 480 }}
              >
                Powerful tools designed for modern medical communities.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {FEATURES.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                  <Zoom
                    in={mounted}
                    timeout={500}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        border: `1px solid ${theme.palette.divider}`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-6px)",
                          borderColor: alpha(feature.color, 0.3),
                          boxShadow: `0 16px 40px ${alpha(feature.color, darkMode ? 0.15 : 0.12)}`,
                          "& .feature-icon": {
                            transform: "scale(1.1) rotate(-5deg)",
                          },
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Avatar
                            className="feature-icon"
                            sx={{
                              bgcolor: alpha(feature.color, 0.1),
                              color: feature.color,
                              width: 48,
                              height: 48,
                              border: "none",
                              transition: "transform 0.3s ease",
                            }}
                          >
                            {feature.icon}
                          </Avatar>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, fontSize: "1rem" }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {feature.description}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* ═══ CTA Banner ═══ */}
      <Box
        component="section"
        sx={{
          position: "relative",
          zIndex: 1,
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md">
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              border: "none",
              overflow: "visible",
              "&:hover": {
                transform: "none",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Stack
                alignItems="center"
                textAlign="center"
                spacing={3}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    width: 64,
                    height: 64,
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <MedicalServicesIcon sx={{ fontSize: 32, color: "#fff" }} />
                </Avatar>

                <Typography
                  variant="h4"
                  sx={{
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Ready to join the community?
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    maxWidth: 420,
                  }}
                >
                  Start connecting with nearby patients, manage your prescriptions, and
                  grow together today.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                >
                  {!isAuthenticated ? (
                    <>
                      <Button
                        component={Link}
                        href="/signup"
                        size="large"
                        sx={{
                          bgcolor: "#fff",
                          color: "primary.dark",
                          fontWeight: 700,
                          px: 4,
                          "&:hover": {
                            bgcolor: "rgba(255,255,255,0.9)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                          },
                        }}
                      >
                        Create Account
                      </Button>
                      <Button
                        component={Link}
                        href="/login"
                        variant="outlined"
                        size="large"
                        sx={{
                          borderColor: "rgba(255,255,255,0.4)",
                          color: "#fff",
                          fontWeight: 600,
                          px: 4,
                          "&:hover": {
                            borderColor: "#fff",
                            bgcolor: "rgba(255,255,255,0.1)",
                          },
                        }}
                      >
                        Sign In
                      </Button>
                    </>
                  ) : (
                    <Button
                      component={Link}
                      href="/home"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        bgcolor: "#fff",
                        color: "primary.dark",
                        fontWeight: 700,
                        px: 4,
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.9)",
                        },
                      }}
                    >
                      Go to App
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* ═══ Footer ═══ */}
      <Box
        component="footer"
        sx={{
          position: "relative",
          zIndex: 1,
          py: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <MedicalServicesIcon
                sx={{ color: "primary.main", fontSize: 20 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                CareConnect
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Connecting medical communities through technology.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
