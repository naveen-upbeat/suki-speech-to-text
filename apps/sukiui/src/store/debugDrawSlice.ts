import { createSlice } from '@reduxjs/toolkit';

const debugDrawerSlice = createSlice({
  name: 'debugDrawer',
  initialState: {
    isDebugDrawerOpen: false,
  },
  reducers: {
    setDebugDrawerOpen: (state, action) => {
      state.isDebugDrawerOpen = action.payload;
    },
  },
});

export default debugDrawerSlice.reducer;
export const { setDebugDrawerOpen } = debugDrawerSlice.actions;
