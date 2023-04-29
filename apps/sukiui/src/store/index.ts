import { configureStore } from '@reduxjs/toolkit';
import microPhoneReducer from './microPhoneSlice';
import transcribModeReducer from './transcribeModeSlice';
import debugDrawReducer from './debugDrawSlice';
import batchRecordingReducer from './batchRecordingSlice';

export const store = configureStore({
  reducer: {
    microPhone: microPhoneReducer,
    transcribeMode: transcribModeReducer,
    debugDrawer: debugDrawReducer,
    batchRecording: batchRecordingReducer,
  },
});

export type MicroPhoneState = {
  isMicroPhonePermissionGranted: boolean;
  rawMicroPhoneStream: any;
};
