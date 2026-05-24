import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSession } from "next-auth/react";
import {
  apiSubmitRating,
  apiGetUserRatings,
  apiGetMyRating,
  apiDeleteRating,
} from "@/lib/ratingApi";

export const fetchUserRatings = createAsyncThunk(
  "rating/fetchUserRatings",
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await apiGetUserRatings(userId, { page, limit });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const fetchMyRating = createAsyncThunk(
  "rating/fetchMyRating",
  async (userId, { rejectWithValue }) => {
    try {
      const session = await getSession();
      const res = await apiGetMyRating(userId, session);
      return res.data.rating;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const submitRating = createAsyncThunk(
  "rating/submitRating",
  async ({ ratedUserId, score, comment }, { rejectWithValue }) => {
    try {
      const session = await getSession();
      const res = await apiSubmitRating({ ratedUserId, score, comment }, session);
      return res.data.rating;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const deleteRating = createAsyncThunk(
  "rating/deleteRating",
  async (ratingId, { rejectWithValue }) => {
    try {
      const session = await getSession();
      await apiDeleteRating(ratingId, session);
      return ratingId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);
