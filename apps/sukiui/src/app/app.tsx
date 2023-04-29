import AppBar from '@mui/material/AppBar';
import {
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { useEffect, useRef, useState } from 'react';
import Recorder from '../util/recorderUtils';
import ListeningModal from '../components/ListeningModal';
import AudioClips from '../components/AudioClips';
import SukiLogo from '../assets/logo.png';
import { resolveCurrentEnvironments } from '../util/environmentUtils';
import { ConsoleLogger } from '../util/loggerUtil';
import AskMicPermissionsButton from '../components/AskMicPermissionButton';
import MicRecordingStartButton from '../components/MicRecordingStartButton';
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
import { RECORD_MODE } from '../util/recordingStateUtils';
import { getWebsocketAddress } from '../util/urlUtils';
import { Provider } from 'react-redux';
import { store } from '../store';
import TranscribeMode from '../components/TranscribeMode';
import ClearAndDebugButtons from '../components/ClearAndDebugButtons';
import AppContext from '../context/AppContext';
import { ErrorBoundary } from 'react-error-boundary';

const AUTO_STOP_RECORDING_TIMEOUT = 12000; // auto stop recording in 10 seconds

const currentEnvironments = resolveCurrentEnvironments();

const appDebugLogger = new ConsoleLogger(currentEnvironments.isDebugEnabled);

export function App() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamAudioContextRef = useRef<AudioContext | null>(null);
  const webAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const pcmWorkerRef = useRef<AudioWorkletNode | null>(null);

  const [autoStopRecording, setAutoStopRecording] = useState<number>(
    AUTO_STOP_RECORDING_TIMEOUT / 1000
  );

  const socketConnectionRef = useRef<WebSocket | null>(null);
  const streamSocketConnectionRef = useRef<WebSocket | null>(null);
  const socketDataReceivedRef = useRef<string[]>([]);
  const streamSocketDataReceivedRef = useRef<string[]>([]);
  const socketMessageSendQueue = useRef<Blob[]>([]);
  const socketMessageSendQueueCopy = useRef<Blob[]>([]);

  const socketSendCounter = useRef<number>(0);

  const allRefs = {
    audioContextRef,
    streamAudioContextRef,
    webAudioSourceRef,
    recorderRef,
    pcmWorkerRef,
    socketConnectionRef,
    streamSocketConnectionRef,
    socketDataReceivedRef,
    streamSocketDataReceivedRef,
    socketMessageSendQueue,
    socketMessageSendQueueCopy,
    socketSendCounter,
  };

  //
  useEffect(() => {
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
      appDebugLogger.log('Stream transcription:', latestTranscriptionData);
      const streamSocketDataReceived =
        streamSocketDataReceivedRef.current as string[];
      streamSocketDataReceived.push(latestTranscriptionData);
    };

    socketConnectionRef.current = socket;
    streamSocketConnectionRef.current = streamSocket;
  }, []);

  const ErrorMessage = () => (
    <Typography>There was some error! Please refresh the app.</Typography>
  );

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <AppContext.Provider value={{ appDebugLogger: appDebugLogger }}>
        <CssBaseline />
        <Provider store={store}>
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
              <Toolbar
                variant="dense"
                sx={{ ...displayFlexRow, ...allCenter, justifyContent: 'left' }}
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

              <TranscribeMode />

              <AskMicPermissionsButton refs={allRefs} />

              <MicRecordingStartButton refs={allRefs} />
              <TranscriptionTextField refs={allRefs} minRows={4} />
              <ClearAndDebugButtons refs={allRefs} />
            </Container>

            <ListeningModal
              autoStopAfterSeconds={autoStopRecording}
              refs={allRefs}
            />

            <DebugDrawerBottom refs={allRefs}></DebugDrawerBottom>
            <AppFooter />
          </Container>
        </Provider>
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
