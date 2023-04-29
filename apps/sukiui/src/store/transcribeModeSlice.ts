import { createSlice } from '@reduxjs/toolkit';
import { RECORD_MODE } from '../util/recordingStateUtils';

const transcribeModeSlice = createSlice({
  name: 'transcribeMode',
  initialState: {
    transcribeMode: RECORD_MODE.batch,
  },
  reducers: {
    setTranscribeMode: (state, action) => {
      state.transcribeMode = action.payload;
    },
  },
});

export default transcribeModeSlice.reducer;
export const { setTranscribeMode } = transcribeModeSlice.actions;
