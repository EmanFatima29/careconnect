import { createSlice } from "@reduxjs/toolkit";
import {
  fetchGroups,
  fetchGroupById,
  createGroup,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  fetchNearbyUsers,
  updateUserLocation,
  fetchLocationHistory,
} from "./thunks/locationGroupThunks";

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
    userLocation: {
      latitude: null,
      longitude: null,
      timestamp: null,
      accuracy: null,
    },
    nearbyUsers: [],
    locationHistory: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    selectGroup: (state, action) => {
      state.selectedGroup = action.payload;
    },
    addGroup: (state, action) => {
      state.groups.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Groups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
        state.success = true;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Group by ID
    builder
      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedGroup = action.payload;
        state.success = true;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Group
    builder
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
        state.selectedGroup = action.payload;
        state.success = true;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Group
    builder
      .addCase(updateGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.groups.findIndex(
          (g) => g._id === action.payload._id,
        );
        if (index >= 0) {
          state.groups[index] = action.payload;
        }
        if (state.selectedGroup?._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
        state.success = true;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Group Member
    builder
      .addCase(addGroupMember.fulfilled, (state, action) => {
        const group = state.groups.find(
          (g) => g._id === action.payload.groupId,
        );
        if (group && group.members) {
          group.members.push(action.payload.memberId);
        }
        state.success = true;
      })
      .addCase(addGroupMember.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Remove Group Member
    builder
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const group = state.groups.find(
          (g) => g._id === action.payload.groupId,
        );
        if (group && group.members) {
          group.members = group.members.filter(
            (m) => m !== action.payload.memberId,
          );
        }
        state.success = true;
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Group
    builder
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = state.groups.filter((g) => g._id !== action.payload);
        if (state.selectedGroup?._id === action.payload) {
          state.selectedGroup = null;
        }
        state.success = true;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Nearby Users
    builder
      .addCase(fetchNearbyUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyUsers = action.payload;
      })
      .addCase(fetchNearbyUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User Location
    builder
      .addCase(updateUserLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.userLocation = {
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
          timestamp: action.payload.timestamp || new Date(),
          accuracy: action.payload.accuracy,
        };
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Location History
    builder
      .addCase(fetchLocationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.locationHistory = action.payload;
      })
      .addCase(fetchLocationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setGroups, selectGroup, addGroup, clearError } =
  groupSlice.actions;
export default groupSlice.reducer;
