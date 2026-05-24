"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  alpha,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { getSession } from "next-auth/react";
import { createDashboardCardSx } from "@/utils/themeUtils";

const URGENCY_COLORS = {
  low:      "success",
  medium:   "warning",
  critical: "error",
};

const URGENCY_ICONS = {
  low:      <CheckCircleIcon />,
  medium:   <WarningIcon />,
  critical: <WarningIcon />,
};

const COMMON_SYMPTOMS = [
  "fever", "cough", "headache", "fatigue", "sore throat",
  "nausea", "dizziness", "chest pain", "shortness of breath", "body aches",
];

export default function SymptomChecker() {
  const [input, setInput]       = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const addSymptom = (s) => {
    const trimmed = s.trim().toLowerCase();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addSymptom(input);
    }
  };

  const removeSymptom = (s) => setSelected((prev) => prev.filter((x) => x !== s));

  const analyze = async () => {
    if (!selected.length) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const session = await getSession();
      const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const { data } = await axios.post(`${base}/api/monitoring/analyze-symptoms`,
        { symptoms: selected }, { headers, withCredentials: true });
      setResult(data.data || data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={createDashboardCardSx()} elevation={0}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <LocalHospitalIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Symptom Checker</Typography>
        </Stack>

        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
          This tool provides preliminary guidance only — always consult a licensed healthcare professional.
        </Alert>

        {/* Common symptom chips */}
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
          {COMMON_SYMPTOMS.map((s) => (
            <Chip key={s} label={s} size="small" variant="outlined"
              color={selected.includes(s) ? "primary" : "default"}
              onClick={() => selected.includes(s) ? removeSymptom(s) : addSymptom(s)}
              sx={{ cursor: "pointer", height: 22, fontSize: "0.65rem" }}
            />
          ))}
        </Stack>

        {/* Custom symptom input */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <TextField
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a symptom and press Enter"
            fullWidth
            sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem" } }}
          />
          <Button variant="outlined" size="small" onClick={() => addSymptom(input)}
            disabled={!input.trim()} sx={{ textTransform: "none", flexShrink: 0 }}>
            Add
          </Button>
        </Stack>

        {/* Selected symptoms */}
        {selected.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
            {selected.map((s) => (
              <Chip key={s} label={s} size="small" color="primary"
                onDelete={() => removeSymptom(s)} sx={{ height: 22, fontSize: "0.65rem" }} />
            ))}
          </Stack>
        )}

        <Button variant="contained" onClick={analyze} disabled={!selected.length || loading}
          startIcon={loading ? <CircularProgress size={14} /> : <LocalHospitalIcon />}
          fullWidth sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}>
          {loading ? "Analyzing…" : "Analyze Symptoms"}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* Results */}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              {URGENCY_ICONS[result.overallUrgency]}
              <Chip label={`${result.overallUrgency?.toUpperCase()} URGENCY`} size="small"
                color={URGENCY_COLORS[result.overallUrgency] || "default"} sx={{ fontWeight: 700 }} />
            </Stack>

            {result.matches?.map((match, i) => (
              <Box key={i} sx={{ mb: 1.5, p: 1.5, borderRadius: 2,
                bgcolor: (t) => alpha(t.palette[URGENCY_COLORS[match.urgency] || "primary"].main, 0.06),
                border: "1px solid", borderColor: (t) => alpha(t.palette[URGENCY_COLORS[match.urgency] || "primary"].main, 0.2) }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{match.condition}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {match.matchedSymptoms.join(", ")}
                </Typography>
                {match.recommendations?.length > 0 && (
                  <List dense disablePadding sx={{ mt: 0.5 }}>
                    {match.recommendations.map((r, j) => (
                      <ListItem key={j} disablePadding sx={{ py: 0 }}>
                        <ListItemText primary={<Typography variant="caption">• {r}</Typography>} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ))}

            {result.matches?.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No matching conditions found. Please consult a doctor.
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block", mt: 1 }}>
              {result.disclaimer}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
