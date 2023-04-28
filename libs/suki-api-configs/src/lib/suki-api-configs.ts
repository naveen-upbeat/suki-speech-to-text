export const WEB_SOCKET_BATCH_PATH = '/ws/batch';
export const WEB_SOCKET_STREAM_PATH = '/ws/stream';

const SHOULD_STREAM_START = 'shouldStartRecording';
const SHOULD_STREAM_STOP = 'isRecordingStopped';

export function sukiApiConfigs(): string {
  return 'suki-api-configs';
}

export const getMessageKeyForStreamStart = () => SHOULD_STREAM_START;
export const getMessageKeyForStreamStop = () => SHOULD_STREAM_STOP;

export type sttResponse = {
  data: {
    results: sstResultObj[];
  };
};

export type sstResultObj = {
  alternatives: sstAlternativeTranscript[];
};

export type sstAlternativeTranscript = {
  transcription: string;
};
