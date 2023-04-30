import { Box, Button } from '@mui/material';
import { allCenter, displayFlexRow } from '../util/styleUtils';
import { useDispatch, useSelector } from 'react-redux';
import { setDebugDrawerOpen } from '../store/debugDrawSlice';
import { RECORD_MODE } from '../util/recordingStateUtils';

const ClearAndDebugButtons = ({ refs }: any) => {
  const {
    socketDataReceivedRef,
    streamSocketDataReceivedRef,
    socketMessageSendQueueCopy,
    socketSendCounter,
  } = refs;

  const dispatch = useDispatch();

  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);

  const clearMessages = () => {
    socketDataReceivedRef.current = [];
    streamSocketDataReceivedRef.current = [];
    socketMessageSendQueueCopy.current = [];
    socketSendCounter.current = 0;
  };

  return (
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
      {transcribeMode === RECORD_MODE.batch && (
        <Button
          sx={{ flex: '0 0 40%' }}
          variant="outlined"
          color="info"
          onClick={() => dispatch(setDebugDrawerOpen(true))}
        >
          Debug
        </Button>
      )}
    </Box>
  );
};

export default ClearAndDebugButtons;
