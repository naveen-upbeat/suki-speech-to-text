import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const microPhoneSlice = createSlice({
  name: 'microPhone',
  initialState: {
    isMicroPhonePermissionGranted: false,
    rawMicroPhoneStream: null,
    isCurrentlyRecording: false,
    audioAnalyzerData: null,
  },
  reducers: {
    setMicrophonePermission: (state, action) => {
      state.isMicroPhonePermissionGranted = action.payload;
    },
    setRecording: (state, action) => {
      state.isCurrentlyRecording = action.payload;
    },
    setAudioAnalyzerData: (state, action) => {
      state.audioAnalyzerData = action.payload;
    },
  },
});

export default microPhoneSlice.reducer;

export const { setMicrophonePermission, setRecording, setAudioAnalyzerData } =
  microPhoneSlice.actions;
