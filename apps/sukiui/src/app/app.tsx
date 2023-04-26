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
import {
  LOCAL_HOST,
  evaluateHostBasedOnEnvironment,
  resolveCurrentEnvironments,
} from '../util/environmentUtils';
import { ConsoleLogger } from '../util/loggerUtil';
import AskMicPermissions from '../components/AskMicPermission';
import MicrophoneRecordingStartStop from '../components/MicrophoneRecordingStartStop';
import {
  alignJustifyItemsCenter,
  allCenter,
  displayFlexRow,
  flexColumn,
} from '../util/styleUtils';
import AppFooter from '../components/AppFooter';
import DebugDrawerBottom from '../components/DebugDrawerBottom';
import TranscriptionTextField from '../components/TranscriptionTextField';
import { isSpeechPaused } from '../util/soundAnalyserUtils';
import { RECORDING_STATUS, isRecording } from '../util/recordingStateUtils';
import useSmartSplitForRecording from '../hooks/useSmartSplitForRecording';
import {
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from '@suki-speech-to-text/suki-api-configs';

export const RECORD_MODE = {
  batch: 'batch',
  stream: 'stream',
  longrunning: 'longrunning',
};

const SAMPLE_RATE = 16000;

const AUTO_STOP_RECORDING_TIMEOUT = 12000; // auto stop recording in 10 seconds

const currentEnvironments = resolveCurrentEnvironments();

const appDebugLogger = new ConsoleLogger(currentEnvironments.isDebugEnabled);

const host = evaluateHostBasedOnEnvironment();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const protocolForWebsocket =
  window.location.protocol === 'https:' ? 'wss' : 'ws';

function generateWebSocketAddressForBatching() {
  const portSuffix = host !== LOCAL_HOST ? '' : `:${port}`;
  return `${protocolForWebsocket}://${host}${portSuffix}${WEB_SOCKET_BATCH_PATH}`;
}

export function App() {
  const [transcribeMode, setTranscribeMode] = useState(RECORD_MODE.batch);
  const [hasPermissionForMic, setMicrophonePermission] = useState(false);
  const [audioDataForAnalyzer, setAudioDataForAnalyzer] = useState({
    data: [],
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  const [recordingStatus, setRecordingStatus] = useState(
    RECORDING_STATUS.inactive
  );
  const [isCurrentRecordingMarkedForSplit, markCurrentRecordingForSplit] =
    useState<boolean | null>(null);

  const [autoStopRecording, setAutoStopRecording] = useState<number>(
    AUTO_STOP_RECORDING_TIMEOUT / 1000
  );

  const socketConnectionRef = useRef<WebSocket | null>(null);
  const socketDataReceivedRef = useRef<string[]>([]);
  const socketMessageSendQueue = useRef<Blob[]>([]);
  const [socketMessageSendQueueState, setSocketSendQueue] = useState<Blob[]>(
    []
  );
  const socketSendCounter = useRef<number>(0);

  const [isDebugDrawerOpen, setDebugDrawOpen] = useState(false);

  const onMicPermissionClickHandler = async () => {
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
        audioContextRef.current = new window.AudioContext();
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const splitRecordingForBatchProcess = () => {
    markCurrentRecordingForSplit(true);
  };

  const postSplitStartNewRecording = () => {
    markCurrentRecordingForSplit(false);
  };

  const startRecording = useCallback(() => {
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

  const stopRecording = () => {
    setRecordingStatus(RECORDING_STATUS.inactive);
  };

  useLayoutEffect(() => {
    const socket = new WebSocket(generateWebSocketAddressForBatching());

    socket.onmessage = function (e) {
      const latestTranscriptionData = e.data
        ? JSON.parse(e.data)?.transcription
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

    socketConnectionRef.current = socket;
  }, [audioContextRef]);

  // const [three2FiveSecondCounter, setThree2FiveSecondCounter] = useState(0);
  // useEffect(() => {
  //   let timer: any = false;
  //   if (three2FiveSecondCounter >= 0) {
  //     timer = setInterval(
  //       () => setThree2FiveSecondCounter(three2FiveSecondCounter + 1),
  //       1000
  //     );
  //   }
  //   if (
  //     (isCurrentRecordingMarkedForSplit === null ||
  //       isCurrentRecordingMarkedForSplit === false) &&
  //     isRecording(recordingStatus)
  //   ) {
  //     appDebugLogger.log(
  //       'Awaiting a recording split:',
  //       three2FiveSecondCounter
  //     );
  //     if (
  //       (three2FiveSecondCounter >= 3 &&
  //         three2FiveSecondCounter < 6 &&
  //         isSpeechPaused(audioDataForAnalyzer?.data)) ||
  //       three2FiveSecondCounter >= 6
  //     ) {
  //       splitRecordingForBatchProcess();
  //       setThree2FiveSecondCounter(0);
  //     }
  //   }

  //   return () => clearInterval(timer);
  // }, [three2FiveSecondCounter]);

  useSmartSplitForRecording({
    recordingStatus,
    isCurrentRecordingMarkedForSplit,
    audioDataForAnalyzer,
    splitRecordingForBatchProcess,
    appDebugLogger,
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
        <AppBar sx={{ background: '#fff', color: '#000' }}>
          <Toolbar
            variant="dense"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
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
              onChange={(e, mode) => setTranscribeMode(mode)}
              aria-label="Platform"
            >
              <ToggleButton value={RECORD_MODE.batch}>Batch</ToggleButton>
              <ToggleButton value={RECORD_MODE.stream} disabled>
                Stream
              </ToggleButton>
              <ToggleButton value={RECORD_MODE.longrunning} disabled>
                Long Running
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <AskMicPermissions
            hasPermissionForMic={hasPermissionForMic}
            handlers={{ getMicrophonePermission: onMicPermissionClickHandler }}
          />
          <MicrophoneRecordingStartStop
            hasPermissionForMic={hasPermissionForMic}
            recordingStatus={recordingStatus}
            handlers={{
              startRecording,
              stopRecording,
            }}
          />
          <TranscriptionTextField
            transcriptionsArray={socketDataReceivedRef.current}
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
            <AudioClips socketMessageQueueState={socketMessageSendQueueState} />
            Total messages sent over socket: {socketSendCounter.current}
          </Container>
        </DebugDrawerBottom>
        <AppFooter />
      </Container>
    </>
  );
}

export default App;
