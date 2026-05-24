"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useSelector, useDispatch } from "react-redux";
import { inferRole } from "@/utils/roleUtils";
import {
  fetchPrescriptions,
  fetchAllPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "@/utils/redux/thunks/prescriptionThunks";
import { clearPrescriptionError } from "@/utils/redux/prescriptionSlice";
import { PrescriptionsSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";
import { useNetwork } from "@/utils/hooks/useNetwork";
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MedicationIcon from "@mui/icons-material/Medication";
import PersonIcon from "@mui/icons-material/Person";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ArchiveIcon from "@mui/icons-material/Archive";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const STATUS_OPTIONS = ["Prescribed", "Active", "Completed", "Archived"];

function statusChipProps(status) {
  switch (String(status).toLowerCase()) {
    case "active": return { color: "success" };
    case "completed": return { color: "primary" };
    case "archived": return { color: "default" };
    case "prescribed": default: return { color: "warning" };
  }
}

function healthChipColor(status) {
  switch (status) {
    case "healthy": return "success";
    case "stressed": case "declining": return "warning";
    case "critical": return "error";
    default: return "default";
  }
}

function safeDateLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

// ── Prescription Form Dialog ─────────────────────────────────

function PrescriptionDialog({ open, mode, initialValues, onClose, onSave, saving }) {
  const [values, setValues] = React.useState(initialValues);
  const [error, setError] = React.useState(null);

  React.useEffect(() => { setValues(initialValues); setError(null); }, [initialValues, open]);

  const handleChange = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));
  const canSave = values.name?.trim().length > 0;

  const handleSubmit = () => {
    if (!canSave) { setError("Prescription name is required"); return; }
    setError(null);
    onSave(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}><MedicalServicesIcon sx={{ fontSize: 20 }} /></Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{mode === "edit" ? "Edit Prescription" : "Add Prescription"}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          <TextField label="Prescription Name" value={values.name} onChange={handleChange("name")} required fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          <Stack direction="row" spacing={2}>
            <TextField label="Dosage" value={values.dosage} onChange={handleChange("dosage")} fullWidth
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Duration (days)" value={values.duration} onChange={handleChange("duration")} fullWidth type="number"
              inputProps={{ min: 1 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Prescribed Date" type="date" value={values.startDate} onChange={handleChange("startDate")}
              InputLabelProps={{ shrink: true }} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={values.status} onChange={handleChange("status")} sx={{ borderRadius: 2 }}>
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Notes" value={values.notes} onChange={handleChange("notes")} fullWidth multiline rows={3}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSave || saving}
          startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : mode === "edit" ? <EditIcon /> : <AddIcon />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
          {mode === "edit" ? "Save Changes" : "Add Prescription"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Prescriptions Page ──────────────────────────────────

export default function PrescriptionsPage() {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const { prescriptions, loading, error } = useSelector((state) => state.prescription);

  const role = inferRole(currentUser?.roles || session?.user?.roles);
  const isPlatformAdmin = role === "admin";

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [tabValue, setTabValue] = React.useState(0); // 0=My Prescriptions, 1=All Prescriptions (admin)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState("add");
  const [editPrescriptionData, setEditPrescriptionData] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });

  const showSnack = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  // Fetch on mount
  React.useEffect(() => {
    if (isPlatformAdmin && tabValue === 1) {
      dispatch(fetchAllPrescriptions());
    } else {
      dispatch(fetchPrescriptions({ force: true }));
    }
  }, [dispatch, isPlatformAdmin, tabValue]);

  // Filter prescriptions
  const filteredPrescriptions = React.useMemo(() => {
    let list = prescriptions || [];
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.name?.toLowerCase().includes(q) || c.dosage?.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q) ||
        (c.ownerId?.name || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [prescriptions, statusFilter, searchQuery]);

  // Stats
  const stats = React.useMemo(() => {
    const all = prescriptions || [];
    return {
      total: all.length,
      prescribed: all.filter((c) => c.status === "Prescribed").length,
      active: all.filter((c) => c.status === "Active").length,
      completed: all.filter((c) => c.status === "Completed").length,
      archived: all.filter((c) => c.status === "Archived").length,
      totalDuration: all.reduce((sum, c) => sum + (parseFloat(c.duration) || 0), 0),
      healthy: all.filter((c) => c.currentHealth?.status === "healthy").length,
    };
  }, [prescriptions]);

  // Dialog
  const openAdd = () => {
    setDialogMode("add");
    setEditPrescriptionData({ name: "", dosage: "", duration: "", startDate: "", status: "Prescribed", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (prescription) => {
    setDialogMode("edit");
    setEditPrescriptionData({
      _id: prescription._id,
      name: prescription.name || "",
      dosage: prescription.dosage || "",
      duration: prescription.duration ?? "",
      startDate: prescription.startDate ? String(prescription.startDate).slice(0, 10) : "",
      status: prescription.status || "Prescribed",
      notes: prescription.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (dialogMode === "add") {
        await dispatch(createPrescription(values)).unwrap();
        showSnack("Prescription added successfully");
      } else if (editPrescriptionData?._id) {
        await dispatch(updatePrescription({ prescriptionId: editPrescriptionData._id, updates: values })).unwrap();
        showSnack("Prescription updated successfully");
      }
      setDialogOpen(false);
    } catch (err) {
      showSnack(err || "Failed to save prescription", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prescriptionId, prescriptionName) => {
    if (!confirm(`Delete "${prescriptionName}"? This action cannot be undone.`)) return;
    try {
      await dispatch(deletePrescription(prescriptionId)).unwrap();
      showSnack("Prescription deleted");
    } catch (err) {
      showSnack(err || "Failed to delete prescription", "error");
    }
  };

  const handleRefresh = () => {
    if (isPlatformAdmin && tabValue === 1) dispatch(fetchAllPrescriptions());
    else dispatch(fetchPrescriptions({ force: true }));
  };

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        {/* Header */}
        <Fade in timeout={500}>
          <Card sx={{
            background: "linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(76,175,80,0.04) 100%)",
            border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 3,
          }}>
            <CardContent sx={{ py: 2, px: 3, "&:last-child": { pb: 2 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}><MedicalServicesIcon /></Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {isPlatformAdmin ? "Prescription Management" : "My Prescriptions"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isPlatformAdmin ? "Manage all prescriptions across the platform" : "Add, track, and manage your prescriptions"}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip icon={<MedicationIcon sx={{ fontSize: "14px !important" }} />} label={`${stats.total} prescriptions`} size="small" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={handleRefresh}
                      sx={{ border: 1, borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "rotate(180deg)", borderColor: "primary.main" } }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
                    Add Prescription
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Stats Row */}
        <Grid container spacing={2}>
          {[
            { label: "Prescribed", value: stats.prescribed, color: "warning" },
            { label: "Active", value: stats.active, color: "success" },
            { label: "Completed", value: stats.completed, color: "primary" },
            { label: "Healthy", value: stats.healthy, color: "info" },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card variant="outlined" sx={{ borderRadius: 2, transition: "all 0.2s", "&:hover": { boxShadow: 2 } }}>
                <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: `${s.color}.main` }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search + Filter + Admin Tabs */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <TextField size="small" placeholder="Search prescriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} /></InputAdornment>,
                ...(searchQuery && { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment> }),
              }}
              sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Status</MenuItem>
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {isPlatformAdmin && (
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
              sx={{ minHeight: 36, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 36, fontSize: "0.85rem" }, "& .MuiTabs-indicator": { height: 2.5, borderRadius: "3px 3px 0 0" } }}>
              <Tab label="My Prescriptions" />
              <Tab label="All Prescriptions" icon={<AdminPanelSettingsIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>
          )}
        </Stack>

        {error && <Alert severity="error" onClose={() => dispatch(clearPrescriptionError())} sx={{ borderRadius: 2 }}>{error}</Alert>}

        <OfflineNotice feature="Prescription management" />

        {/* Loading */}
        {loading && !prescriptions.length && <PrescriptionsSkeleton />}

        {/* Prescriptions Grid */}
        {filteredPrescriptions.length > 0 ? (
          <Grid container spacing={2.5}>
            {filteredPrescriptions.map((prescription) => {
              const health = prescription.currentHealth || {};
              const hasLocation = prescription.location?.coordinates && (prescription.location.coordinates[0] !== 0 || prescription.location.coordinates[1] !== 0);
              const ownerName = typeof prescription.ownerId === "object" ? prescription.ownerId?.name : null;
              const isOwn = typeof prescription.ownerId === "object" ? prescription.ownerId?._id === currentUser?._id : prescription.ownerId === currentUser?._id;

              return (
                <Grid key={prescription._id} item xs={12} sm={6} md={4}>
                  <Card sx={{
                    borderRadius: 3, height: "100%", display: "flex", flexDirection: "column",
                    transition: "all 0.3s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
                  }}>
                    {/* Status color strip */}
                    <Box sx={{ height: 4, borderRadius: "12px 12px 0 0",
                      bgcolor: prescription.status === "Active" ? "success.main" : prescription.status === "Completed" ? "primary.main" : prescription.status === "Archived" ? "grey.400" : "warning.main",
                    }} />

                    <CardContent sx={{ flex: 1, pt: 2.5 }}>
                      <Stack spacing={1.5}>
                        {/* Name + Status */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>{prescription.name || "Untitled"}</Typography>
                          <Chip size="small" label={prescription.status || "Prescribed"} {...statusChipProps(prescription.status)} sx={{ height: 24, fontWeight: 600 }} />
                        </Stack>

                        {/* Details */}
                        <Stack spacing={0.5}>
                          {prescription.dosage && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <MedicationIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">Dosage: {prescription.dosage}</Typography>
                            </Stack>
                          )}
                          {prescription.duration != null && prescription.duration !== "" && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">Duration: {prescription.duration} days</Typography>
                            </Stack>
                          )}
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">Prescribed: {safeDateLabel(prescription.startDate)}</Typography>
                          </Stack>
                        </Stack>

                        {/* Health indicator */}
                        {health.status && (
                          <>
                            <Divider />
                            <Stack direction="row" spacing={1} alignItems="center">
                              <HealthAndSafetyIcon sx={{ fontSize: 16, color: `${healthChipColor(health.status)}.main` }} />
                              <Chip size="small" label={health.status} color={healthChipColor(health.status)} variant="outlined" sx={{ height: 22, fontSize: "0.7rem", textTransform: "capitalize" }} />
                              {health.vitals != null && (
                                <Typography variant="caption" color="text.secondary">VITALS: {health.vitals.toFixed(2)}</Typography>
                              )}
                            </Stack>
                            {health.vitals != null && (
                              <LinearProgress variant="determinate" value={Math.min(health.vitals * 100, 100)}
                                color={healthChipColor(health.status)} sx={{ height: 4, borderRadius: 2 }} />
                            )}
                          </>
                        )}

                        {/* Location indicator */}
                        {hasLocation && (
                          <Chip icon={<LocationOnIcon sx={{ fontSize: "12px !important" }} />} label="Has location"
                            size="small" variant="outlined" color="info" sx={{ height: 22, fontSize: "0.65rem", width: "fit-content" }} />
                        )}

                        {/* Notes */}
                        {prescription.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{
                            overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          }}>{prescription.notes}</Typography>
                        )}

                        {/* Owner (admin view) */}
                        {ownerName && !isOwn && (
                          <Chip icon={<PersonIcon sx={{ fontSize: "12px !important" }} />} label={ownerName}
                            size="small" variant="outlined" sx={{ height: 22, fontSize: "0.65rem", width: "fit-content" }} />
                        )}
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(prescription)}
                          sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Edit</Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(prescription._id, prescription.name)}
                          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Delete</Button>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : !loading ? (
          <Card sx={{ borderRadius: 3, textAlign: "center" }}>
            <CardContent sx={{ py: 6 }}>
              <MedicalServicesIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary" variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                {searchQuery || statusFilter !== "all" ? "No prescriptions match your filters" : "No prescriptions yet"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchQuery || statusFilter !== "all" ? "Try different search or filter criteria" : "Click \"Add Prescription\" to register your first prescription"}
              </Typography>
              {!searchQuery && statusFilter === "all" && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Add Prescription</Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </Stack>

      {/* Prescription Form Dialog */}
      <PrescriptionDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={editPrescriptionData || { name: "", dosage: "", duration: "", startDate: "", status: "Prescribed", notes: "" }}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        saving={saving}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
