import { createSlice } from "@reduxjs/toolkit";
import { fetchUserRatings, fetchMyRating, submitRating, deleteRating } from "./thunks/ratingThunks";

const initialState = {
  ratings: [],
  myRating: null,
  total: 0,
  loading: false,
  submitting: false,
  error: null,
};

const ratingSlice = createSlice({
  name: "rating",
  initialState,
  reducers: {
    clearRatings: (state) => {
      state.ratings = [];
      state.myRating = null;
      state.total = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserRatings
      .addCase(fetchUserRatings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.ratings = action.payload.ratings;
        state.total = action.payload.total;
      })
      .addCase(fetchUserRatings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // fetchMyRating
      .addCase(fetchMyRating.fulfilled, (state, action) => { state.myRating = action.payload; })

      // submitRating
      .addCase(submitRating.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.submitting = false;
        state.myRating = action.payload;
        // Update the rating in the list if it exists, otherwise prepend
        const idx = state.ratings.findIndex((r) => r._id === action.payload._id);
        if (idx >= 0) {
          state.ratings[idx] = action.payload;
        } else {
          state.ratings.unshift(action.payload);
          state.total += 1;
        }
      })
      .addCase(submitRating.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      // deleteRating
      .addCase(deleteRating.fulfilled, (state, action) => {
        state.ratings = state.ratings.filter((r) => r._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.myRating?._id === action.payload) state.myRating = null;
      });
  },
});

export const { clearRatings } = ratingSlice.actions;
export default ratingSlice.reducer;
