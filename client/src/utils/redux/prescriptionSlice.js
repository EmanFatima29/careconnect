/**
 * Prescription Slice
 * Manages prescription state — list, single prescription, loading and errors.
 */

import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPrescriptions,
  fetchAllPrescriptions,
  fetchPrescriptionsByUser,
  fetchPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "./thunks/prescriptionThunks";

const prescriptionSlice = createSlice({
  name: "prescription",
  initialState: {
    prescriptions: [],
    currentPrescription: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    setCurrentPrescription: (state, action) => {
      state.currentPrescription = action.payload;
    },
    clearCurrentPrescription: (state) => {
      state.currentPrescription = null;
    },
    clearPrescriptionError: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch all prescriptions ─────────────────────────────────
    builder
      .addCase(fetchPrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload;
        state.success = true;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.prescriptions = [];
      });

    // ── Fetch all prescriptions (admin) ──────────────────────────
    builder
      .addCase(fetchAllPrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload;
        state.success = true;
      })
      .addCase(fetchAllPrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Fetch prescriptions by user ─────────────────────────────
    builder
      .addCase(fetchPrescriptionsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptionsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload;
        state.success = true;
      })
      .addCase(fetchPrescriptionsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Fetch single prescription ───────────────────────────────
    builder
      .addCase(fetchPrescriptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPrescription = action.payload;
        state.success = true;
      })
      .addCase(fetchPrescriptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Create prescription ─────────────────────────────────────
    builder
      .addCase(createPrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPrescription.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions.push(action.payload);
        state.success = true;
      })
      .addCase(createPrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Update prescription ─────────────────────────────────────
    builder
      .addCase(updatePrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrescription.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.prescriptions.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.prescriptions[idx] = action.payload;
        state.success = true;
      })
      .addCase(updatePrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Delete prescription ─────────────────────────────────────
    builder
      .addCase(deletePrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePrescription.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = state.prescriptions.filter((c) => c._id !== action.payload);
        state.success = true;
      })
      .addCase(deletePrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPrescription, clearCurrentPrescription, clearPrescriptionError } =
  prescriptionSlice.actions;
export default prescriptionSlice.reducer;
