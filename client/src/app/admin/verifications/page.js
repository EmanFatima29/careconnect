"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  alpha,
  Tooltip,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import axios from "axios";
import { getSession } from "next-auth/react";
import { getProfilePicUrl } from "@/utils/profilePic";
import { createDashboardCardSx } from "@/utils/themeUtils";

async function authHeaders() {
  const session = await getSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

function ProfessionalCard({ user, type, onVerify, onReject, loading }) {
  const profile = type === "doctor" ? user.doctorProfile : user.pharmacyProfile;

  return (
    <Card sx={{ ...createDashboardCardSx(), mb: 1.5 }} elevation={0}>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Avatar src={getProfilePicUrl(user.profilePic)} sx={{ width: 44, height: 44 }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
              <Chip label={type} size="small"
                color={type === "doctor" ? "success" : "warning"}
                icon={type === "doctor" ? <LocalHospitalIcon /> : <LocalPharmacyIcon />}
                sx={{ height: 20, fontSize: "0.6rem" }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            {profile?.specialty && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Specialty: {profile.specialty}
              </Typography>
            )}
            {profile?.licenseNumber && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                License: {profile.licenseNumber}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
              Registered: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0}>
            <Tooltip title="Approve">
              <Button variant="contained" size="small" color="success"
                startIcon={loading === user._id ? <CircularProgress size={12} /> : <VerifiedIcon />}
                disabled={!!loading} onClick={() => onVerify(user._id)}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}>
                Approve
              </Button>
            </Tooltip>
            <Tooltip title="Reject">
              <Button variant="outlined" size="small" color="error"
                startIcon={<CancelIcon />} disabled={!!loading}
                onClick={() => onReject(user._id)}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}>
                Reject
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function VerificationsPage() {
  const [data, setData]       = useState({ doctors: [], pharmacies: [] });
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [tab, setTab]         = useState(0);

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const { data: res } = await axios.get(`${base}/api/admin/pending-verifications`, { headers, withCredentials: true });
      setData({ doctors: res.doctors || [], pharmacies: res.pharmacies || [] });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setFetching(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (userId) => {
    setActionLoading(userId);
    try {
      const headers = await authHeaders();
      await axios.patch(`${base}/api/admin/verify/${userId}`, {}, { headers, withCredentials: true });
      setSuccess("User approved successfully.");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      const headers = await authHeaders();
      await axios.patch(`${base}/api/admin/reject/${userId}`, {}, { headers, withCredentials: true });
      setSuccess("User rejected.");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const currentList = tab === 0 ? data.doctors : data.pharmacies;
  const currentType = tab === 0 ? "doctor" : "pharmacy";

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <VerifiedIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Pending Verifications</Typography>
        <Chip label={data.doctors.length + data.pharmacies.length} size="small" color="warning"
          variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Doctors (${data.doctors.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label={`Pharmacies (${data.pharmacies.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : currentList.length === 0 ? (
        <Card sx={{ ...createDashboardCardSx(), textAlign: "center", py: 6 }} elevation={0}>
          <VerifiedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No pending {currentType} verifications.
          </Typography>
        </Card>
      ) : (
        currentList.map((user) => (
          <ProfessionalCard key={user._id} user={user} type={currentType}
            onVerify={handleVerify} onReject={handleReject} loading={actionLoading} />
        ))
      )}
    </Box>
  );
}
