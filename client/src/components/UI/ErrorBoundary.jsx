"use client";
import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

/**
 * ErrorBoundary — Catches React rendering errors and shows a fallback UI.
 * Use around dynamic components like Map, EmojiPicker, etc.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    try {
      const logger = require("@/lib/logger").default;
      logger.error("[ErrorBoundary]", error, info?.componentStack);
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            minHeight: 200,
            bgcolor: "background.default",
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {this.props.componentName || "Component"} failed to load
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {this.state.error?.message || "An unexpected error occurred"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}
