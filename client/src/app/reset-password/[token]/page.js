"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  MedicalServices as MedicalServicesIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useParams();
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | "validating"
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true/false

  // Validate token on mount
  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/validate-reset-token/${token}`,
        );
        if (!cancelled) {
          setTokenValid(res.data?.valid === true);
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
          setStatus("error");
          setMessage(
            err.response?.data?.error ||
              "Invalid or expired reset link. Please request a new one.",
          );
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(password)) {
      setStatus("error");
      setMessage(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/reset-password/${token}`,
        { password },
      );
      setStatus("success");
      setMessage(
        res.data?.message ||
          "Password has been reset successfully. You can now log in.",
      );
      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.error ||
          "Invalid or expired reset link. Please request a new one.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* Logo */}
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MedicalServicesIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reset Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Enter your new password below.
            </Typography>
          </Stack>

          {/* Status Alert */}
          {status && (
            <Alert severity={status} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {/* Form */}
          {tokenValid === null && status !== "error" && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          {tokenValid === false && !status && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Invalid or expired reset link. Please request a new one.
            </Alert>
          )}
          {tokenValid !== false && status !== "success" && (
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  inputProps={{ minLength: 8 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Must include uppercase, lowercase, number, and special character"
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  inputProps={{ minLength: 8 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  error={
                    confirmPassword.length > 0 && password !== confirmPassword
                  }
                  helperText={
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={
                    isLoading ||
                    !password ||
                    !confirmPassword ||
                    password !== confirmPassword
                  }
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </Stack>
            </form>
          )}

          <Button
            component={Link}
            href="/login"
            startIcon={<ArrowBackIcon />}
            sx={{ textTransform: "none", mt: 2 }}
            fullWidth
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
