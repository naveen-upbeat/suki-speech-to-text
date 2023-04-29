import WaveStream from 'react-wave-stream';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import StopCircleTwoToneIcon from '@mui/icons-material/StopCircleTwoTone';

import { Container, Typography } from '@mui/material';
import {
  RECORD_MODE,
  isRecordModeBatch,
  isRecording,
} from '../util/recordingStateUtils';
import {
  alignJustifyItemsCenter,
  allCenter,
  blinkKeyframes,
  displayFlexRow,
  flexColumn,
} from '../util/styleUtils';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRecording } from '../store/microPhoneSlice';
import { getMessageKeyForStreamStop } from '@suki-speech-to-text/suki-api-configs';

export type ListeningModalProps = {
  autoStopAfterSeconds?: number;
  refs: {
    pcmWorkerRef: any;
    streamSocketConnectionRef: any;
  };
};

const defaultProps: Partial<ListeningModalProps> = {
  autoStopAfterSeconds: 12,
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const ListeningModal = ({
  autoStopAfterSeconds = defaultProps.autoStopAfterSeconds,
  refs,
}: ListeningModalProps) => {
  const { pcmWorkerRef, streamSocketConnectionRef } = refs;
  const [autoStopCounter, setAutoStopCounter] = useState(autoStopAfterSeconds);

  const { audioAnalyzerData, isCurrentlyRecording } = useSelector(
    (state: any) => state.microPhone
  );
  const { isCurrentRecordingMarkedForSplit } = useSelector(
    (state: any) => state.batchRecording
  );

  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);
  const dispatch = useDispatch();

  const stopBatchRecording = () => {
    dispatch(setRecording(false));
  };

  const stopStreamRecording = async () => {
    const pcmWorker = pcmWorkerRef.current as AudioWorkletNode;
    pcmWorker.port.postMessage(JSON.stringify({ shouldClosePort: true }));
    dispatch(setRecording(false));
    const streamSocketRef = streamSocketConnectionRef.current as WebSocket;
    streamSocketRef.send(
      JSON.stringify({ [getMessageKeyForStreamStop()]: true })
    );
  };

  const stopRecording = () => {
    if (transcribeMode === RECORD_MODE.batch) {
      stopBatchRecording();
    } else if (transcribeMode === RECORD_MODE.stream) {
      stopStreamRecording();
    }
  };

  useEffect(() => {
    const timer =
      (autoStopCounter as number) > 0 &&
      isCurrentlyRecording &&
      setInterval(
        () => setAutoStopCounter((autoStopCounter as number) - 1),
        1000
      );
    if (autoStopCounter === 0 && isRecordModeBatch(transcribeMode)) {
      stopRecording();
    }
    if (!isCurrentlyRecording) {
      setAutoStopCounter(autoStopAfterSeconds);
    }
    return () => clearInterval(timer as any);
  }, [autoStopCounter, isCurrentRecordingMarkedForSplit]);

  const extendRecording = (seconds: number) => {
    setAutoStopCounter((autoStopCounter as number) + seconds);
  };

  const shouldShowAutoStopOptions = () =>
    (autoStopCounter as number) < 5 && (autoStopCounter as number) > -1;

  return (
    <Modal
      open={isCurrentlyRecording}
      onClose={stopRecording}
      onBackdropClick={stopRecording}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        ...displayFlexRow,
        ...alignJustifyItemsCenter,
        justifyContent: 'space-around',
      }}
    >
      <Box
        sx={{
          ...displayFlexRow,
          ...alignJustifyItemsCenter,
          marginTop: '80px',
        }}
      >
        <Container
          sx={{
            ...flexColumn,
            justifyItems: 'stretch',
            background: '#fff',
            padding: '4px 0 0 0',
          }}
          disableGutters
        >
          <Box
            sx={{
              ...displayFlexRow,
              ...allCenter,
              justifyContent: 'space-between',
              padding: '5px',
            }}
          >
            <Typography variant="h6">Listening...{'    '}</Typography>
            {isRecordModeBatch(transcribeMode) &&
              shouldShowAutoStopOptions() && (
                <Typography
                  variant="subtitle1"
                  sx={{ animation: `${blinkKeyframes} 1s linear infinite` }}
                >
                  Autostop in: {autoStopCounter}s{' '}
                </Typography>
              )}
            {isCurrentlyRecording && (
              <Button color="error" variant="contained" onClick={stopRecording}>
                <StopCircleTwoToneIcon />
              </Button>
            )}
          </Box>
          {isRecordModeBatch(transcribeMode) && shouldShowAutoStopOptions() && (
            <Box
              sx={{
                ...displayFlexRow,
                ...allCenter,
                marginTop: '5px',
                gap: '5px',
                background: '#a3dbec',
                padding: '5px',
                boxShadow: 'inset 0 0 10px #000000',
              }}
            >
              <Typography sx={{ fontWeight: 'bold' }}>
                Add more seconds:
              </Typography>
              <Button
                variant="contained"
                color="info"
                onClick={() => extendRecording(10)}
              >
                10
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => extendRecording(15)}
              >
                15
              </Button>
              <Button variant="contained" onClick={() => extendRecording(20)}>
                20
              </Button>
            </Box>
          )}
          <Box
            sx={{
              position: 'relative',
              width: '400px',
              height: '80px',
            }}
          >
            <WaveStream data={audioAnalyzerData?.data} />
          </Box>
        </Container>
      </Box>
    </Modal>
  );
};

export default ListeningModal;
