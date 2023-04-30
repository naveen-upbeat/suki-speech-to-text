export const WEB_SOCKET_BATCH_PATH = '/ws/batch';
export const WEB_SOCKET_STREAM_PATH = '/ws/stream';

const SHOULD_STREAM_START = 'shouldStartRecording';
const SHOULD_STREAM_STOP = 'isRecordingStopped';

const SAMPLE_RATE_FOR_RECOGNIZE = 16000;
const AUDIO_CHANNEL_COUNT = 1;

export function sukiApiConfigs(): string {
  return 'suki-api-configs';
}

export const getMessageKeyForStreamStart = () => SHOULD_STREAM_START;
export const getMessageKeyForStreamStop = () => SHOULD_STREAM_STOP;
export const getSampleRateForRecognize = () => SAMPLE_RATE_FOR_RECOGNIZE;
export const getAudioChannelCount = () => AUDIO_CHANNEL_COUNT;

export type sttResponse = {
  data: {
    results: sstResultObj[];
  };
};

export type sstResultObj = {
  alternatives: sstAlternativeTranscript[];
};

export type sstAlternativeTranscript = {
  transcript: string;
};
