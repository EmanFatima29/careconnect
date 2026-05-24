"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  useTheme,
} from "@mui/material";
import {
  MedicalServices as MedicalServicesIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

export default function ForgotPassword() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error"
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/forgot-password`,
        { email: email.trim().toLowerCase() },
      );
      setStatus("success");
      setMessage(
        res.data?.message ||
          "If an account with that email exists, a reset link has been sent.",
      );
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.error || "Something went wrong. Please try again.",
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
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Typography>
          </Stack>

          {/* Status Alert */}
          {status && (
            <Alert severity={status} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading || !email.trim()}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                component={Link}
                href="/login"
                startIcon={<ArrowBackIcon />}
                sx={{ textTransform: "none" }}
              >
                Back to Login
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
