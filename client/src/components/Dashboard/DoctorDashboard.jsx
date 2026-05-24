"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Avatar,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  alpha,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StarIcon from "@mui/icons-material/Star";
import VerifiedIcon from "@mui/icons-material/Verified";
import axios from "axios";
import { getSession } from "next-auth/react";
import { getProfilePicUrl } from "@/utils/profilePic";
import { createDashboardCardSx } from "@/utils/themeUtils";

const STATUS_COLORS = {
  Prescribed: "info",
  Active: "success",
  Completed: "default",
  Archived: "warning",
};

function StatCard({ icon: Icon, label, value, color = "primary" }) {
  return (
    <Card sx={createDashboardCardSx()} elevation={0}>
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: (t) => alpha(t.palette[color].main, 0.12) }}>
            <Icon sx={{ fontSize: 24, color: `${color}.main` }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{value ?? "—"}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DoctorDashboard({ currentUser }) {
  const [stats, setStats]             = useState(null);
  const [patients, setPatients]       = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const session = await getSession();
        const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;

        const [statsRes, patientsRes, prescRes] = await Promise.all([
          axios.get(`${base}/api/doctor/stats`,         { headers, withCredentials: true }),
          axios.get(`${base}/api/doctor/patients`,       { headers, withCredentials: true }),
          axios.get(`${base}/api/doctor/prescriptions`,  { headers, withCredentials: true }),
        ]);

        setStats(statsRes.data);
        setPatients(patientsRes.data.patients || []);
        setPrescriptions(prescRes.data.prescriptions || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

  return (
    <Stack spacing={3}>
      {/* Verified banner */}
      {stats && !stats.verified && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Your account is pending verification. You will appear on the map once an admin approves your profile.
        </Alert>
      )}
      {stats?.verified && (
        <Alert severity="success" icon={<VerifiedIcon />} sx={{ borderRadius: 2 }}>
          Account verified — you are visible on the CareConnect map.
        </Alert>
      )}

      {/* Stats row */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={PeopleIcon}        label="Total Patients"          value={stats?.totalPatients}          color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={LocalHospitalIcon} label="Prescriptions This Week"  value={stats?.prescriptionsThisWeek}  color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={StarIcon}          label="Average Rating"           value={stats?.averageRating?.toFixed(1) || "N/A"} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={StarIcon}          label="Total Ratings"            value={stats?.totalRatings}           color="info" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* My Patients */}
        <Grid item xs={12} md={5}>
          <Card sx={createDashboardCardSx()} elevation={0}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>My Patients</Typography>
              {patients.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No patients yet.</Typography>
              ) : (
                <List disablePadding>
                  {patients.slice(0, 8).map((p) => (
                    <ListItem key={p._id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemAvatar>
                        <Avatar src={getProfilePicUrl(p.profilePic)} sx={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {p.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{p.email}</Typography>}
                      />
                      <Chip label={p.status === "online" ? "Online" : "Offline"} size="small"
                        color={p.status === "online" ? "success" : "default"} variant="outlined"
                        sx={{ height: 18, fontSize: "0.6rem" }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Prescriptions */}
        <Grid item xs={12} md={7}>
          <Card sx={createDashboardCardSx()} elevation={0}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Recent Prescriptions</Typography>
              {prescriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No prescriptions issued yet.</Typography>
              ) : (
                <List disablePadding>
                  {prescriptions.slice(0, 8).map((rx) => (
                    <React.Fragment key={rx._id}>
                      <ListItem disablePadding sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{rx.name}</Typography>
                              <Chip label={rx.status} size="small" color={STATUS_COLORS[rx.status] || "default"}
                                variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Patient: {rx.patientId?.name || "Unknown"} · {rx.dosage || "No dosage"}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
