import { createSlice } from "@reduxjs/toolkit";
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "./thunks/friendThunks";

const friendSlice = createSlice({
  name: "friend",
  initialState: {
    friends: [],
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {
    /**
     * Handle real-time friend request received via Socket.IO
     */
    addIncomingRequest: (state, action) => {
      const exists = state.requests.find(
        (r) => String(r.sender?._id) === String(action.payload.from?._id),
      );
      if (!exists) {
        state.requests.push({
          sender: action.payload.from,
          status: "pending",
        });
      }
    },
    /**
     * Handle real-time friend acceptance via Socket.IO
     */
    friendAccepted: (state, action) => {
      const user = action.payload.by;
      if (
        user &&
        !state.friends.find((f) => String(f._id) === String(user._id))
      ) {
        state.friends.push(user);
      }
    },
    clearFriendError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch friends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch requests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Send request
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Accept request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const { senderId } = action.payload;
        // Remove from requests
        state.requests = state.requests.filter(
          (r) => String(r.sender?._id || r.sender) !== senderId,
        );
        // Note: friend list will be refreshed from API
      })

      // Decline request
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        const { senderId } = action.payload;
        state.requests = state.requests.filter(
          (r) => String(r.sender?._id || r.sender) !== senderId,
        );
      })

      // Remove friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          (f) => String(f._id) !== String(action.payload),
        );
      });
  },
});

export const { addIncomingRequest, friendAccepted, clearFriendError } =
  friendSlice.actions;
export default friendSlice.reducer;
