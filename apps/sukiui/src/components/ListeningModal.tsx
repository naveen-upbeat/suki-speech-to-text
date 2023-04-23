import WaveStream from 'react-wave-stream';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { Container, Typography } from '@mui/material';
import { isRecording } from '../app/app';
import {
  alignJustifyItemsCenter,
  allCenter,
  blinkKeyframes,
  displayFlexRow,
  flexColumn,
} from '../util/styleUtils';
import { useEffect, useState } from 'react';

export type ListeningModalProps = {
  recordingStatus: string;
  handlers: { stopRecording: any };
  audioData: any;
  autoStopAfterSeconds?: number;
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
  recordingStatus,
  handlers,
  audioData,
  autoStopAfterSeconds = defaultProps.autoStopAfterSeconds,
}: ListeningModalProps) => {
  const [autoStopCounter, setAutoStopCounter] = useState(autoStopAfterSeconds);

  useEffect(() => {
    const timer =
      (autoStopCounter as number) > 0 &&
      isRecording(recordingStatus as string) &&
      setInterval(
        () => setAutoStopCounter((autoStopCounter as number) - 1),
        1000
      );
    if (autoStopCounter === 0) {
      handlers.stopRecording();
    }
    if (!isRecording(recordingStatus)) {
      setAutoStopCounter(autoStopAfterSeconds);
    }
    return () => clearInterval(timer as any);
  }, [autoStopCounter, recordingStatus]);

  const extendRecording = (seconds: number) => {
    setAutoStopCounter((autoStopCounter as number) + seconds);
  };

  return (
    <Modal
      open={isRecording(recordingStatus as string)}
      onClose={(handlers as any).stopRecording}
      onBackdropClick={(handlers as any).stopRecording}
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
            }}
          >
            <Typography variant="h6">Listening...{'    '}</Typography>
            {(autoStopCounter as number) < 5 &&
              (autoStopCounter as number) > -1 && (
                <Typography
                  variant="subtitle1"
                  sx={{ animation: `${blinkKeyframes} 1s linear infinite` }}
                >
                  Autostop in: {autoStopCounter}s{' '}
                </Typography>
              )}
          </Box>
          {(autoStopCounter as number) < 5 &&
            (autoStopCounter as number) > -1 && (
              <Box
                sx={{
                  ...displayFlexRow,
                  justifyContent: 'center',
                  marginTop: '5px',
                  gap: '5px',
                }}
              >
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => extendRecording(10)}
                >
                  Add 10s
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => extendRecording(15)}
                >
                  Add 15s
                </Button>
                <Button variant="contained" onClick={() => extendRecording(20)}>
                  Add 20s
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
            <WaveStream data={audioData?.data} />
          </Box>
        </Container>
      </Box>
    </Modal>
  );
};

export default ListeningModal;
