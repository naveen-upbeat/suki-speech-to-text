import { Button } from '@mui/material';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import { ReactEventHandler } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setMicrophonePermission,
  setAudioAnalyzerData,
} from '../store/microPhoneSlice';
import Recorder from '../util/recorderUtils';
import { resolveCurrentEnvironments } from '../util/environmentUtils';
import { ConsoleLogger } from '../util/loggerUtil';
import { RECORD_MODE } from '../util/recordingStateUtils';
import {
  getAudioChannelCount,
  getSampleRateForRecognize,
} from '@suki-speech-to-text/suki-api-configs';

export type AskMicPermissionsProps = {
  refs: {
    audioContextRef: any;
    recorderRef: any;
    streamAudioContextRef: any;
    pcmWorkerRef: any;
  };
};

const SAMPLE_RATE = getSampleRateForRecognize();
const AUDIO_CHANNEL_COUNT = getAudioChannelCount();

const currentEnvironments = resolveCurrentEnvironments();

const appDebugLogger = new ConsoleLogger(currentEnvironments.isDebugEnabled);

const AskMicPermissionsButton = ({ refs }: AskMicPermissionsProps) => {
  const { audioContextRef, recorderRef, streamAudioContextRef, pcmWorkerRef } =
    refs;
  const dispatch = useDispatch();
  const { isMicroPhonePermissionGranted } = useSelector(
    (state: any) => state.microPhone
  );
  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);
  const batchModeMicPermissionHandler = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: 'default',
            sampleRate: SAMPLE_RATE,
            sampleSize: 16,
            channelCount: AUDIO_CHANNEL_COUNT,
          },
          video: false,
        });
        dispatch(setMicrophonePermission(true));
        if (!audioContextRef.current && !recorderRef.current) {
          audioContextRef.current = new window.AudioContext({
            sampleRate: SAMPLE_RATE,
          });
          recorderRef.current = new Recorder(audioContextRef.current, {
            numChannels: AUDIO_CHANNEL_COUNT,
            sampleRate: SAMPLE_RATE,
            // An array of 255 Numbers
            // You can use this to visualize the audio stream
            // If you use react, check out react-wave-stream
            onAnalysed: (data: any) => {
              dispatch(setAudioAnalyzerData(data));
            },
          });

          recorderRef.current?.init(streamData);
        }
      } catch (err: unknown) {
        dispatch(setMicrophonePermission(false));
        if (typeof err === 'object' && err !== null) {
          appDebugLogger.error('message' in err ? err.message : '');
        } else {
          appDebugLogger.error(err);
        }
      }
    } else {
      appDebugLogger.info(
        'The MediaRecorder API is not supported in your browser.'
      );
    }
  };

  const streamModeMicPermissionHandler = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamRecognizeMedia = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: 'default',
            sampleRate: SAMPLE_RATE,
            sampleSize: 16,
            channelCount: AUDIO_CHANNEL_COUNT,
          },
          video: false,
        });
        dispatch(setMicrophonePermission(true));
        /**
         * start- Todo: Optimize the duplicated code for analyzer data
         */
        if (!audioContextRef.current && !recorderRef.current) {
          audioContextRef.current = new window.AudioContext({
            sampleRate: SAMPLE_RATE,
          });
          recorderRef.current = new Recorder(audioContextRef.current, {
            numChannels: AUDIO_CHANNEL_COUNT,
            sampleRate: SAMPLE_RATE,
            // An array of 255 Numbers
            // You can use this to visualize the audio stream
            // If you use react, check out react-wave-stream
            onAnalysed: (data: any) => {
              dispatch(setAudioAnalyzerData(data));
              // setAudioDataForAnalyzer(data);
            },
          });

          recorderRef.current?.init(streamRecognizeMedia);
        }
        // Todo - End
        if (!streamAudioContextRef.current) {
          streamAudioContextRef.current = new window.AudioContext({
            sampleRate: SAMPLE_RATE,
          });
          await streamAudioContextRef.current.audioWorklet.addModule(
            '/audioWorker.js'
          );

          pcmWorkerRef.current = new AudioWorkletNode(
            streamAudioContextRef.current,
            'audio-pcm-worker',
            {
              outputChannelCount: [AUDIO_CHANNEL_COUNT],
            }
          );

          const webAudioSource: MediaStreamAudioSourceNode =
            streamAudioContextRef.current.createMediaStreamSource(
              streamRecognizeMedia
            );
          webAudioSource.connect(pcmWorkerRef.current);
          // webAudioSourceRef.current = webAudioSource;
        }
      } catch (err: unknown) {
        dispatch(setMicrophonePermission(false));
        if (typeof err === 'object' && err !== null) {
          appDebugLogger.error('message' in err ? err.message : '');
        } else {
          appDebugLogger.error(err);
        }
      }
    } else {
      appDebugLogger.info(
        'The MediaRecorder API is not supported in your browser.'
      );
    }
  };

  const onMicPermissionClickHandler = async () => {
    if (transcribeMode === RECORD_MODE.batch) {
      batchModeMicPermissionHandler();
    } else if (transcribeMode === RECORD_MODE.stream) {
      streamModeMicPermissionHandler();
    }
  };
  if (!isMicroPhonePermissionGranted) {
    return (
      <Button
        onMouseOver={onMicPermissionClickHandler}
        variant="contained"
        sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}
        onClick={onMicPermissionClickHandler}
      >
        Ask Microphone Permission <SettingsVoiceIcon />
      </Button>
    );
  } else {
    return <> </>;
  }
};

export default AskMicPermissionsButton;
