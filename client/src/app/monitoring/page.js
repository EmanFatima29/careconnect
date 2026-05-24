"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsIcon from "@mui/icons-material/Directions";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import api from "@/lib/api";
import logger from "@/lib/logger";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { inferRole } from "@/utils/roleUtils";
import { createDashboardCardSx } from "@/utils/themeUtils";
import { MonitoringSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";

// ============ HELPERS ============
function formatWhen(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString();
}

function healthColor(status) {
  switch (status) {
    case "healthy": return "success";
    case "stressed": return "warning";
    case "declining": return "warning";
    case "critical": return "error";
    default: return "default";
  }
}

function aiChipProps(status) {
  switch (String(status).toLowerCase()) {
    case "healthy": return { color: "success", variant: "outlined" };
    case "issue": return { color: "error", variant: "outlined" };
    case "processing": return { color: "warning", variant: "outlined" };
    default: return { color: "default", variant: "outlined" };
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════
// Patient Monitoring View — existing functionality
// ═══════════════════════════════════════════════════════

const PatientMonitoring = React.memo(function PatientMonitoring() {
  const [activeTab, setActiveTab] = React.useState(0);
  const inputRef = React.useRef(null);
  const [uploads, setUploads] = React.useState([]);
  const [gallery, setGallery] = React.useState([]);
  const [uploadError, setUploadError] = React.useState(null);
  const [prescriptions, setPrescriptions] = React.useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = React.useState(true);
  const [visits, setVisits] = React.useState([]);
  const [visitsLoading, setVisitsLoading] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);

  React.useEffect(() => {
    api.get("/api/monitoring/images")
      .then((res) => {
        const images = res.data?.data?.images || [];
        setGallery(images.map((img) => ({
          id: img.id, filename: img.originalName,
          createdAt: new Date(img.createdAt).getTime(),
          previewUrl: img.urls?.medium || img.urls?.original,
          aiStatus: img.aiAnalysis?.status || "Pending",
        })));
      })
      .catch((err) => logger.error("[Monitoring] Failed to load gallery:", err));

    api.get("/api/prescriptions")
      .then((res) => { const data = res.data?.data || res.data; setPrescriptions(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setPrescriptionsLoading(false));

    api.get("/api/visits")
      .then((res) => setVisits(res.data?.visits || []))
      .catch(() => {})
      .finally(() => setVisitsLoading(false));

    api.get("/api/visits/analytics")
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  React.useEffect(() => {
    return () => uploads.forEach((u) => u.blobUrl && URL.revokeObjectURL(u.blobUrl));
  }, []); // eslint-disable-line

  const uploadFile = React.useCallback(async (uploadItem) => {
    const formData = new FormData();
    formData.append("image", uploadItem.file);
    let progressInterval = null;
    try {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.floor(Math.random() * 8) + 3, 90);
        setUploads((prev) => prev.map((u) => (u.id === uploadItem.id ? { ...u, progress } : u)));
      }, 250);
      const response = await api.post("/api/monitoring/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      clearInterval(progressInterval);
      const mediaData = response.data.data;
      setUploads((prev) => prev.filter((u) => u.id !== uploadItem.id));
      setGallery((prev) => [{ id: uploadItem.id, filename: mediaData?.originalName || uploadItem.filename, createdAt: Date.now(), previewUrl: mediaData?.urls?.medium || mediaData?.urls?.original, aiStatus: mediaData?.aiAnalysis?.status || "Processing" }, ...prev]);
      URL.revokeObjectURL(uploadItem.blobUrl);
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      logger.error("[Monitoring] Upload failed:", err);
      setUploads((prev) => prev.map((u) => u.id === uploadItem.id ? { ...u, progress: 0, status: "error" } : u));
      setUploadError(`Failed to upload "${uploadItem.filename}".`);
    }
  }, []);

  const handlePick = () => inputRef.current?.click();
  const handleFiles = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setUploadError(null);
    const nextUploads = list.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file, filename: file.name, size: file.size, createdAt: Date.now(),
      progress: 0, status: "uploading", blobUrl: URL.createObjectURL(file), aiStatus: "Pending",
    }));
    setUploads((prev) => [...nextUploads, ...prev]);
    nextUploads.forEach((u) => uploadFile(u));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFetchSatellite = async (prescriptionId) => {
    try {
      const res = await api.get(`/api/monitoring/diagnostic/${prescriptionId}`);
      return res.data?.data;
    } catch (err) {
      logger.error("[Monitoring] Diagnostic fetch failed:", err);
      return null;
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Fade in timeout={500}>
        <Card sx={{
          background: "linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(76,175,80,0.04) 100%)",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          borderRadius: 3,
        }}>
          <CardContent sx={{ py: 2, px: 3, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
                  <MedicalServicesIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Prescription Monitoring</Typography>
                  <Typography variant="body2" color="text.secondary">Upload images, monitor health, track visits</Typography>
                </Box>
              </Stack>
              <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={handlePick}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
                Upload Images
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      {uploadError && <Alert severity="error" onClose={() => setUploadError(null)} sx={{ borderRadius: 2 }}>{uploadError}</Alert>}

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{
            borderBottom: 1, borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 52 },
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
          }}>
          <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Upload & Gallery" />
          <Tab icon={<MedicalServicesIcon />} iconPosition="start" label="Prescription Health" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Visit History" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Analytics" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {/* Tab 0: Upload & Gallery */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              {uploads.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Upload Queue</Typography>
                    <Stack spacing={1}>
                      {uploads.slice(0, 6).map((u) => (
                        <Stack key={u.id} direction="row" spacing={2} alignItems="center" sx={{ p: 1, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{u.filename}</Typography>
                            <Chip size="small" label={u.status === "error" ? "Failed" : "Uploading"} color={u.status === "error" ? "error" : "primary"} variant="outlined" sx={{ mt: 0.5, height: 22 }} />
                          </Box>
                          <Box sx={{ width: 180 }}>
                            <LinearProgress variant="determinate" value={u.status === "error" ? 100 : u.progress} color={u.status === "error" ? "error" : "primary"} sx={{ height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" color="text.secondary">{u.status === "error" ? "Failed" : `${u.progress}%`}</Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Gallery</Typography>
                    <Chip label={`${gallery.length} images`} size="small" variant="outlined" sx={{ height: 24 }} />
                  </Stack>
                  {gallery.length === 0 ? (
                    <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                      <CloudUploadIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">No images uploaded yet. Click &quot;Upload Images&quot; to start.</Typography>
                    </Stack>
                  ) : (
                    <Grid container spacing={2}>
                      {gallery.slice(0, 18).map((img) => (
                        <Grid item key={img.id} xs={12} sm={6} md={4}>
                          <Card variant="outlined" sx={{ borderRadius: 2, transition: "all 0.2s", "&:hover": { boxShadow: 3, transform: "translateY(-2px)" } }}>
                            <CardMedia component="img" height="180" image={img.previewUrl} alt={img.filename} sx={{ objectFit: "cover" }} />
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{img.filename}</Typography>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <Chip size="small" label={`AI: ${img.aiStatus}`} {...aiChipProps(img.aiStatus)} sx={{ height: 22 }} />
                                <Typography variant="caption" color="text.secondary">{formatWhen(img.createdAt)}</Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* Tab 1: Prescription Health */}
          {activeTab === 1 && (
            <Stack spacing={2}>
              {prescriptionsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
              ) : prescriptions.length === 0 ? (
                <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
                  <MedicalServicesIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                  <Typography color="text.secondary">No prescriptions registered. Add prescriptions from the Prescriptions page.</Typography>
                </Stack>
              ) : (
                <Grid container spacing={2.5}>
                  {prescriptions.map((prescription) => {
                    const health = prescription.currentHealth || {};
                    return (
                      <Grid item key={prescription._id} xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", transition: "all 0.2s", "&:hover": { boxShadow: 3 } }}>
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{prescription.name}</Typography>
                                <Chip size="small" label={prescription.status} color={prescription.status === "Active" ? "success" : prescription.status === "Prescribed" ? "primary" : "default"} variant="outlined" />
                              </Stack>
                              {prescription.dosage && <Typography variant="caption" color="text.secondary">Dosage: {prescription.dosage}</Typography>}
                              {prescription.area > 0 && <Typography variant="caption" color="text.secondary">Area: {prescription.area}</Typography>}
                              <Divider />
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Health:</Typography>
                                {health.status ? <Chip size="small" label={health.status} color={healthColor(health.status)} /> : <Chip size="small" label="Not analyzed" variant="outlined" />}
                              </Stack>
                              {health.vitals != null && (
                                <Stack spacing={0.5}>
                                  <Typography variant="caption" color="text.secondary">VITALS: {health.vitals.toFixed(2)}</Typography>
                                  <LinearProgress variant="determinate" value={Math.min(health.vitals * 100, 100)} color={healthColor(health.status)} sx={{ height: 6, borderRadius: 3 }} />
                                </Stack>
                              )}
                              {health.lastChecked && <Typography variant="caption" color="text.secondary">Last checked: {formatWhen(health.lastChecked)}</Typography>}
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Fetch diagnostic VITALS data">
                                  <Button size="small" variant="outlined" startIcon={<SatelliteAltIcon />} sx={{ borderRadius: 2, textTransform: "none" }}
                                    onClick={async () => {
                                      const result = await handleFetchSatellite(prescription._id);
                                      if (result) {
                                        setPrescriptions((prev) => prev.map((c) =>
                                          c._id === prescription._id ? { ...c, currentHealth: { ...c.currentHealth, vitals: result.currentNDVI, status: result.healthStatus, lastChecked: new Date() } } : c
                                        ));
                                      }
                                    }}>Diagnostic</Button>
                                </Tooltip>
                              </Stack>
                              {prescription.healthHistory?.length > 0 && (
                                <>
                                  <Divider />
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Recent Analysis</Typography>
                                  {prescription.healthHistory.slice(-3).reverse().map((h, i) => (
                                    <Stack key={i} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                      <Chip size="small" label={h.source} variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                                      {h.healthStatus && <Chip size="small" label={h.healthStatus} color={healthColor(h.healthStatus)} sx={{ height: 20, fontSize: "0.65rem" }} />}
                                      {h.diseaseDetected && <Typography variant="caption" color="error">{h.diseaseDetected}</Typography>}
                                      <Typography variant="caption" color="text.secondary">{formatWhen(h.date)}</Typography>
                                    </Stack>
                                  ))}
                                </>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Stack>
          )}

          {/* Tab 2: Visit History */}
          {activeTab === 2 && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Visit History</Typography>
                {visitsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : visits.length === 0 ? (
                  <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                    <HistoryIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">No visits recorded yet.</Typography>
                  </Stack>
                ) : (
                  <List disablePadding>
                    {visits.map((visit) => (
                      <ListItem key={visit._id} divider sx={{ py: 1.5, borderRadius: 1 }}>
                        <ListItemAvatar>
                          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            badgeContent={visit.gpsVerified ? <VerifiedIcon sx={{ fontSize: 14, color: "success.main" }} /> : null}>
                            <Avatar src={typeof visit.visitorId?.profilePic === "object" ? visit.visitorId.profilePic?.thumbnail : visit.visitorId?.profilePic}>
                              {(visit.visitorId?.name || "V").charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{visit.visitorId?.name || "Visitor"} → {visit.patientId?.name || visit.farmerId?.name || "Patient"}</Typography>
                              {visit.gpsVerified && <Chip size="small" label="GPS Verified" color="success" variant="outlined" icon={<LocationOnIcon />} sx={{ height: 22 }} />}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                              {(visit.prescriptionId || visit.cropId) && <Typography variant="caption">Prescription: {(visit.prescriptionId || visit.cropId).name} ({(visit.prescriptionId || visit.cropId).status})</Typography>}
                              {visit.proximityDistance != null && <Typography variant="caption">Distance: {visit.proximityDistance}m</Typography>}
                              {visit.notes && <Typography variant="caption" color="text.secondary">{visit.notes}</Typography>}
                              <Typography variant="caption" color="text.secondary">{formatWhen(visit.createdAt)}</Typography>
                            </Stack>
                          }
                        />
                        <Chip size="small" label={visit.status} variant="outlined" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Analytics */}
          {activeTab === 3 && (
            <Stack spacing={2}>
              {analyticsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
              ) : (
                <>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Total Visits", value: analytics?.visits?.totalVisits || 0, color: "primary", icon: HistoryIcon },
                      { label: "GPS Verified", value: analytics?.visits?.verifiedVisits || 0, color: "success", icon: VerifiedIcon },
                      { label: "Unique Patients", value: analytics?.visits?.uniqueFarmerCount || analytics?.visits?.uniquePatientCount || 0, color: "info", icon: PeopleIcon },
                      { label: "Avg Duration", value: `${analytics?.visits?.avgDuration || 0}m`, color: "warning", icon: BarChartIcon },
                    ].map((stat) => (
                      <Grid item key={stat.label} xs={6} sm={3}>
                        <Card variant="outlined" sx={{ borderRadius: 2, transition: "all 0.2s", "&:hover": { boxShadow: 2 } }}>
                          <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main`, mb: 0.5 }} />
                            <Typography variant="h5" color={`${stat.color}.main`} sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Prescription Area by Type</Typography>
                      {(!analytics?.acreage || analytics.acreage.length === 0) ? (
                        <Typography variant="body2" color="text.secondary">No prescription data available.</Typography>
                      ) : (
                        <Stack spacing={1}>
                          {analytics.acreage.map((prescription) => (
                            <Stack key={prescription._id} direction="row" spacing={2} alignItems="center">
                              <MedicalServicesIcon color="action" fontSize="small" />
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{prescription._id}</Typography>
                                  <Typography variant="body2" color="text.secondary">{prescription.totalArea || 0} ({prescription.count} care units)</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={Math.min((prescription.totalArea / (analytics.acreage[0]?.totalArea || 1)) * 100, 100)} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Weekly Visit Activity</Typography>
                      {(!analytics?.timeline || analytics.timeline.length === 0) ? (
                        <Typography variant="body2" color="text.secondary">No visit data available.</Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {analytics.timeline.map((week, i) => (
                            <Stack key={i} direction="row" spacing={2} alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                                {new Date(week.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </Typography>
                              <LinearProgress variant="determinate"
                                value={Math.min((week.count / Math.max(...analytics.timeline.map((t) => t.count), 1)) * 100, 100)}
                                sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                              <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 24 }}>{week.count}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </Stack>
          )}
        </Box>
      </Paper>
    </Stack>
  );
});

// ═══════════════════════════════════════════════════════
// Admin Map Component — dynamically loaded (SSR-safe)
// ═══════════════════════════════════════════════════════

const AdminMapView = dynamic(() => import("./AdminMonitoringMap"), { ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">Loading map...</Typography>
      </Stack>
    </Box>
  ),
});

// ═══════════════════════════════════════════════════════
// Admin Monitoring View — map + search + analysis
// ═══════════════════════════════════════════════════════

const AdminMonitoring = React.memo(function AdminMonitoring() {
  const [mapData, setMapData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [selectedField, setSelectedField] = React.useState(null);
  const [fieldAnalysis, setFieldAnalysis] = React.useState(null);
  const [patientDetails, setPatientDetails] = React.useState(null);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sidebarTab, setSidebarTab] = React.useState(0); // 0=patients, 1=care units
  const [routeTarget, setRouteTarget] = React.useState(null);
  const [mapCenter, setMapCenter] = React.useState(null);

  // Fetch map data
  const fetchMapData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/monitoring/map-data");
      setMapData(res.data);
    } catch (err) {
      logger.error("[AdminMonitoring] Failed to load map data:", err);
      setError("Failed to load monitoring data. Check admin permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchMapData(); }, [fetchMapData]);

  // Fetch care unit analysis
  const handleSelectField = React.useCallback(async (ward) => {
    setSelectedField(ward);
    setSelectedPatient(null);
    setPatientDetails(null);
    setAnalysisLoading(true);
    try {
      const res = await api.get(`/api/admin/monitoring/ward/${ward._id}`);
      setFieldAnalysis(res.data);
    } catch (err) {
      logger.error("[AdminMonitoring] Care unit analysis failed:", err);
      setFieldAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // Fetch patient details
  const handleSelectPatient = React.useCallback(async (patient) => {
    setSelectedPatient(patient);
    setSelectedField(null);
    setFieldAnalysis(null);
    setAnalysisLoading(true);
    const coords = patient.location?.coordinates;
    if (coords) setMapCenter([coords[1], coords[0]]);
    try {
      const res = await api.get(`/api/admin/monitoring/patient/${patient._id}`);
      setPatientDetails(res.data);
    } catch (err) {
      logger.error("[AdminMonitoring] Patient details failed:", err);
      setPatientDetails(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // Trigger diagnostic analysis
  const handleSatelliteAnalysis = React.useCallback(async (prescriptionId) => {
    try {
      const res = await api.get(`/api/monitoring/diagnostic/${prescriptionId}`);
      if (res.data?.data) {
        // Refresh ward analysis
        const updated = await api.get(`/api/admin/monitoring/ward/${prescriptionId}`);
        setFieldAnalysis(updated.data);
      }
      return res.data?.data;
    } catch (err) {
      logger.error("[AdminMonitoring] Diagnostic analysis failed:", err);
      return null;
    }
  }, []);

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setSelectedField(null);
    setFieldAnalysis(null);
    setPatientDetails(null);
    setRouteTarget(null);
  };

  // Filter patients/care units by search
  const filteredPatients = React.useMemo(() => {
    if (!mapData?.patients) return [];
    if (!searchQuery.trim()) return mapData.patients;
    const q = searchQuery.toLowerCase();
    return mapData.patients.filter((f) =>
      f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q) || f.address?.city?.toLowerCase().includes(q)
    );
  }, [mapData?.patients, searchQuery]);

  const filteredFields = React.useMemo(() => {
    if (!mapData?.allFields) return [];
    if (!searchQuery.trim()) return mapData.allFields;
    const q = searchQuery.toLowerCase();
    return mapData.allFields.filter((f) =>
      f.name?.toLowerCase().includes(q) || f.dosage?.toLowerCase().includes(q) || f.ownerId?.name?.toLowerCase().includes(q)
    );
  }, [mapData?.allFields, searchQuery]);

  if (loading) {
    return (
      <MonitoringSkeleton />
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  const stats = mapData?.stats || {};

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Fade in timeout={500}>
        <Card sx={{
          background: "linear-gradient(135deg, rgba(27,94,32,0.1) 0%, rgba(46,125,50,0.05) 50%, rgba(76,175,80,0.03) 100%)",
          border: "1px solid", borderColor: (theme) => alpha(theme.palette.primary.main, 0.15), borderRadius: 3,
        }}>
          <CardContent sx={{ py: 2, px: 3, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "primary.dark", width: 44, height: 44 }}><AdminPanelSettingsIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Monitoring Center</Typography>
                  <Typography variant="body2" color="text.secondary">Monitor patients, care units, and prescription health across the platform</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip icon={<PeopleIcon sx={{ fontSize: "14px !important" }} />} label={`${stats.totalFarmers || stats.totalPatients || 0} Patients`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                <Chip icon={<LocalHospitalIcon sx={{ fontSize: "14px !important" }} />} label={`${stats.totalFields || stats.totalUnits || 0} Care Units`} size="small" color="success" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                <Chip icon={<MapIcon sx={{ fontSize: "14px !important" }} />} label={`${stats.totalArea || 0}`} size="small" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                <IconButton size="small" onClick={fetchMapData} sx={{ border: 1, borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "rotate(180deg)", borderColor: "primary.main" } }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      <OfflineNotice feature="Monitoring" />

      {/* Stats Row */}
      <Grid container spacing={2}>
        {[
          { label: "Total Patients", value: stats.totalFarmers || stats.totalPatients || 0, icon: PeopleIcon, color: "primary" },
          { label: "Total Care Units", value: stats.totalFields || stats.totalUnits || 0, icon: LocalHospitalIcon, color: "success" },
          { label: "Healthy Prescriptions", value: stats.healthyPrescriptions || stats.healthyCrops || 0, icon: HealthAndSafetyIcon, color: "info" },
          { label: "Needs Attention", value: stats.needsAttention || stats.stressedCrops || 0, icon: BugReportIcon, color: "warning" },
        ].map((stat, i) => (
          <Grid item key={stat.label} xs={6} sm={3}>
            <Card sx={{ ...createDashboardCardSx(i), borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main`, mb: 0.5 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: `${stat.color}.main` }}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content: Map + Sidebar */}
      <Grid container spacing={2.5}>
        {/* Sidebar */}
        <Grid item xs={12} md={4} lg={3}>
          <Card sx={{ borderRadius: 3, height: { md: "calc(70vh)" }, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 0 } }}>
              {/* Search */}
              <Box sx={{ p: 2, pb: 1 }}>
                <TextField
                  fullWidth size="small" placeholder="Search patients or care units..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} /></InputAdornment>,
                    ...(searchQuery && { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment> }),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              {/* Selected Detail View */}
              {(selectedPatient || selectedField) ? (
                <Box sx={{ flex: 1, overflow: "auto", p: 2, pt: 0 }}>
                  <Button size="small" startIcon={<ArrowBackIcon />} onClick={handleClearSelection} sx={{ mb: 1, textTransform: "none" }}>Back to list</Button>

                  {/* Patient Detail */}
                  {selectedPatient && (
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                          {selectedPatient.name?.charAt(0) || "P"}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedPatient.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{selectedPatient.email}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.75}>
                        <Chip size="small" icon={<FiberManualRecordIcon sx={{ fontSize: "8px !important" }} />}
                          label={selectedPatient.status === "online" ? "Online" : "Offline"}
                          color={selectedPatient.status === "online" ? "success" : "default"} variant="outlined" sx={{ height: 24 }} />
                        {selectedPatient.settings?.locationSharing && (
                          <Chip size="small" icon={<LocationOnIcon sx={{ fontSize: "14px !important" }} />} label="Sharing" color="info" variant="outlined" sx={{ height: 24 }} />
                        )}
                      </Stack>
                      {selectedPatient.address?.city && (
                        <Typography variant="caption" color="text.secondary">
                          {[selectedPatient.address.city, selectedPatient.address.state, selectedPatient.address.country].filter(Boolean).join(", ")}
                        </Typography>
                      )}
                      <Button size="small" variant="outlined" startIcon={<DirectionsIcon />} sx={{ borderRadius: 2, textTransform: "none" }}
                        onClick={() => {
                          const coords = selectedPatient.location?.coordinates;
                          if (coords) setRouteTarget([coords[1], coords[0]]);
                        }}>
                        Get Directions
                      </Button>

                      {analysisLoading ? <CircularProgress size={24} sx={{ alignSelf: "center" }} /> : patientDetails && (
                        <>
                          <Divider />
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip size="small" label={`${patientDetails.stats?.totalPrescriptions || patientDetails.stats?.totalCrops || 0} Prescriptions`} variant="outlined" sx={{ height: 24 }} />
                            <Chip size="small" label={`Total Area: ${patientDetails.stats?.totalArea || 0}`} variant="outlined" sx={{ height: 24 }} />
                            <Chip size="small" label={`${patientDetails.stats?.totalVisits || 0} Visits`} variant="outlined" sx={{ height: 24 }} />
                          </Stack>
                          {patientDetails.prescriptions?.length > 0 && (
                            <>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>Prescriptions</Typography>
                              <Stack spacing={0.5}>
                                {patientDetails.prescriptions.map((c) => (
                                  <Stack key={c._id} direction="row" justifyContent="space-between" alignItems="center"
                                    sx={{ py: 0.5, px: 1, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), cursor: "pointer", "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) } }}
                                    onClick={() => handleSelectField(c)}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <MedicalServicesIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{c.name}</Typography>
                                    </Stack>
                                    <Chip size="small" label={c.status} color={healthColor(c.currentHealth?.status)} variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                                  </Stack>
                                ))}
                              </Stack>
                            </>
                          )}
                        </>
                      )}
                    </Stack>
                  )}

                  {/* Care Unit Detail */}
                  {selectedField && (
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "success.main", width: 40, height: 40 }}><MedicalServicesIcon /></Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedField.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{selectedField.dosage || "No dosage"} · Area: {selectedField.area || 0}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap">
                        <Chip size="small" label={selectedField.status} color={selectedField.status === "Active" ? "success" : "primary"} variant="outlined" sx={{ height: 24 }} />
                        {selectedField.currentHealth?.status && (
                          <Chip size="small" label={selectedField.currentHealth.status} color={healthColor(selectedField.currentHealth.status)} sx={{ height: 24 }} />
                        )}
                      </Stack>
                      {selectedField.ownerId?.name && <Typography variant="caption" color="text.secondary">Owner: {selectedField.ownerId.name}</Typography>}

                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" startIcon={<DirectionsIcon />} sx={{ borderRadius: 2, textTransform: "none", flex: 1 }}
                          onClick={() => {
                            const coords = selectedField.location?.coordinates;
                            if (coords) setRouteTarget([coords[1], coords[0]]);
                          }}>Directions</Button>
                        <Button size="small" variant="contained" startIcon={<SatelliteAltIcon />} sx={{ borderRadius: 2, textTransform: "none", flex: 1, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}
                          onClick={() => handleSatelliteAnalysis(selectedField._id)}>Analyze</Button>
                      </Stack>

                      {analysisLoading ? <CircularProgress size={24} sx={{ alignSelf: "center" }} /> : fieldAnalysis && (
                        <>
                          <Divider />
                          {/* Health Summary */}
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Health Summary</Typography>
                          <Stack spacing={0.5}>
                            {[
                              { label: "Status", value: fieldAnalysis.analysis?.healthSummary?.currentStatus || "Unknown" },
                              { label: "VITALS", value: fieldAnalysis.analysis?.healthSummary?.currentNdvi?.toFixed(3) || "N/A" },
                              { label: "Analyses", value: fieldAnalysis.analysis?.healthSummary?.totalAnalyses || 0 },
                              { label: "Visits", value: fieldAnalysis.analysis?.visitCount || 0 },
                            ].map((item) => (
                              <Stack key={item.label} direction="row" justifyContent="space-between" sx={{ py: 0.25, px: 1, borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
                                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                              </Stack>
                            ))}
                          </Stack>

                          {fieldAnalysis.analysis?.healthSummary?.currentNdvi != null && (
                            <LinearProgress variant="determinate"
                              value={Math.min(fieldAnalysis.analysis.healthSummary.currentNdvi * 100, 100)}
                              color={healthColor(fieldAnalysis.analysis.healthSummary.currentStatus)}
                              sx={{ height: 8, borderRadius: 4 }} />
                          )}

                          {/* Care Estimate */}
                          {fieldAnalysis.analysis?.yieldEstimate && (
                            <>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>Care Estimate</Typography>
                              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.success.main, 0.04) }}>
                                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                  <Stack spacing={0.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                      <Typography variant="caption" color="text.secondary">Expected Outcome</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                                        {fieldAnalysis.analysis.yieldEstimate.estimatedTotalTons}
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                      <Typography variant="caption" color="text.secondary">Per Unit</Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{fieldAnalysis.analysis.yieldEstimate.yieldPerHa}</Typography>
                                    </Stack>
                                    <Chip size="small" label={`Confidence: ${fieldAnalysis.analysis.yieldEstimate.confidence}`}
                                      color={fieldAnalysis.analysis.yieldEstimate.confidence === "high" ? "success" : fieldAnalysis.analysis.yieldEstimate.confidence === "medium" ? "warning" : "default"}
                                      variant="outlined" sx={{ height: 22, width: "fit-content" }} />
                                  </Stack>
                                </CardContent>
                              </Card>
                            </>
                          )}

                          {/* VITALS Trend */}
                          {fieldAnalysis.analysis?.ndviTrend?.length > 0 && (
                            <>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>VITALS History</Typography>
                              <Stack spacing={0.5}>
                                {fieldAnalysis.analysis.ndviTrend.slice(-5).reverse().map((t, i) => (
                                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65 }}>
                                      {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </Typography>
                                    <LinearProgress variant="determinate" value={Math.min((t.vitals || 0) * 100, 100)} color={healthColor(t.status)}
                                      sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 30 }}>{t.vitals?.toFixed(2)}</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </>
                          )}
                        </>
                      )}
                    </Stack>
                  )}
                </Box>
              ) : (
                /* List View */
                <>
                  <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} variant="fullWidth"
                    sx={{ px: 2, minHeight: 40, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40, fontSize: "0.8rem" }, "& .MuiTabs-indicator": { height: 2 } }}>
                    <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Patients (${filteredPatients.length})`} />
                    <Tab icon={<MedicalServicesIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Care Units (${filteredFields.length})`} />
                  </Tabs>
                  <List sx={{ flex: 1, overflow: "auto", px: 1 }} disablePadding>
                    {sidebarTab === 0 && filteredPatients.map((patient) => {
                      const coords = patient.location?.coordinates;
                      return (
                        <ListItemButton key={patient._id} onClick={() => handleSelectPatient(patient)}
                          sx={{ borderRadius: 1.5, mb: 0.5, py: 1 }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", bgcolor: patient.status === "online" ? "success.main" : "grey.400" }}>
                              {patient.name?.charAt(0) || "F"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{patient.name}</Typography>}
                            secondary={
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <FiberManualRecordIcon sx={{ fontSize: 8, color: patient.status === "online" ? "success.main" : "text.disabled" }} />
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {patient.address?.city || (coords ? `${coords[1]?.toFixed(2)}, ${coords[0]?.toFixed(2)}` : "No location")}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                    {sidebarTab === 1 && filteredFields.map((ward) => (
                      <ListItemButton key={ward._id} onClick={() => handleSelectField(ward)}
                        sx={{ borderRadius: 1.5, mb: 0.5, py: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", bgcolor: healthColor(ward.currentHealth?.status) === "success" ? "success.main" : healthColor(ward.currentHealth?.status) === "warning" ? "warning.main" : "grey.400" }}>
                            <MedicalServicesIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{ward.name}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {ward.ownerId?.name || "Unknown"} · Area: {ward.area || 0} · {ward.status}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                    {((sidebarTab === 0 && filteredPatients.length === 0) || (sidebarTab === 1 && filteredFields.length === 0)) && (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No results found</Typography>
                      </Stack>
                    )}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Map */}
        <Grid item xs={12} md={8} lg={9}>
          <Card sx={{ borderRadius: 3, height: { xs: "50vh", md: "calc(70vh)" }, overflow: "hidden" }}>
            <AdminMapView
              patients={mapData?.patients || []}
              wards={mapData?.wards || []}
              onSelectPatient={handleSelectPatient}
              onSelectField={handleSelectField}
              routeTarget={routeTarget}
              onClearRoute={() => setRouteTarget(null)}
              mapCenter={mapCenter}
            />
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
});

// ═══════════════════════════════════════════════════════
// Main Page — role-based routing
// ═══════════════════════════════════════════════════════

export default function MonitoringPage() {
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const role = inferRole(currentUser?.roles || session?.user?.roles);

  return (
    <Container maxWidth="xl" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      {role === "admin" ? <AdminMonitoring /> : <PatientMonitoring />}
    </Container>
  );
}
