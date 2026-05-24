import { createSlice } from "@reduxjs/toolkit";
import { fetchMyAppointments, bookAppointment, updateAppointmentStatus } from "./thunks/appointmentThunks";

const initialState = {
  appointments: [],
  total: 0,
  loading: false,
  submitting: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    clearAppointmentError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMyAppointments.fulfilled, (s, a) => {
        s.loading = false;
        s.appointments = a.payload.appointments;
        s.total = a.payload.total;
      })
      .addCase(fetchMyAppointments.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(bookAppointment.pending,  (s) => { s.submitting = true; s.error = null; })
      .addCase(bookAppointment.fulfilled, (s, a) => {
        s.submitting = false;
        s.appointments = [a.payload, ...s.appointments];
        s.total += 1;
      })
      .addCase(bookAppointment.rejected, (s, a) => {
        s.submitting = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(updateAppointmentStatus.fulfilled, (s, a) => {
        const idx = s.appointments.findIndex((ap) => ap._id === a.payload._id);
        if (idx !== -1) s.appointments[idx] = a.payload;
      });
  },
});

export const { clearAppointmentError } = appointmentSlice.actions;
export default appointmentSlice.reducer;
