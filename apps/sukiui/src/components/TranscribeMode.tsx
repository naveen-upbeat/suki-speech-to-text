import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { allCenter, displayFlexRow } from '../util/styleUtils';
import { setTranscribeMode } from '../store/transcribeModeSlice';
import { setMicrophonePermission } from '../store/microPhoneSlice';

import { useSelector, useDispatch } from 'react-redux';
import { RECORD_MODE } from '../util/recordingStateUtils';

export type TranscribeModeProps = {
  mode: string;
};

const TranscribeMode = () => {
  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);
  const dispatch = useDispatch();
  return (
    <Box
      sx={{
        ...displayFlexRow,
        ...allCenter,
        justifyContent: 'space-around',
      }}
    >
      <Typography sx={{ fontWeight: 'bold' }}>Transcription mode:</Typography>
      <ToggleButtonGroup
        color="primary"
        value={transcribeMode}
        exclusive
        onChange={(e, selectedMode) => {
          if (!selectedMode) {
            dispatch(setTranscribeMode(RECORD_MODE.batch));
          } else {
            dispatch(setTranscribeMode(selectedMode));
          }
          if (selectedMode && transcribeMode !== selectedMode) {
            dispatch(setMicrophonePermission(false));
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
  );
};

export default TranscribeMode;
