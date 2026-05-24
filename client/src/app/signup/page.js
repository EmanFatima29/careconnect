"use client";
import logger from "@/lib/logger";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { isTokenExpired } from "@/utils/auth";
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  ThemeProvider as MuiThemeProvider,
  Typography,
  Avatar,
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Zoom,
  Fade,
  useTheme,
} from "@mui/material";
import {
  MedicalServices as MedicalServicesIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { createMuiTheme } from "@/theme/muiTheme";
export default function Signup() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { darkMode } = useAppTheme();
  const muiTheme = useTheme();
  const theme = createMuiTheme(darkMode ? "dark" : "light");

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (session?.user) {
        // Check if token is expired
        if (isTokenExpired(session.accessToken)) {
          await signOut({ redirect: false });
          router.refresh(); // Clear any cached session data
        } else {
          router.push("/home");
        }
      }
    };
    checkAuth();
  }, [session, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [submitError, setSubmitError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  // FOR SOCIAL LOGIN
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState({
    //SET CREADENTIALS INITIALLY FALSE
    credentials: false,
    google: false,
    facebook: false,
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onSubmit = async (data) => {
    try {
      setSubmitError(null);
      setIsLoading((prev) => ({ ...prev, credentials: true }));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`,
        data,
      );

      if (response.status === 201) {
        setSignupSuccess(true);
        // Redirect to login after 4 seconds
        setTimeout(() => router.push("/login"), 4000);
      } else {
        setSubmitError("Failed to create account. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        //IF USER ALREADY EXISTS
        setSubmitError("User already exists. Please log in.");
      } else {
        logger.error("Signup error:", error);
        setSubmitError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, credentials: false }));
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setAuthError(null);
      setIsLoading((prev) => ({ ...prev, [provider]: true }));

      const res = await signIn(provider, {
        callbackUrl: "/home",
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      // User creation is already handled by NextAuth's ensureBackendUserAndFetch
      setIsRedirecting(true);
      router.push("/home");
    } catch (error) {
      logger.error(`${provider} login error:`, error);
      setAuthError(`Failed to login with ${provider}. Please try again.`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <MuiThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: (theme) =>
            darkMode
              ? `linear-gradient(145deg, ${theme.palette.primary.dark}20 0%, ${theme.palette.secondary.dark}20 100%)`
              : `linear-gradient(145deg, ${theme.palette.primary.subtle} 0%, ${theme.palette.secondary.subtle} 100%)`,
          position: "relative",
          overflow: "hidden",
          py: { xs: 4, md: 6 },
        }}
      >
        {/* Decorative wheat pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: darkMode ? 0.05 : 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 20 L45 30 L55 30 L48 38 L52 48 L40 42 L28 48 L32 38 L25 30 L35 30 Z' fill='%232E7D32' /%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "80px 80px",
          }}
        />

        <Container
          maxWidth="sm"
          sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}
        >
          <Zoom in={true} timeout={800} style={{ transitionDelay: "100ms" }}>
            <Paper
              elevation={darkMode ? 4 : 0}
              sx={{
                p: { xs: 3, sm: 5, md: 6 },
                background: (theme) => theme.palette.background.paper,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                boxShadow: darkMode
                  ? "0 20px 40px rgba(0,0,0,0.4)"
                  : "0 20px 40px rgba(46,125,50,0.1)",
              }}
            >
              <Stack spacing={4}>
                {/* Header Section */}
                <Fade in={true} timeout={1000}>
                  <Stack alignItems="center" spacing={3}>
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        width: 88,
                        height: 88,
                        boxShadow: (theme) =>
                          `0 12px 24px -8px ${theme.palette.primary.main}40`,
                      }}
                    >
                      <MedicalServicesIcon sx={{ fontSize: 48 }} />
                    </Avatar>

                    <Stack spacing={2} sx={{ textAlign: "center", gap: 2 }}>
                      <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                          color: "primary.dark",
                          fontWeight: 800,
                        }}
                      >
                        Join CareConnect!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "text.secondary",
                          maxWidth: 320,
                          mx: "auto",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                        }}
                      >
                        Create your account to start your medical journey
                      </Typography>
                    </Stack>
                  </Stack>
                </Fade>

                {/* Success Alert (verification email sent) */}
                {signupSuccess && (
                  <Fade in={true} timeout={500}>
                    <Alert severity="success" sx={{ borderRadius: 3 }}>
                      <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
                        Account Created!
                      </AlertTitle>
                      A verification link has been sent to your email. Please
                      verify your email before logging in. Redirecting to
                      login...
                    </Alert>
                  </Fade>
                )}

                {/* Error Alert */}
                <Fade in={!!(authError || submitError)} timeout={500}>
                  <div>
                    {(authError || submitError) && (
                      <Alert
                        severity="error"
                        sx={{
                          borderRadius: 3,
                        }}
                      >
                        <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
                          {authError
                            ? "Authentication Failed"
                            : "Signup Failed"}
                        </AlertTitle>
                        {authError || submitError}
                      </Alert>
                    )}
                  </div>
                </Fade>

                {/* Signup Form */}
                <Stack
                  component="form"
                  onSubmit={handleSubmit(onSubmit)}
                  spacing={3.5}
                >
                  <Stack spacing={4.5}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      type="text"
                      variant="outlined"
                      autoComplete="name"
                      placeholder="John Patient"
                      {...register("name", {
                        required: "Name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                      })}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-input": {
                          height: "40px",
                          fontSize: "0.9rem",
                          padding: "10px 12px",
                        },
                        "& .MuiFormLabel-root": {
                          top: -10,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Phone Number"
                      type="tel"
                      variant="outlined"
                      autoComplete="tel"
                      placeholder="+92 300 1234567"
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^(\+92[0-9]{10}|03[0-9]{9})$/,
                          message:
                            "Enter a valid phone number (e.g., +923001234567 or 03001234567)",
                        },
                      })}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-input": {
                          height: "40px",
                          fontSize: "0.9rem",
                          padding: "10px 12px",
                        },
                        "& .MuiFormLabel-root": {
                          top: -10,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      variant="outlined"
                      autoComplete="email"
                      placeholder="patient@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-input": {
                          height: "40px",
                          fontSize: "0.9rem",
                          padding: "10px 12px",
                        },
                        "& .MuiFormLabel-root": {
                          top: -10,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      variant="outlined"
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                        pattern: {
                          value:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
                          message:
                            "Must include uppercase, lowercase, number, and special character",
                        },
                      })}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-input": {
                          height: "40px",
                          fontSize: "0.9rem",
                          padding: "10px 12px",
                        },
                        "& .MuiFormLabel-root": {
                          top: -10,
                        },
                      }}
                    />
                  </Stack>

                  {/* Submit Button */}
                  <Box
                    sx={{ justifyContent: "center", display: "flex", mt: 2 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      size="large"
                      variant="contained"
                      disabled={
                        isLoading.credentials || isRedirecting || isSubmitting
                      }
                      sx={{
                        py: 1.8,
                        fontSize: "1.1rem",
                        width: "50%",
                        fontWeight: 700,
                        height: "40px",
                        boxShadow: (theme) =>
                          darkMode
                            ? `0 8px 16px 4px ${theme.palette.primary.dark}80`
                            : `0 8px 16px 4px ${theme.palette.primary.main}40`,
                      }}
                    >
                      {isLoading.credentials ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress
                            size={24}
                            sx={{ color: "common.white" }}
                          />
                          <span>Creating Account...</span>
                        </Stack>
                      ) : isRedirecting ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress
                            size={24}
                            sx={{ color: "common.white" }}
                          />
                          <span>Redirecting...</span>
                        </Stack>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </Box>
                </Stack>

                {/* Divider */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ my: 1 }}
                >
                  <Divider sx={{ flex: 1 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontSize: "0.8rem",
                    }}
                  >
                    OR
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Stack>

                {/* Social Login Buttons */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Button
                    onClick={() => handleSocialLogin("google")}
                    disabled={isLoading.google || isRedirecting}
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<GoogleIcon />}
                    sx={{
                      py: 1.5,
                      height: "40px",
                      width: "40%",
                      backgroundColor: "background.paper",
                      boxShadow: (theme) =>
                        darkMode
                          ? `0 8px 16px 4px ${theme.palette.primary.dark}40`
                          : `0 8px 16px 4px ${theme.palette.primary.main}40`,
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "primary.subtle",
                      },
                    }}
                  >
                    {isLoading.google ? (
                      <CircularProgress size={24} color="primary" />
                    ) : (
                      "Google"
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={isLoading.facebook || isRedirecting}
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<FacebookIcon />}
                    sx={{
                      py: 1.5,
                      height: "40px",
                      width: "40%",
                      backgroundColor: "background.paper",
                      boxShadow: (theme) =>
                        darkMode
                          ? `0 8px 16px 4px ${theme.palette.primary.dark}40`
                          : `0 8px 16px 4px ${theme.palette.primary.main}40`,
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "primary.subtle",
                      },
                    }}
                  >
                    {isLoading.facebook ? (
                      <CircularProgress size={24} color="primary" />
                    ) : (
                      "Facebook"
                    )}
                  </Button>
                </Stack>

                {/* Login Link */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?
                  </Typography>
                  <Button
                    component={Link}
                    href="/login"
                    variant="text"
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      fontSize: "1rem",
                      p: 1,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: "primary.dark",
                      },
                    }}
                  >
                    Sign in
                  </Button>
                </Stack>

                {/* Footer */}
                <Typography
                  variant="caption"
                  align="center"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    maxWidth: "100%",
                    padding: "0 12%",
                    mx: "auto",
                  }}
                >
                  By signing up, you agree to our Terms of Service and Privacy
                  Policy
                </Typography>
              </Stack>
            </Paper>
          </Zoom>
        </Container>
      </Box>
    </MuiThemeProvider>
  );
}
