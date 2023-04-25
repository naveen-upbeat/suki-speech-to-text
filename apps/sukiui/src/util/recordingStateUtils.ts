export const RECORDING_STATUS = {
  recording: 'RECORDING',
  inactive: 'INACTIVE',
};

const isRecording = (status: string) => status === RECORDING_STATUS.recording;

export { isRecording };
