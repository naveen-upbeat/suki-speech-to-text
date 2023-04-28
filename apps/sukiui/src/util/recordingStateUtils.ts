import { StringMap } from '../@types';

export const RECORDING_STATUS: StringMap = {
  recording: 'RECORDING',
  inactive: 'INACTIVE',
};

export const RECORD_MODE: StringMap = {
  batch: 'batch',
  stream: 'stream',
  longrunning: 'longrunning',
};

const isRecording = (status: string) => status === RECORDING_STATUS.recording;

const isRecordModeBatch = (transcribeMode: string) =>
  transcribeMode === RECORD_MODE.batch;

export { isRecording, isRecordModeBatch };
