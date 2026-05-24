"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { bookAppointment } from "@/utils/redux/thunks/appointmentThunks";
import { getProfilePicUrl } from "@/utils/profilePic";

const DURATIONS = [15, 30, 45, 60];

export default function BookAppointmentDialog({ open, onClose, doctor }) {
  const dispatch = useDispatch();
  const { submitting, error } = useSelector((s) => s.appointment);

  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [reason, setReason]     = useState("");

  const minDate = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!date || !time) return;
    const dateTime = new Date(`${date}T${time}`);
    const result = await dispatch(bookAppointment({
      doctorId: doctor._id,
      date: dateTime.toISOString(),
      durationMinutes: duration,
      reason,
    }));
    if (!result.error) {
      onClose(true);
      setDate(""); setTime("09:00"); setDuration(30); setReason("");
    }
  };

  const handleClose = () => {
    onClose(false);
    setDate(""); setTime("09:00"); setDuration(30); setReason("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EventAvailableIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Book Appointment</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* Doctor info */}
          {doctor && (
            <Stack direction="row" spacing={1.5} alignItems="center"
              sx={{ p: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
              <Avatar src={getProfilePicUrl(doctor.profilePic)} sx={{ width: 40, height: 40 }}>
                {doctor.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{doctor.name}</Typography>
                {doctor.doctorProfile?.specialty && (
                  <Typography variant="caption" color="text.secondary">
                    {doctor.doctorProfile.specialty}
                  </Typography>
                )}
              </Box>
              <Chip icon={<LocalHospitalIcon />} label="Doctor" size="small" color="success" variant="outlined"
                sx={{ ml: "auto", height: 22, fontSize: "0.65rem" }} />
            </Stack>
          )}

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputProps={{ min: minDate }}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />

          <TextField
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />

          {/* Duration chips */}
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Duration</Typography>
            <Stack direction="row" spacing={1}>
              {DURATIONS.map((d) => (
                <Chip key={d} label={`${d} min`} size="small"
                  variant={duration === d ? "filled" : "outlined"}
                  color={duration === d ? "primary" : "default"}
                  onClick={() => setDuration(d)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Stack>
          </Stack>

          <TextField
            label="Reason for visit"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${reason.length}/500`}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!date || !time || submitting}
          startIcon={submitting ? <CircularProgress size={14} /> : <EventAvailableIcon />}
          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
        >
          {submitting ? "Booking…" : "Book Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
