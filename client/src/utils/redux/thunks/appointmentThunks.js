import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  apiBookAppointment,
  apiGetMyAppointments,
  apiUpdateAppointmentStatus,
} from "@/lib/appointmentApi";

export const fetchMyAppointments = createAsyncThunk(
  "appointment/fetchMy",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyAppointments(params);
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const bookAppointment = createAsyncThunk(
  "appointment/book",
  async (payload, { rejectWithValue }) => {
    try {
      return await apiBookAppointment(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const updateAppointmentStatus = createAsyncThunk(
  "appointment/updateStatus",
  async ({ id, status, cancelReason }, { rejectWithValue }) => {
    try {
      return await apiUpdateAppointmentStatus(id, { status, cancelReason });
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);
