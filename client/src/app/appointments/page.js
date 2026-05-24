"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Avatar,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  alpha,
  IconButton,
  Tooltip,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { fetchMyAppointments, updateAppointmentStatus } from "@/utils/redux/thunks/appointmentThunks";
import { inferRole } from "@/utils/roleUtils";
import { getProfilePicUrl } from "@/utils/profilePic";
import { createDashboardCardSx } from "@/utils/themeUtils";

const STATUS_COLORS = {
  pending:   "warning",
  confirmed: "success",
  cancelled: "error",
  completed: "default",
  "no-show": "error",
};

const TAB_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

function AppointmentCard({ appt, role, onAction }) {
  const other = role === "doctor" ? appt.patientId : appt.doctorId;
  const when  = new Date(appt.date);

  return (
    <Card sx={{ ...createDashboardCardSx(), mb: 1.5 }} elevation={0}>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Avatar src={getProfilePicUrl(other?.profilePic)} sx={{ width: 40, height: 40 }}>
            {other?.name?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{other?.name || "Unknown"}</Typography>
              <Chip label={appt.status} size="small" color={STATUS_COLORS[appt.status] || "default"}
                variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                at {when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                {" · "}{appt.durationMinutes} min
              </Typography>
            </Stack>
            {appt.reason && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
                {appt.reason}
              </Typography>
            )}
          </Box>

          {/* Doctor actions */}
          {role === "doctor" && appt.status === "pending" && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Confirm">
                <IconButton size="small" color="success" onClick={() => onAction(appt._id, "confirmed")}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" color="error" onClick={() => onAction(appt._id, "cancelled")}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
          {role === "doctor" && appt.status === "confirmed" && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Mark Complete">
                <IconButton size="small" color="primary" onClick={() => onAction(appt._id, "completed")}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="No Show">
                <IconButton size="small" color="warning" onClick={() => onAction(appt._id, "no-show")}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {/* Patient can cancel pending */}
          {role === "patient" && appt.status === "pending" && (
            <Button size="small" variant="outlined" color="error" sx={{ textTransform: "none", borderRadius: 2, flexShrink: 0 }}
              onClick={() => onAction(appt._id, "cancelled")}>
              Cancel
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AppointmentsPage() {
  const dispatch = useDispatch();
  const { data: session, status: sessionStatus } = useSession();
  const { appointments, loading, error } = useSelector((s) => s.appointment);
  const currentUser = useSelector((s) => s.user?.currentUser);

  const [tab, setTab] = useState(0);

  const role = inferRole(currentUser?.roles || session?.user?.roles);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      dispatch(fetchMyAppointments());
    }
  }, [sessionStatus, dispatch]);

  const handleAction = (id, status) => {
    dispatch(updateAppointmentStatus({ id, status }));
  };

  const filtered = TAB_FILTERS[tab] === "all"
    ? appointments
    : appointments.filter((a) => a.status === TAB_FILTERS[tab]);

  if (sessionStatus === "loading" || loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <EventAvailableIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Appointments</Typography>
        <Chip label={appointments.length} size="small" color="primary" variant="outlined"
          sx={{ height: 22, fontWeight: 700 }} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        {TAB_FILTERS.map((f) => (
          <Tab key={f} label={f.charAt(0).toUpperCase() + f.slice(1)}
            sx={{ textTransform: "none", fontWeight: 600, minWidth: 80 }} />
        ))}
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {filtered.length === 0 ? (
        <Card sx={{ ...createDashboardCardSx(), textAlign: "center", py: 6 }} elevation={0}>
          <EventAvailableIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No {TAB_FILTERS[tab] === "all" ? "" : TAB_FILTERS[tab] + " "}appointments found.
          </Typography>
          {role === "patient" && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Find a doctor on the map and book an appointment.
            </Typography>
          )}
        </Card>
      ) : (
        filtered.map((appt) => (
          <AppointmentCard key={appt._id} appt={appt} role={role} onAction={handleAction} />
        ))
      )}
    </Box>
  );
}
