import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCurrentUser,
  fetchUserByEmail,
  searchUsers,
  updateUserProfile,
  signupUser,
  setUserOffline,
  fetchAllUsers,
} from "./thunks/userThunks";

const initialState = {
  currentUser: null,
  /** Raw API response from GET /api/users — all users in the system (used by fetchAllUsers thunk) */
  allUsers: [],
  /** Filtered contact list — allUsers minus currentUser (used by ChatWindow for chat list display) */
  usersData: [],
  searchResults: [],
  loading: false,
  error: null,
  success: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    // Merged from usersSlice
    setUsersData: (state, action) => {
      state.usersData = action.payload;
    },
    updateUsers: (state, action) => {
      const { userId, updates } = action.payload;
      const userIndex = state.usersData.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        state.usersData[userIndex] = {
          ...state.usersData[userIndex],
          ...updates,
        };
      }
    },
    updateUsersStatus: (state, action) => {
      const { userId, status, lastSeen } = action.payload;
      const userIndex = state.usersData.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        state.usersData[userIndex].status = status;
        state.usersData[userIndex].lastSeen =
          status === "online" ? null : lastSeen;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentUser = null;
      });

    // Fetch User by Email
    builder
      .addCase(fetchUserByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserByEmail.fulfilled, (state, action) => {
        state.loading = false;
        // Don't override currentUser, just add to search results
        state.success = true;
      })
      .addCase(fetchUserByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.searchResults = [];
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Signup User
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Set User Offline
    builder
      .addCase(setUserOffline.pending, (state) => {
        // No loading indicator needed for sendBeacon
      })
      .addCase(setUserOffline.fulfilled, (state, action) => {
        if (state.currentUser && action.payload) {
          state.currentUser.status = "offline";
        }
      })
      .addCase(setUserOffline.rejected, (state) => {
        // Silent fail for sendBeacon
      });

    // Fetch All Users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCurrentUser,
  clearError,
  clearSuccess,
  setCurrentUser,
  setUsersData,
  updateUsers,
  updateUsersStatus,
} = userSlice.actions;
export default userSlice.reducer;
