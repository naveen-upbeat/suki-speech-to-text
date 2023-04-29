import { createSlice } from '@reduxjs/toolkit';

const batchRecordingSlice = createSlice({
  name: 'batchRecording',
  initialState: {
    isCurrentRecordingMarkedForSplit: null,
    capturedWaveBlobs: [],
    transcriptionsReceived: [],
  },
  reducers: {
    markCurrentRecordingForSplit: (state, action) => {
      state.isCurrentRecordingMarkedForSplit = action.payload;
    },
    insertWaveBlob: (state, action) => {
      const waveBlob = action.payload;
      state.capturedWaveBlobs.push(waveBlob as never);
    },
    insertTranscription: (state, action) => {
      const transcription = action.payload;
      state.transcriptionsReceived.push(transcription as never);
    },
  },
});

export default batchRecordingSlice.reducer;
export const {
  markCurrentRecordingForSplit,
  insertWaveBlob,
  insertTranscription,
} = batchRecordingSlice.actions;
