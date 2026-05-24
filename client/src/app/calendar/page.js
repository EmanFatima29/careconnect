"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { inferRole } from "@/utils/roleUtils";
import { createDashboardCardSx } from "@/utils/themeUtils";
import { CalendarSkeleton } from "@/components/UI/PageSkeletons";
import { OfflineNotice } from "@/components/UI/NetworkBanner";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RefreshIcon from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPES = [
  { value: "task", label: "Task", color: "#2e7d32" },
  { value: "meeting", label: "Meeting", color: "#1976d2" },
  { value: "monitoring", label: "Monitoring", color: "#7b1fa2" },
  { value: "review", label: "Review", color: "#f57c00" },
  { value: "reminder", label: "Reminder", color: "#d32f2f" },
  { value: "other", label: "Other", color: "#78909c" },
];

function getTypeColor(type) {
  return EVENT_TYPES.find((t) => t.value === type)?.color || "#2e7d32";
}

// ═══════════════════════════════════════════════════════
// Event Form Modal
// ═══════════════════════════════════════════════════════

function EventFormModal({ open, onClose, onSave, event, groups, loading }) {
  const isEdit = !!event?._id;
  const [form, setForm] = React.useState({
    title: "", description: "", date: "", time: "", duration: "", type: "task", color: "#2e7d32", groupId: "",
  });
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
        time: event.time || "",
        duration: event.duration || "",
        type: event.type || "task",
        color: event.color || "#2e7d32",
        groupId: typeof event.groupId === "object" ? event.groupId?._id || "" : event.groupId || "",
      });
    } else {
      setForm((f) => ({ ...f, title: "", description: "", time: "", duration: "", type: "task", color: "#2e7d32", groupId: "" }));
    }
    setError(null);
  }, [event, open]);

  const handleTypeChange = (type) => {
    const color = getTypeColor(type);
    setForm((f) => ({ ...f, type, color }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.date) { setError("Date is required"); return; }
    setError(null);
    onSave({ ...form, groupId: form.groupId || null });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: form.color || "primary.main", width: 36, height: 36 }}>
              <EventIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Edit Event" : "New Event"}</Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <TextField label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />

          <TextField label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth multiline rows={2} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />

          <Stack direction="row" spacing={2}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              fullWidth required InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              fullWidth InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 1 hour" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={(e) => handleTypeChange(e.target.value)} sx={{ borderRadius: 2 }}>
                {EVENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FiberManualRecordIcon sx={{ fontSize: 12, color: t.color }} />
                      <span>{t.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Group assignment */}
          {groups.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Assign to Group (optional)</InputLabel>
              <Select value={form.groupId} label="Assign to Group (optional)"
                onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))} sx={{ borderRadius: 2 }}>
                <MenuItem value=""><em>Personal event</em></MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g._id} value={g._id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GroupsIcon sx={{ fontSize: 16, color: "primary.main" }} />
                      <span>{g.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {form.groupId && (
            <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
              <Typography variant="caption">This event will be visible to all members of the selected group.</Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none" }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} sx={{ color: "white" }} /> : isEdit ? <EditIcon /> : <AddIcon />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
          {isEdit ? "Save Changes" : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// Calendar Page
// ═══════════════════════════════════════════════════════

export default function CalendarPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const groups = useSelector((state) => state.group?.groups || []);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(now.getMonth());
  const [currentYear, setCurrentYear] = React.useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = React.useState(now.getDate());
  const [events, setEvents] = React.useState([]);
  const [eventsLoading, setEventsLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState(null);
  const [error, setError] = React.useState(null);

  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthLabel = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" });

  // Groups where current user is admin (can create group events)
  const adminGroups = React.useMemo(() => {
    if (!currentUser) return [];
    return groups.filter((g) => {
      const admins = g.admins || [];
      return (
        admins.some((a) => (typeof a === "object" ? a._id : a) === currentUser._id) ||
        String(typeof g.createdBy === "object" ? g.createdBy?._id : g.createdBy) === String(currentUser._id)
      );
    });
  }, [groups, currentUser]);

  // Fetch events for the month
  const fetchEvents = React.useCallback(async () => {
    setEventsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/events?month=${currentMonth}&year=${currentYear}`);
      setEvents(res.data?.events || []);
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, [currentMonth, currentYear]);

  React.useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Days that have events (for dots)
  const eventDaySet = React.useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [events, currentMonth, currentYear]);

  // Events for the selected day
  const selectedDayEvents = React.useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [events, selectedDay, currentMonth, currentYear]);

  // Navigation
  const handlePrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDay(1);
  };
  const handleNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDay(1);
  };

  // CRUD handlers
  const handleCreateEvent = () => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    setEditEvent({ date: dateStr });
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setEditEvent(event);
    setShowForm(true);
  };

  const handleSaveEvent = async (formData) => {
    setSaving(true);
    try {
      if (editEvent?._id) {
        await api.patch(`/api/events/${editEvent._id}`, formData);
      } else {
        await api.post("/api/events", formData);
      }
      setShowForm(false);
      setEditEvent(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      setError("Failed to delete event");
    }
  };

  const handleToggleEvent = async (eventId) => {
    try {
      await api.patch(`/api/events/${eventId}/toggle`);
      fetchEvents();
    } catch (err) {
      setError("Failed to update event");
    }
  };

  const selectedDateStr = new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("default", {
    weekday: "long", month: "long", day: "numeric",
  });

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
                  <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}><CalendarTodayIcon /></Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Calendar</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your events, tasks, and group schedules</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`${events.length} events`} size="small" variant="outlined" sx={{ fontWeight: 600, height: 28 }} />
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={fetchEvents}
                      sx={{ border: 1, borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "rotate(180deg)", borderColor: "primary.main" } }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateEvent} size="small"
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" }}>
                    New Event
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>{error}</Alert>}
        <OfflineNotice feature="Calendar" />

        {eventsLoading && events.length === 0 && <CalendarSkeleton />}

        {/* Month Navigation */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
          <IconButton onClick={handlePrev} size="small" sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 180, textAlign: "center" }}>{monthLabel}</Typography>
          <IconButton onClick={handleNext} size="small" sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          {!isCurrentMonth && (
            <Button size="small" variant="outlined" onClick={() => { setCurrentMonth(todayMonth); setCurrentYear(todayYear); setSelectedDay(todayDate); }}
              sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.75rem" }}>Today</Button>
          )}
        </Stack>

        <Grid container spacing={2.5}>
          {/* Calendar Grid */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ ...createDashboardCardSx(0), borderRadius: 3, height: "100%" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                {/* Weekday headers */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 1 }}>
                  {WEEKDAYS.map((day) => (
                    <Typography key={day} variant="caption" sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary", py: 0.75, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                      {day}
                    </Typography>
                  ))}
                </Box>

                {eventsLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>}

                {/* Day cells */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: { xs: 0.5, sm: 0.75 } }}>
                  {Array.from({ length: firstDay }).map((_, i) => <Box key={`e-${i}`} />)}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = isCurrentMonth && day === todayDate;
                    const isSelected = day === selectedDay;
                    const isPast = isCurrentMonth && day < todayDate;
                    const hasEvent = eventDaySet.has(day);

                    // Count events on this day to show multiple dots
                    const dayEvents = events.filter((e) => {
                      const d = new Date(e.date);
                      return d.getDate() === day && d.getMonth() === currentMonth;
                    });
                    const hasGroup = dayEvents.some((e) => e.groupId);

                    return (
                      <Box key={day} component="button" onClick={() => setSelectedDay(day)}
                        sx={{
                          aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          borderRadius: 2, border: isSelected && !isToday ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
                          cursor: "pointer", fontSize: { xs: "0.75rem", sm: "0.875rem" }, fontWeight: 600, fontFamily: "inherit",
                          position: "relative", transition: "all 0.2s ease",
                          bgcolor: isToday ? "primary.main" : isSelected ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                          color: isToday ? "#fff" : isPast ? alpha(theme.palette.text.primary, 0.35) : "text.primary",
                          boxShadow: isToday ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}` : "none",
                          "&:hover": { transform: "scale(1.08)", bgcolor: isToday ? "primary.dark" : alpha(theme.palette.primary.main, 0.1) },
                        }}>
                        {day}
                        {hasEvent && (
                          <Stack direction="row" spacing={0.25} sx={{ position: "absolute", bottom: { xs: 1, sm: 3 } }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isToday ? "white" : "primary.main" }} />
                            {hasGroup && <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isToday ? "rgba(255,255,255,0.6)" : "info.main" }} />}
                          </Stack>
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {/* Legend */}
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                  {[{ color: "primary.main", label: "Personal" }, { color: "info.main", label: "Group event" }].map((l) => (
                    <Stack key={l.label} direction="row" spacing={0.5} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: l.color }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{l.label}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Events Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ ...createDashboardCardSx(1), borderRadius: 3, height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EventIcon sx={{ color: "primary.main", fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedDateStr}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}</Typography>
                  </Box>
                  <Tooltip title="Add event on this day">
                    <IconButton size="small" onClick={handleCreateEvent} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {selectedDayEvents.length === 0 ? (
                  <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                    <CalendarTodayIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">No events on this day</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleCreateEvent}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Add Event</Button>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    {selectedDayEvents.map((event, idx) => {
                      const isCreator = String(typeof event.creatorId === "object" ? event.creatorId?._id : event.creatorId) === String(currentUser?._id);
                      const groupName = typeof event.groupId === "object" ? event.groupId?.name : null;
                      const creatorName = typeof event.creatorId === "object" ? event.creatorId?.name : null;

                      return (
                        <Fade in timeout={300 + idx * 100} key={event._id}>
                          <Box sx={{
                            p: 1.5, borderRadius: 2.5, border: 1, borderColor: "divider",
                            transition: "all 0.2s", opacity: event.completed ? 0.6 : 1,
                            "&:hover": { boxShadow: 2, transform: "translateY(-1px)" },
                          }}>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                              {/* Color bar */}
                              <Box sx={{ width: 4, minHeight: 44, borderRadius: 2, bgcolor: event.color || getTypeColor(event.type), flexShrink: 0, mt: 0.25 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                  <Typography variant="body2" sx={{
                                    fontWeight: 600, textDecoration: event.completed ? "line-through" : "none",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%",
                                  }}>
                                    {event.title}
                                  </Typography>
                                  {isCreator && (
                                    <Stack direction="row" spacing={0}>
                                      <IconButton size="small" onClick={() => handleToggleEvent(event._id)} sx={{ p: 0.25 }}>
                                        {event.completed
                                          ? <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
                                          : <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: "text.disabled" }} />}
                                      </IconButton>
                                      <IconButton size="small" onClick={() => handleEditEvent(event)} sx={{ p: 0.25 }}>
                                        <EditIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                      </IconButton>
                                      <IconButton size="small" onClick={() => handleDeleteEvent(event._id)} sx={{ p: 0.25 }}>
                                        <DeleteIcon sx={{ fontSize: 14, color: "error.main" }} />
                                      </IconButton>
                                    </Stack>
                                  )}
                                </Stack>

                                {event.time && (
                                  <Typography variant="caption" color="text.secondary">{event.time}</Typography>
                                )}

                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                                  {event.duration && <Chip label={event.duration} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600 }} />}
                                  <Chip label={event.type} size="small" variant="outlined"
                                    sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600, borderColor: event.color || getTypeColor(event.type), color: event.color || getTypeColor(event.type) }} />
                                  {event.completed && <Chip label="Done" size="small" color="success" sx={{ height: 20, fontSize: "0.6rem" }} />}
                                </Stack>

                                {/* Source indicator */}
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                                  {groupName ? (
                                    <Chip icon={<GroupsIcon sx={{ fontSize: "12px !important" }} />} label={groupName}
                                      size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                  ) : (
                                    <Chip icon={<PersonIcon sx={{ fontSize: "12px !important" }} />} label="Personal"
                                      size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                  )}
                                  {!isCreator && creatorName && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
                                      by {creatorName}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                          </Box>
                        </Fade>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Event type legend */}
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
          {EVENT_TYPES.map((t) => (
            <Chip key={t.value} icon={<FiberManualRecordIcon sx={{ fontSize: "8px !important", color: `${t.color} !important` }} />}
              label={t.label} size="small" variant="outlined" sx={{ height: 24, fontSize: "0.7rem" }} />
          ))}
        </Stack>
      </Stack>

      {/* Event Form Modal */}
      <EventFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditEvent(null); }}
        onSave={handleSaveEvent}
        event={editEvent}
        groups={adminGroups}
        loading={saving}
      />
    </Container>
  );
}
