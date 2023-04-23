import styled from '@emotion/styled';

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
  useMemo,
} from 'react';
import Recorder from '../util/recorderUtils';
import ListeningModal from '../components/ListeningModal';
import AudioClips from '../components/AudioClips';
import SukiLogo from '../assets/logo.png';
import SukiFooterLogo from '../assets/footer.png';

const StyledApp = styled.div`
  // Your style here
`;

const mimeType = 'audio/webm';

export const RECORDING_STATUS = {
  recording: 'RECORDING',
  inactive: 'INACTIVE',
};

export const isRecording = (status: string) =>
  status === RECORDING_STATUS.recording;

const DEFAULT_TEXT_PLACEHOLDER = `Steps:
1. Click - Use Microphone button, then
2. Click - Speak, then
3. Observe a popup showing listening, use english language to talk / record
4. When done click Stop or anywhere on the screen
5. Observe this area, now containing transcription of the speech`;

export function App() {
  const [textReceivedFromGoogle, setTextReceivedFromGoogle] = useState('');
  const [hasPermissionForMic, setPermission] = useState(false);
  const [audioStream, setAudioStream] = useState(null);

  const mediaRecorder = useRef(null);

  const [recordingStatus, setRecordingStatus] = useState(
    RECORDING_STATUS.inactive
  );
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState(null);

  const [socketRef, setSocketRef] = useState(null);
  const [socketDataFromServer, setSocketDataFromServer] = useState<any>([]);

  const socketDataRef = useRef<any>([]);

  const [recordState, setRecordState] = useState(null);
  const [audioData, setAudioData] = useState({ data: [] });

  const [shouldStopProcessBatching, setStopProcessBatching] = useState<
    boolean | null
  >(null);

  const recorderRef = useRef(null);

  const audioContextRef = useRef(null);

  const socketMessageQueue = useRef<any[]>([]);

  const [socketMessageQueueState, setSocketSendQueue] = useState<any>([]);

  const [isDebugDrawerOpen, setDebugDrawOpen] = useState(false);

  const onMicPermissionButtonClick = () => {
    console.log('Getting Mic permission');
  };

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setAudioStream(streamData as any);
        audioContextRef.current = new window.AudioContext() as any;
        recorderRef.current = new Recorder(audioContextRef.current, {
          numChannels: 1,
          sampleRate: 16000,
          // An array of 255 Numbers
          // You can use this to visualize the audio stream
          // If you use react, check out react-wave-stream
          onAnalysed: (data: any) => {
            //console.log(data);
            //setAudioData(data as any);
            //console.log(data);
            setAudioData(data);
            /* audioDataAnalyzed.push(data); */
          },
        }) as any;
        (recorderRef.current as any).init(streamData);
      } catch (err: any) {
        alert(err?.message as any);
      }
    } else {
      alert('The MediaRecorder API is not supported in your browser.');
    }
  };

  // const startRecording_bk = async () => {
  //   setRecordingStatus('recording');
  //   //create new Media recorder instance using the stream
  //   const media = new MediaRecorder(
  //     audioStream as any,
  //     { type: mimeType } as any
  //   );
  //   //set the MediaRecorder instance to the mediaRecorder ref
  //   mediaRecorder.current = media as any;
  //   //invokes the start method to start the recording process

  //   console.log('media recording chalu');
  //   let localAudioChunks: any = [];

  //   const mr: any = mediaRecorder.current;
  //   if (typeof mr !== 'undefined') {
  //     console.log('mr props', mr);
  //     mr.ondataavailable = (evt: any) => {
  //       console.log('Listening to audio now...');
  //       if (typeof evt.data === 'undefined') return;
  //       if (evt.data.size === 0) return;
  //       localAudioChunks.push(evt.data);
  //       if (mr.state === 'inactive') {
  //         console.log('recording is inactive now');
  //         // Close the file when the recording stops.

  //         //stopRecording(mr, localAudioChunks);
  //         //const socketObj: any = socketRef as any;
  //         //socketObj?.send?.(new Blob(audioChunks, { type: mimeType }));
  //         setAudioChunks(localAudioChunks);
  //         const socketObj: any = socketRef as any;
  //         // socketObj?.send?.(
  //         //   new Blob([...localAudioChunks], { type: mimeType })
  //         // );
  //         localAudioChunks = [];
  //         console.log('Sending finished');
  //         // socketObj?.send?.(JSON.stringify({ isFinished: true }));
  //       }
  //       if (isAudioChunkSizeAbout3kb(localAudioChunks)) {
  //         //setAudioChunks(localAudioChunks);
  //         setAudioChunks(localAudioChunks);
  //         const socketObj: any = socketRef as any;
  //         //socketObj?.send?.(new Blob(localAudioChunks, { type: mimeType }));
  //         // socketObj?.send?.(
  //         //   new Blob([...localAudioChunks], { type: mimeType })
  //         // );
  //         //socketObj?.send([...localAudioChunks]);
  //         //localAudioChunks = [];
  //         //stopRecording(mr, localAudioChunks);
  //         // socketObj?.send?.(
  //         //   new Blob([...localAudioChunks], { type: mimeType })
  //         // );
  //       }
  //     };
  //   }
  //   //setAudioChunks(localAudioChunks);
  //   mr.start(100);
  //   console.log('mr props started', mr);
  // };

  const getLatestRecordingStatus = () => {
    console.log('latest recording status in memo', recordingStatus);
    return recordingStatus;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stopRecordingProcess = () => {
    setStopProcessBatching(true);
  };

  const startRecordingProcess = () => {
    // console.log('started recording process');
    // const recorder: any = recorderRef.current;
    // recorder
    //   .start()
    //   .then(() => {
    //     // console.log('heyyyy im recording');
    //     // setRecordingStatus('recording');
    //     //recorder.updateAnalysers();
    //     setTimeout(() => {
    //       console.log('split recording');
    //       setStopProcessBatching(true);
    //       //stopRecordingProcess(isRecording(recordingStatus));
    //     }, 2000);
    //   })
    //   .catch((err: any) => {
    //     console.log('Error recording', err);
    //   });
    setStopProcessBatching(false);
  };

  useEffect(() => {
    console.log(
      `recording status: ${recordingStatus}, recording batching: ${shouldStopProcessBatching}, socket Data: ${socketDataRef.current.join(
        ' '
      )}`
    );

    if (shouldStopProcessBatching && isRecording(recordingStatus)) {
      console.log('stopping recording processess at', new Date().getSeconds());
      const recorder: any = recorderRef.current;

      recorder.stop().then(({ blob, buffer }: any) => {
        // setAudio(URL.createObjectURL(blob) as any);
        const socketObj: any = socketRef as any;
        //socketObj?.send?.(blob);
        console.log('Trying to send message: ', blob);
        socketMessageQueue.current.push(blob);
        setSocketSendQueue([...socketMessageQueueState, blob]);
        console.log(
          'message queue length',
          socketMessageQueue.current.length,
          socketMessageQueueState.length
        );
        if (socketMessageQueue.current.length === 1) {
          const nextAvailableBlob = socketMessageQueue.current.splice(0, 1);
          setTimeout(() => {
            socketObj.send(nextAvailableBlob.pop());
          }, 200);
        }

        // setTimeout(() => {
        // setRecordingStatus('inactive');
        // }, 5000);
        // buffer is an AudioBuffer
        // console.log(
        //   'Recording status:',
        //   getLatestRecordingStatus(),
        //   recordingStatus,
        //   isRecording
        // );
        if (isRecording(recordingStatus)) {
          startRecordingProcess();
        }
      });
    }

    if (shouldStopProcessBatching === false && isRecording(recordingStatus)) {
      console.log(
        'started another recording process at',
        new Date().getSeconds()
      );
      const recorder: any = recorderRef.current;
      recorder
        .start()
        .then(() => {
          // console.log('heyyyy im recording');
          // setRecordingStatus('recording');
          //recorder.updateAnalysers();
          setTimeout(() => {
            console.log('split recording');
            setStopProcessBatching(true);
            //stopRecordingProcess(isRecording(recordingStatus));
          }, 4000);
        })
        .catch((err: any) => {
          console.log('Error recording', err);
        });
    }
  }, [recordingStatus, shouldStopProcessBatching]);

  const startRecording = useCallback(() => {
    clearMessages();
    setRecordingStatus((_currentStatus) => RECORDING_STATUS.recording);
    //console.log(recordingStatus);
    // setSocketDataFromServer(['']);
    const recorder: any = recorderRef.current;
    // recorder.setOnAnalysed((data: any) => {
    //   setAudioData(data);
    // });

    recorder
      .start()
      .then(() => {
        //console.log('heyyyy im recording');

        //recorder.updateAnalysers();
        setTimeout(() => {
          console.log('split recording');
          //stopRecordingProcess(isRecording(recordingStatus));
          stopRecordingProcess();
        }, 2000);

        setTimeout(() => {
          stopRecording();
        }, 10000);
      })
      .catch((err: any) => {
        console.log('Error recording', err);
      });
  }, [recordingStatus, setRecordingStatus]);

  // stopRecordingProcess = () => {
  //   setStopProcessBatching(true);
  //   // console.log('stopping recording processess');
  //   // const recorder: any = recorderRef.current;

  //   // recorder.stop().then(({ blob, buffer }: any) => {
  //   //   // setAudio(URL.createObjectURL(blob) as any);
  //   //   const socketObj: any = socketRef as any;
  //   //   socketObj?.send?.(blob);
  //   //   // setTimeout(() => {
  //   //   // setRecordingStatus('inactive');
  //   //   // }, 5000);
  //   //   // buffer is an AudioBuffer
  //   //   console.log(
  //   //     'Recording status:',
  //   //     getLatestRecordingStatus(),
  //   //     recordingStatus,
  //   //     isRecording
  //   //   );
  //   //   if (isRecording) {
  //   //     startRecordingProcess();
  //   //   }
  //   // });
  // };

  const stopRecording = () => {
    // const recorder: any = recorderRef.current;
    setRecordingStatus(RECORDING_STATUS.inactive);

    // recorder.stop().then(({ blob, buffer }: any) => {
    //   setAudio(URL.createObjectURL(blob) as any);
    //   const socketObj: any = socketRef as any;
    //   socketObj?.send?.(blob);
    //   // setTimeout(() => {
    //   setRecordingStatus('inactive');
    //   // }, 5000);
    //   // buffer is an AudioBuffer
    // });
  };

  // const isAudioChunkSizeAbout3kb = (audioChunks: any) => {
  //   const audioBlob = new Blob(audioChunks, { type: mimeType });

  //   if (audioBlob.size >= 3276 * 5) {
  //     return true;
  //   }
  //   return false;
  // };

  // const stopRecording_bk = (mr: any, audioChunks?: any) => {
  //   console.log('Stopping audio');
  //   if (mr.state === 'recording') {
  //     mr.stop();
  //     setRecordingStatus('inactive');
  //     console.log('recording stopped');
  //     // const audioBlob = new Blob(audioChunks, { type: mimeType });
  //     // //creates a playable URL from the blob file.
  //     // console.log('Audio size', audioBlob.size);
  //     // const audioUrl = URL.createObjectURL(audioBlob);
  //     // setAudio(audioUrl as any);
  //     // console.log(JSON.stringify(audioChunks));
  //     // console.log(typeof audioChunks);
  //     // // const socketObj: any = socketRef as any;
  //     // // socketObj?.send?.(audioBlob);
  //     // setAudioChunks([]);
  //     // console.log('setting audioblob', audioUrl);
  //   }
  // };

  useLayoutEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/ws');
    setSocketRef(socket as any);
    socket.onmessage = function (e) {
      // if (recordingStatus === 'recording') {
      console.log('Data from socket: ', e.data);
      console.log(
        'Existing data',
        socketDataRef.current.join(' --- '),
        'New data: ',
        e.data ? JSON.parse(e.data)?.transcription : ''
      );
      socketDataRef.current.push(
        e.data ? JSON.parse(e.data)?.transcription : ''
      );

      // }
      console.log(
        'On socket message que length check: ',
        socketMessageQueue.current?.length
      );
      if (socketMessageQueue.current?.length > 0) {
        const nextAvailableBlob = socketMessageQueue.current.splice(0, 1);
        setTimeout(() => {
          console.log('Picking next data for socket');
          socket.send(nextAvailableBlob.pop());
        }, 200);
      }
    };

    socket.onopen = function () {
      socket.send(JSON.stringify({ hey: 'hello' }));
    };

    // const audioContext = audioContextRef.current;

    // recorderRef.current = new Recorder(audioContext, {
    //   // An array of 255 Numbers
    //   // You can use this to visualize the audio stream
    //   // If you use react, check out react-wave-stream
    //   // onAnalysed: (data: any) => {
    //   //   //console.log(data);
    //   //   //setAudioData(data as any);
    //   //   console.log(data);
    //   //   setAudioData(data);
    //   //   /* audioDataAnalyzed.push(data); */
    //   // },
    // });
  }, [audioContextRef]);

  const clearMessages = () => {
    socketDataRef.current = [];
    setSocketSendQueue([]);
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
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'rgba(244,244,105,0.1)',
        }}
        disableGutters
      >
        <AppBar sx={{ background: '#fff', color: '#000' }}>
          <Toolbar variant="dense">
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
            marginTop: '50px',
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
            value={socketDataRef.current.join(' ')}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder:
                socketDataRef.current.join('').length === 0
                  ? DEFAULT_TEXT_PLACEHOLDER
                  : '',
            }}
            label="Transcription"
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
          audioData={audioData}
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
            <AudioClips socketMessageQueueState={socketMessageQueueState} />
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
