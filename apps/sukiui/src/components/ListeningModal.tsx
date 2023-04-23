import WaveStream from 'react-wave-stream';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { Container, Typography, css } from '@mui/material';
import { isRecording } from '../app/app';

const ListeningModal = ({
  recordingStatus,
  handlers: { stopRecording },
  audioData,
}: any) => {
  const boxCss = css`
    .wave-stream-box > svg#visualizer {
      position: relative;
    }
  `;

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
  return (
    <Modal
      open={isRecording(recordingStatus)}
      onClose={stopRecording}
      onBackdropClick={stopRecording}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: '80px',
        }}
      >
        <Container
          sx={{
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            justifyItems: 'stretch',
            padding: '4px 0 0 0',
          }}
          disableGutters
        >
          <Typography
            sx={{ justifyContent: 'center', display: 'flex' }}
            id="modal-modal-title"
            variant="h6"
            component="h2"
          >
            Listening...
          </Typography>
          <Box
            sx={{
              width: '400px',
              position: 'relative',
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
