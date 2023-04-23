import AppBar from '@mui/material/AppBar';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TextField from '@mui/material/TextField';
import MicTwoToneIcon from '@mui/icons-material/MicTwoTone';
import StopCircleTwoToneIcon from '@mui/icons-material/StopCircleTwoTone';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
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
import SukiFooterLogo from '../assets/footer.png';
import { resolveCurrentEnvironments } from '../util/environmentUtils';
import { ConsoleLogger } from '../util/loggerUtil';

export const RECORDING_STATUS = {
  recording: 'RECORDING',
  inactive: 'INACTIVE',
};

const AUTO_STOP_RECORDING_TIMEOUT = 12000; // auto stop recording in 10 seconds

const currentEnvironments = resolveCurrentEnvironments();

const appDebugLogger = new ConsoleLogger(currentEnvironments.isDebugEnabled);

export const isRecording = (status: string) =>
  status === RECORDING_STATUS.recording;

const DEFAULT_TEXT_PLACEHOLDER = `Steps:
1. Click - Use Microphone button, then
2. Click - Speak, then
3. Observe a popup showing listening, use english language to talk / record
4. When done click Stop or anywhere on the screen
5. Observe this area, now containing transcription of the speech`;

export function App() {
  const [hasPermissionForMic, setMicrophonePermission] = useState(false);
  const [audioDataForAnalyzer, setAudioDataForAnalyzer] = useState({
    data: [],
  });
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  const [recordingStatus, setRecordingStatus] = useState(
    RECORDING_STATUS.inactive
  );
  const [shouldStopProcessBatching, setStopProcessBatching] = useState<
    boolean | null
  >(null);

  const socketConnectionRef = useRef<WebSocket | null>(null);
  const socketDataReceivedRef = useRef<string[]>([]);
  const socketMessageSendQueue = useRef<Blob[]>([]);
  const [socketMessageSendQueueState, setSocketSendQueue] = useState<Blob[]>(
    []
  );
  const socketSendCounter = useRef<number>(0);

  const [isDebugDrawerOpen, setDebugDrawOpen] = useState(false);

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setMicrophonePermission(true);
        setAudioStream(streamData as MediaStream);
        audioContextRef.current = new window.AudioContext();
        recorderRef.current = new Recorder(audioContextRef.current, {
          numChannels: 1,
          sampleRate: 16000,
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
  const stopRecordingProcess = () => {
    setStopProcessBatching(true);
  };

  const startRecordingProcess = () => {
    setStopProcessBatching(false);
  };

  useEffect(() => {
    appDebugLogger.log(
      `recording status: ${recordingStatus}, recording batching: ${shouldStopProcessBatching}, Socket Data Received: ${socketDataReceivedRef.current.join(
        ' '
      )}`
    );

    if (shouldStopProcessBatching) {
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
        if (socketSendQueueObj.length > 0) {
          const nextAvailableBlob = socketSendQueueObj.splice(0, 1);
          setTimeout(() => {
            socketObj.send(nextAvailableBlob.pop() as Blob);
            socketSendCounter.current++;
          }, 200);
        }
        if (isRecording(recordingStatus)) {
          startRecordingProcess();
        }
      });
    }

    if (shouldStopProcessBatching === false && isRecording(recordingStatus)) {
      appDebugLogger.log(
        'Started another recording process at',
        new Date().getSeconds()
      );
      const recorder = recorderRef.current as Recorder;
      recorder
        .start()
        .then(() => {
          setTimeout(() => {
            appDebugLogger.log(
              'Splitting recording now',
              new Date().getSeconds()
            );
            setStopProcessBatching(true);
          }, 4000);
        })
        .catch((err: any) => {
          appDebugLogger.log('Error recording', err);
        });
    }
  }, [recordingStatus, shouldStopProcessBatching]);

  const startRecording = useCallback(() => {
    clearMessages();
    setRecordingStatus((_currentStatus) => RECORDING_STATUS.recording);
    const recorder = recorderRef.current as Recorder;

    recorder
      .start()
      .then(() => {
        setTimeout(() => {
          appDebugLogger.log('Splitting first recording');
          stopRecordingProcess();
        }, 4000);

        setTimeout(() => {
          stopRecording();
        }, AUTO_STOP_RECORDING_TIMEOUT);
      })
      .catch((err: any) => {
        appDebugLogger.log('Error recording', err);
      });
  }, [recordingStatus, setRecordingStatus]);

  const stopRecording = () => {
    setRecordingStatus(RECORDING_STATUS.inactive);
  };

  useLayoutEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/ws');

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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyItems: 'stretch',
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
            flex: '0 0 80%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '30px',
            maxWidth: 'sm',
            boxShadow: '2px 1px 20px gray',
            backgroundColor: '#fff',
            marginTop: '75px',
            padding: '24px',
            borderBottomRightRadius: '24px',
            borderTopLeftRadius: '24px',
          }}
        >
          <Typography
            sx={{
              alignContent: 'center',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            variant="h4"
          >
            <RecordVoiceOverIcon fontSize="large" /> Speech to Text
          </Typography>
          <Divider sx={{ marginTop: '-10px' }} />
          {!hasPermissionForMic && (
            <Button
              variant="outlined"
              sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}
              onClick={getMicrophonePermission}
            >
              Ask Microphone Permission <SettingsVoiceIcon />
            </Button>
          )}
          {hasPermissionForMic && (
            <>
              <Button variant="outlined" onClick={startRecording}>
                <MicTwoToneIcon />{' '}
                {!isRecording(recordingStatus) ? 'Speak' : 'Listening...'}
              </Button>

              {isRecording(recordingStatus) && (
                <Button
                  variant="contained"
                  sx={{ zIndex: '1301' }}
                  onClick={(e) => stopRecording()}
                >
                  <StopCircleTwoToneIcon /> Stop
                </Button>
              )}
            </>
          )}

          <TextField
            value={socketDataReceivedRef.current.join(' ').trim()}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder:
                socketDataReceivedRef.current.join('').length === 0
                  ? DEFAULT_TEXT_PLACEHOLDER
                  : '',
            }}
            label={
              socketDataReceivedRef.current.join('').trim().length === 0
                ? 'Instructions'
                : 'Transcription'
            }
            multiline
            maxRows={10}
            minRows={4}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyItems: 'center',
              justifyContent: 'space-around',
              gap: '30px',
            }}
          >
            <Button
              sx={{ flex: '0 0 40%' }}
              variant="outlined"
              onClick={clearMessages}
            >
              Clear
            </Button>
            <Button
              sx={{ flex: '0 0 40%' }}
              variant="outlined"
              onClick={() => setDebugDrawOpen(true)}
            >
              Debug
            </Button>
          </Box>

          {/* {audio && <audio src={audio} controls></audio>} */}
        </Container>
        {/* <Divider sx={{ width: '100%' }} /> */}
        <ListeningModal
          audioData={audioDataForAnalyzer}
          handlers={{ stopRecording }}
          recordingStatus={recordingStatus}
        />
        <Drawer
          variant="temporary"
          anchor="bottom"
          open={isDebugDrawerOpen}
          onClose={() => setDebugDrawOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: '100%',
              height: '200px',
            },
          }}
        >
          <Container>
            <AudioClips socketMessageQueueState={socketMessageSendQueueState} />
            Total messages sent over socket: {socketSendCounter.current}
          </Container>
        </Drawer>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '14px',
          }}
        >
          <img
            src={SukiFooterLogo}
            width={'auto'}
            height={'80px'}
            alt="footer text"
          />
        </Box>
      </Container>
    </>
  );
}

export default App;
