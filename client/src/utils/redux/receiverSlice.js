import { createSlice } from "@reduxjs/toolkit";

const receiverSlice = createSlice({
  name: "receiver",
  initialState: {
    currentReceiver: "",
  },
  reducers: {
    setReceiver: (state, action) => {
      state.currentReceiver = action.payload;
    },
    removeReceiver: (state) => {
      state.currentReceiver = "";
    },
  },
});
export const { setReceiver, removeReceiver } = receiverSlice.actions;
export default receiverSlice.reducer;
