"use client";
import logger from "@/lib/logger";
import * as React from "react";
import { getProfilePicUrl } from "@/utils/profilePic";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
  Zoom,
  Fade,
  Grow,
  IconButton,
  Paper,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "next-auth/react";
import { clearCurrentUser } from "@/utils/redux/userSlice";
import { setUsersData } from "@/utils/redux/userSlice";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import { clearAll as clearNotifications } from "@/utils/redux/notificationSlice";
import api, { updateUser, invalidateSessionCache } from "@/lib/api";
import socket from "@/lib/socket";

// Keyframes animation for background
const styles = {
  "@keyframes float": {
    "0%": { transform: "translateY(0px) rotate(0deg)" },
    "50%": { transform: "translateY(-20px) rotate(5deg)" },
    "100%": { transform: "translateY(0px) rotate(0deg)" },
  },
  "@keyframes pulseGlow": {
    "0%": { opacity: 0.6, transform: "scale(1)" },
    "50%": { opacity: 1, transform: "scale(1.05)" },
    "100%": { opacity: 0.6, transform: "scale(1)" },
  },
  "@keyframes shimmer": {
    "0%": { backgroundPosition: "-1000px 0" },
    "100%": { backgroundPosition: "1000px 0" },
  },
};

export default function LogoutPage() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showExitAnimation, setShowExitAnimation] = React.useState(false);

  // Add CSS keyframes to document head
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
      @keyframes pulseGlow {
        0% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.6; transform: scale(1); }
      }
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      @keyframes slideInFromBottom {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowExitAnimation(true);

    // Delay for exit animation
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      if (socket?.connected && currentUser) {
        socket.emit("manual-disconnect", {
          userId: currentUser._id,
          email: currentUser.email,
        });

        await updateUser(currentUser.email, {
          status: "offline",
          lastSeen: new Date(),
        });
      }

      try {
        await api.post("/api/users/logout");
      } catch (_) {
        // Non-critical — token will expire naturally
      }

      dispatch(clearCurrentUser());
      dispatch(setUsersData([]));
      dispatch(setCurrentChat(null));
      dispatch(clearNotifications());
      invalidateSessionCache();
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      logger.error("Logout error:", err);
      invalidateSessionCache();
      await signOut({ callbackUrl: "/login" });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "U";

  // Get a friendly farewell message based on time of day
  const getFarewellMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Have a productive morning! 🌅";
    if (hour < 18) return "Have a wonderful afternoon! ☀️";
    return "Have a relaxing evening! 🌙";
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        px: { xs: 2, sm: 0 },
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {[...Array(3)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + i * 2}s infinite ease-in-out`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </Box>

      <Grow in={true} timeout={800}>
        <Card
          sx={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            borderRadius: 6,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
            backdropFilter: "blur(10px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}, 0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
            },
          }}
        >
          {/* Animated gradient border */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              backgroundSize: "200% 100%",
              animation: "shimmer 3s infinite linear",
            }}
          />

          <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
            <Stack spacing={3.5} alignItems="center">
              {/* User avatar with pulse animation */}
              <Zoom in={true} timeout={600}>
                <Box sx={{ position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      animation: "pulseGlow 2s infinite ease-in-out",
                      zIndex: 0,
                    }}
                  />
                  <Avatar
                    src={
                      getProfilePicUrl(currentUser?.profilePic, "medium") ||
                      undefined
                    }
                    sx={{
                      width: 88,
                      height: 88,
                      fontSize: 32,
                      bgcolor: "primary.main",
                      position: "relative",
                      zIndex: 1,
                      border: `4px solid ${theme.palette.background.paper}`,
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    {userInitial}
                  </Avatar>
                </Box>
              </Zoom>

              {/* Farewell message */}
              <Fade in={true} timeout={800}>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {currentUser?.name
                      ? `Goodbye, ${currentUser.name}!`
                      : "See You Soon!"}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 320, mx: "auto", mt: 1 }}
                  >
                    {getFarewellMessage()}
                  </Typography>
                </Box>
              </Fade>

              {/* Info card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  width: "100%",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <WarningAmberIcon
                    sx={{ color: theme.palette.info.main, fontSize: 20 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      textAlign: "left",
                    }}
                  >
                    Your account data is securely saved. You can always pick up
                    where you left off!
                  </Typography>
                </Stack>
              </Paper>
              {/* Buttons */}
              <Stack spacing={4.5} sx={{ width: "100%", pt: 2 }}>
                {/* Sign Out Button - Elevated with icon animation */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={
                    isLoggingOut ? (
                      <CircularProgress size={22} sx={{ color: "#fff" }} />
                    ) : (
                      <LogoutIcon sx={{ transition: "transform 0.3s ease" }} />
                    )
                  }
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  sx={{
                    py: "10px",
                    px: 3,
                    fontWeight: 700,
                    borderRadius: 4,
                    fontSize: "1.05rem",
                    textTransform: "none",
                    background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                    boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.35)}`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: `linear-gradient(90deg, transparent, ${alpha("#fff", 0.2)}, transparent)`,
                      transition: "left 0.5s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-3px) scale(1.01)",
                      boxShadow: `0 12px 28px ${alpha(theme.palette.error.main, 0.5)}`,
                      "&::before": {
                        left: "100%",
                      },
                      "& .MuiButton-startIcon": {
                        transform: "translateX(-4px)",
                      },
                    },
                    "&:active": {
                      transform: "translateY(0) scale(0.99)",
                    },
                  }}
                >
                  {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </Button>

                {/* Stay Button - Ghost style with hover effect */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={
                    <ArrowBackIcon sx={{ transition: "transform 0.3s ease" }} />
                  }
                  onClick={handleCancel}
                  disabled={isLoggingOut}
                  sx={{
                    py: "10px",
                    px: 3,
                    fontWeight: 600,
                    borderRadius: 4,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderWidth: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    color: theme.palette.primary.main,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderWidth: 2,
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      "& .MuiButton-startIcon": {
                        transform: "translateX(-6px)",
                      },
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                  }}
                >
                  Stay a While Longer
                </Button>

                {/* Optional: Add a subtle keyboard shortcut hint */}
                <Typography
                  variant="caption"
                  align="center"
                  sx={{
                    mt: 1,
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    opacity: 0.7,
                  }}
                >
                  Press ESC to stay • Enter to sign out
                </Typography>
              </Stack>
              {/* Decorative elements */}
              {/* <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <IconButton size="small" disabled sx={{ opacity: 0.5 }}>
                  <EmojiEmotionsIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  We'll miss you! ❤️
                </Typography>
                <IconButton size="small" disabled sx={{ opacity: 0.5 }}>
                  <SentimentVeryDissatisfiedIcon fontSize="small" />
                </IconButton>
              </Stack> */}
            </Stack>
          </CardContent>
        </Card>
      </Grow>

      {/* Exit animation overlay */}
      {showExitAnimation && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.7),
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeOut 0.3s ease-out forwards",
          }}
        >
          <CircularProgress size={60} sx={{ color: "white" }} />
        </Box>
      )}
    </Box>
  );
}
