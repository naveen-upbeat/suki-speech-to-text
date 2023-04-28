import AppBar from '@mui/material/AppBar';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuIcon from '@mui/icons-material/Menu';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import Recorder from '../util/recorderUtils';
import ListeningModal from '../components/ListeningModal';
import AudioClips from '../components/AudioClips';
import SukiLogo from '../assets/logo.png';
import { resolveCurrentEnvironments } from '../util/environmentUtils';
import { ConsoleLogger } from '../util/loggerUtil';
import AskMicPermissionsButton from '../components/AskMicPermissionButton';
import MicRecordingStartStopButtons from '../components/MicRecordingStartStopButtons';
import {
  alignJustifyItemsCenter,
  allCenter,
  displayFlexRow,
  flexColumn,
  whiteBackgroundDarkText,
} from '../util/styleUtils';
import AppFooter from '../components/AppFooter';
import DebugDrawerBottom from '../components/DebugDrawerBottom';
import TranscriptionTextField from '../components/TranscriptionTextField';
import {
  RECORDING_STATUS,
  RECORD_MODE,
  isRecording,
} from '../util/recordingStateUtils';
import useSmartSplitForRecording from '../hooks/useSmartSplitForRecording';
import { getWebsocketAddress } from '../util/urlUtils';

const SAMPLE_RATE = 16000;

const AUTO_STOP_RECORDING_TIMEOUT = 12000; // auto stop recording in 10 seconds

const currentEnvironments = resolveCurrentEnvironments();

const appDebugLogger = new ConsoleLogger(currentEnvironments.isDebugEnabled);

export function App() {
  const [transcribeMode, setTranscribeMode] = useState(RECORD_MODE.batch);
  const [hasPermissionForMic, setMicrophonePermission] = useState(false);
  const [audioDataForAnalyzer, setAudioDataForAnalyzer] = useState({
    data: [],
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamAudioContextRef = useRef<AudioContext | null>(null);
  const webAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const pcmWorkerRef = useRef<AudioWorkletNode | null>(null);

  const [recordingStatus, setRecordingStatus] = useState(
    RECORDING_STATUS.inactive
  );
  const [isCurrentRecordingMarkedForSplit, markCurrentRecordingForSplit] =
    useState<boolean | null>(null);

  const [autoStopRecording, setAutoStopRecording] = useState<number>(
    AUTO_STOP_RECORDING_TIMEOUT / 1000
  );

  const socketConnectionRef = useRef<WebSocket | null>(null);
  const streamSocketConnectionRef = useRef<WebSocket | null>(null);
  const socketDataReceivedRef = useRef<string[]>([]);
  const streamSocketDataReceivedRef = useRef<string[]>([]);
  const socketMessageSendQueue = useRef<Blob[]>([]);
  const [socketMessageSendQueueState, setSocketSendQueue] = useState<Blob[]>(
    []
  );
  const socketSendCounter = useRef<number>(0);

  const [isDebugDrawerOpen, setDebugDrawOpen] = useState(false);

  const batchModeMicPermissionHandler = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: 'default',
            sampleRate: SAMPLE_RATE,
            sampleSize: 16,
            channelCount: 1,
          },
          video: false,
        });
        setMicrophonePermission(true);
        audioContextRef.current = new window.AudioContext({
          sampleRate: SAMPLE_RATE,
        });
        recorderRef.current = new Recorder(audioContextRef.current, {
          numChannels: 1,
          sampleRate: SAMPLE_RATE,
          // An array of 255 Numbers
          // You can use this to visualize the audio stream
          // If you use react, check out react-wave-stream
          onAnalysed: (data: any) => {
            setAudioDataForAnalyzer(data);
          },
        });

        recorderRef.current?.init(streamData);
      } catch (err: unknown) {
        setMicrophonePermission(false);
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
            channelCount: 1,
          },
          video: false,
        });
        setMicrophonePermission(true);
        /**
         * start- Todo: Optimize the duplicated code for analyzer data
         */
        audioContextRef.current = new window.AudioContext({
          sampleRate: SAMPLE_RATE,
        });
        recorderRef.current = new Recorder(audioContextRef.current, {
          numChannels: 1,
          sampleRate: SAMPLE_RATE,
          // An array of 255 Numbers
          // You can use this to visualize the audio stream
          // If you use react, check out react-wave-stream
          onAnalysed: (data: any) => {
            setAudioDataForAnalyzer(data);
          },
        });

        recorderRef.current?.init(streamRecognizeMedia);
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
              outputChannelCount: [1],
            }
          );

          const webAudioSource: MediaStreamAudioSourceNode =
            streamAudioContextRef.current.createMediaStreamSource(
              streamRecognizeMedia
            );
          webAudioSource.connect(pcmWorkerRef.current);
          webAudioSourceRef.current = webAudioSource;
        }
      } catch (err: unknown) {
        setMicrophonePermission(false);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const splitRecordingForBatchProcess = () => {
    markCurrentRecordingForSplit(true);
  };

  const postSplitStartNewRecording = () => {
    markCurrentRecordingForSplit(false);
  };

  const batchRecordingStart = useCallback(() => {
    clearMessages();
    setRecordingStatus((_currentStatus) => RECORDING_STATUS.recording);
    const recorder = recorderRef.current as Recorder;

    recorder
      .start()
      .then(() => {
        // instead of fixed 4 second blocks, now split the recording based on speech pauses
        // setTimeout(() => {
        //   appDebugLogger.log('Splitting first recording:');
        //   stopRecordingProcess();
        // }, 4000);
      })
      .catch((err: any) => {
        appDebugLogger.log('Error recording', err);
      });
  }, [recordingStatus, setRecordingStatus]);

  const onMessageHandler = (evt: any) => {
    const streamSocket = streamSocketConnectionRef.current as WebSocket;
    streamSocket.send(evt.data);
  };

  const streamRecordingStart = useCallback(() => {
    //streamModeMicPermissionHandler();
    clearMessages();
    setRecordingStatus((_currentStatus) => RECORDING_STATUS.recording);
    const streamSocketRef = streamSocketConnectionRef.current as WebSocket;
    streamSocketRef.send(JSON.stringify({ shouldStartRecording: true }));

    const pcmWorker = pcmWorkerRef.current as AudioWorkletNode;

    if (pcmWorker) {
      if (!pcmWorker.port?.onmessage) {
        console.log('attaching message handler');
        // pcmWorker.port.removeEventListener('message', onMessageHandler, true);
        // pcmWorker.port.addEventListener('message', onMessageHandler, true);
        // pcmWorker.port.addEventListener('messageerror', (e) => {
        //   console.log('port error message', e);
        // });
        pcmWorker.port.onmessage = (e) => {
          // console.log('Message from port on pcmWorket', e.data);
          onMessageHandler(e);
        };
      }
      // console.log('Starting pcm worker port');
      pcmWorker.port.postMessage(JSON.stringify({ shouldOpenPort: true }));
      pcmWorker.port?.start();
    } else {
      console.log('PCM worker is null');
    }
  }, [recordingStatus, setRecordingStatus]);

  const startRecording = useCallback(() => {
    if (transcribeMode === RECORD_MODE.batch) {
      batchRecordingStart();
    } else if (transcribeMode === RECORD_MODE.stream) {
      streamRecordingStart();
    }
  }, [recordingStatus, setRecordingStatus, transcribeMode]);

  const stopBatchRecording = () => {
    setRecordingStatus(RECORDING_STATUS.inactive);
  };

  const stopStreamRecording = async () => {
    const pcmWorker = pcmWorkerRef.current as AudioWorkletNode;
    console.log('PCM worker', pcmWorker.port?.close);
    await pcmWorker.port.postMessage(JSON.stringify({ shouldClosePort: true }));
    // await pcmWorker.port.close();
    //await webAudioSourceRef.current?.disconnect();
    setRecordingStatus(RECORDING_STATUS.inactive);
    const streamSocketRef = streamSocketConnectionRef.current as WebSocket;
    streamSocketRef.send(JSON.stringify({ isRecordingStopped: true }));
  };

  const stopRecording = () => {
    if (transcribeMode === RECORD_MODE.batch) {
      stopBatchRecording();
    } else if (transcribeMode === RECORD_MODE.stream) {
      stopStreamRecording();
    }
  };

  useLayoutEffect(() => {
    const socket = new WebSocket(getWebsocketAddress(RECORD_MODE.batch));
    const streamSocket = new WebSocket(getWebsocketAddress(RECORD_MODE.stream));

    socket.onmessage = function (e) {
      const latestTranscriptionData = e.data
        ? JSON.parse(e.data.toString())?.transcription
        : '';
      appDebugLogger.log(
        'Existing data received from socket',
        socketDataReceivedRef.current.join(' --- '),
        'New data: ',
        latestTranscriptionData
      );
      socketDataReceivedRef.current.push(latestTranscriptionData);

      appDebugLogger.log(
        'On socket message received, checking Socket Send Queue length: ',
        socketMessageSendQueue.current?.length
      );
      const socketSendQueueObj = socketMessageSendQueue.current;
      if (socketSendQueueObj.length > 0) {
        const nextAvailableBlob = socketSendQueueObj.splice(0, 1) as Blob[];
        appDebugLogger.log('Sending next available blob to socket');
        socket.send(nextAvailableBlob.pop() as Blob);
        socketSendCounter.current++;
      }
    };

    socket.onopen = function () {
      socket.send(JSON.stringify({ hey: 'hello' }));
    };

    streamSocket.onmessage = function (e) {
      const latestTranscriptionData = e.data
        ? JSON.parse(e.data)?.transcription
        : '';
      console.log('Stream transcription:', latestTranscriptionData);
      const streamSocketDataReceived =
        streamSocketDataReceivedRef.current as string[];
      streamSocketDataReceived.push(latestTranscriptionData);
    };

    socketConnectionRef.current = socket;
    streamSocketConnectionRef.current = streamSocket;
  }, [audioContextRef]);

  useSmartSplitForRecording({
    recordingStatus,
    isCurrentRecordingMarkedForSplit,
    audioDataForAnalyzer,
    splitRecordingForBatchProcess,
    appDebugLogger,
    transcribeMode,
  });

  useEffect(() => {
    appDebugLogger.log(
      `recording status: ${recordingStatus}, recording batching: ${isCurrentRecordingMarkedForSplit}, Socket Data Received: ${socketDataReceivedRef.current.join(
        ' '
      )}`
    );

    if (isCurrentRecordingMarkedForSplit) {
      appDebugLogger.log(
        'stopping recording processess at',
        new Date().getSeconds()
      );
      const recorder = recorderRef.current as Recorder;
      recorder.stop().then(({ blob, buffer }: any) => {
        const socketObj = socketConnectionRef.current as WebSocket;
        const socketSendQueueObj = socketMessageSendQueue.current as Blob[];
        appDebugLogger.log('Trying to send message blob: ', blob);
        setSocketSendQueue([...socketMessageSendQueueState, blob]);
        socketSendQueueObj.push(blob);
        appDebugLogger.log(
          'Message queue length in Ref and State:',
          socketSendQueueObj.length,
          socketMessageSendQueueState.length
        );

        if (isRecording(recordingStatus)) {
          postSplitStartNewRecording();
        }

        if (socketSendQueueObj.length > 0) {
          const nextAvailableBlob = socketSendQueueObj.splice(0, 1);
          socketObj.send(nextAvailableBlob.pop() as Blob);
          socketSendCounter.current++;
        }
      });
    }

    if (
      isCurrentRecordingMarkedForSplit === false &&
      isRecording(recordingStatus)
    ) {
      appDebugLogger.log(
        'Started another recording process at',
        new Date().getSeconds()
      );
      const recorder = recorderRef.current as Recorder;
      recorder
        .start()
        .then(() => {
          // setTimeout(() => {
          //   appDebugLogger.log(
          //     'Splitting recording now',
          //     new Date().getSeconds()
          //   );
          //   setStopProcessBatching(true);
          // }, 4000);
        })
        .catch((err: any) => {
          appDebugLogger.log('Error recording', err);
        });
    }
  }, [recordingStatus, isCurrentRecordingMarkedForSplit]);

  const clearMessages = () => {
    socketDataReceivedRef.current = [];
    streamSocketDataReceivedRef.current = [];
    setSocketSendQueue([]);
    socketSendCounter.current = 0;
  };

  return (
    <>
      <CssBaseline />

      <Container
        maxWidth={false}
        sx={{
          ...flexColumn,
          ...alignJustifyItemsCenter,
          justifyContent: 'space-around',
          minHeight: '100vh',
          backgroundColor: 'rgba(244,244,105,0.1)',
        }}
        disableGutters
      >
        <AppBar sx={whiteBackgroundDarkText}>
          <Toolbar variant="dense" sx={{ ...displayFlexRow, ...allCenter }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <img
              src={SukiLogo}
              style={{ maxHeight: '20px', width: 'auto' }}
              alt="Name of Suki as Registered Trademark"
            />
          </Toolbar>
        </AppBar>

        <Container
          sx={{
            ...flexColumn,
            justifyContent: 'center',
            gap: '30px',
            boxShadow: '2px 1px 20px gray',
            backgroundColor: '#fff',
            marginTop: '75px',
            padding: '24px',
            borderBottomRightRadius: '24px',
            borderTopLeftRadius: '24px',
          }}
          maxWidth="sm"
        >
          <Typography
            sx={{
              ...displayFlexRow,
              ...allCenter,
              gap: '10px',
            }}
            variant="h4"
          >
            <RecordVoiceOverIcon fontSize="large" /> Speech to Text
          </Typography>
          <Divider sx={{ marginTop: '-10px' }} />
          <Box
            sx={{
              ...displayFlexRow,
              ...allCenter,
              justifyContent: 'space-around',
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>
              Transcription mode:
            </Typography>
            <ToggleButtonGroup
              color="primary"
              value={transcribeMode}
              exclusive
              onChange={(e, mode) => {
                if (!mode) {
                  setTranscribeMode(RECORD_MODE.batch);
                } else {
                  setTranscribeMode(mode);
                }
                if (mode && transcribeMode !== mode) {
                  setMicrophonePermission(false);
                }
              }}
              aria-label="Platform"
            >
              <ToggleButton value={RECORD_MODE.batch}>Batch</ToggleButton>
              <ToggleButton value={RECORD_MODE.stream}>Stream</ToggleButton>
              <ToggleButton value={RECORD_MODE.longrunning} disabled>
                Long Running
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <AskMicPermissionsButton
            hasPermissionForMic={hasPermissionForMic}
            handlers={{ getMicrophonePermission: onMicPermissionClickHandler }}
          />
          <MicRecordingStartStopButtons
            hasPermissionForMic={hasPermissionForMic}
            recordingStatus={recordingStatus}
            handlers={{
              startRecording,
              stopRecording,
            }}
          />
          <TranscriptionTextField
            transcriptionsArray={
              transcribeMode === RECORD_MODE.batch
                ? socketDataReceivedRef.current
                : streamSocketDataReceivedRef.current
            }
            minRows={4}
          />
          <Box
            sx={{
              ...displayFlexRow,
              ...allCenter,
              justifyContent: 'space-around',
              gap: '30px',
            }}
          >
            <Button
              sx={{ flex: '0 0 40%' }}
              variant="contained"
              onClick={clearMessages}
            >
              Clear
            </Button>
            <Button
              sx={{ flex: '0 0 40%' }}
              variant="outlined"
              color="info"
              onClick={() => setDebugDrawOpen(true)}
            >
              Debug
            </Button>
          </Box>
        </Container>

        <ListeningModal
          audioData={audioDataForAnalyzer}
          autoStopAfterSeconds={autoStopRecording}
          handlers={{ stopRecording }}
          recordingStatus={recordingStatus}
          transcribeMode={transcribeMode}
        />

        <DebugDrawerBottom
          isDebugDrawerOpen={isDebugDrawerOpen}
          setDebugDrawOpen={setDebugDrawOpen}
        >
          <Container
            sx={{
              ...flexColumn,
              ...alignJustifyItemsCenter,
            }}
          >
            <AudioClips
              socketMessageQueueState={socketMessageSendQueueState}
              transcriptionsArray={socketDataReceivedRef.current}
            />
            <Typography>
              Total messages sent over socket: {socketSendCounter.current}
            </Typography>
          </Container>
        </DebugDrawerBottom>

        <AppFooter />
      </Container>
    </>
  );
}

export default App;
