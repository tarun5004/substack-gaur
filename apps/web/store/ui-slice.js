import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  commandOpen: false,
};
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCommandOpen(state, action) {
      state.commandOpen = action.payload;
    },
  },
});
export const { setCommandOpen } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
