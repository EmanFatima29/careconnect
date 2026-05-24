// store/layoutSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  leftComponent: { name: "chat", props: {} },
  rightComponent: { name: "map", props: {} },
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setLeftComponent: (state, action) => {
      const { name, props = {} } = action.payload;
      state.leftComponent = { name, props };
    },
    setRightComponent: (state, action) => {
      const { name, props = {} } = action.payload;
      state.rightComponent = { name, props };
    },
  },
});

export const { setLeftComponent, setRightComponent } = layoutSlice.actions;
export default layoutSlice.reducer;
