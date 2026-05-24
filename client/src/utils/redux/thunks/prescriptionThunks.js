/**
 * Prescription Async Thunks
 * Handles all prescription-related API calls
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/**
 * Fetch all prescriptions
 */
export const fetchPrescriptions = createAsyncThunk(
  "prescription/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/prescriptions`);

      const data = response.data?.prescriptions || response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch prescriptions",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { prescription } = getState();
      if (prescription?.prescriptions?.length > 0 && !prescription.error) return false;
    },
  },
);

/**
 * Fetch all prescriptions (admin only — all users)
 */
export const fetchAllPrescriptions = createAsyncThunk(
  "prescription/fetchAllAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/prescriptions?all=true&limit=100`);
      const data = response.data?.prescriptions || response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch all prescriptions",
      );
    }
  },
);

/**
 * Fetch prescriptions by user ID
 */
export const fetchPrescriptionsByUser = createAsyncThunk(
  "prescription/fetchByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/prescriptions/user/${userId}`);

      const data = response.data?.prescriptions || response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user prescriptions",
      );
    }
  },
);

/**
 * Fetch a specific prescription by ID
 */
export const fetchPrescriptionById = createAsyncThunk(
  "prescription/fetchById",
  async (prescriptionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/prescriptions/${prescriptionId}`);

      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch prescription",
      );
    }
  },
);

/**
 * Create a new prescription
 */
export const createPrescription = createAsyncThunk(
  "prescription/create",
  async (prescriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/prescriptions`, prescriptionData);

      const data = response.data.prescription || response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create prescription",
      );
    }
  },
);

/**
 * Update an existing prescription
 */
export const updatePrescription = createAsyncThunk(
  "prescription/update",
  async ({ prescriptionId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/prescriptions/${prescriptionId}`, updates);

      const data = response.data.prescription || response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update prescription",
      );
    }
  },
);

/**
 * Delete a prescription
 */
export const deletePrescription = createAsyncThunk(
  "prescription/delete",
  async (prescriptionId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/prescriptions/${prescriptionId}`);

      return cropId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete prescription",
      );
    }
  },
);
