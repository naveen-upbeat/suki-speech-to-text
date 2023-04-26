import { Button } from '@mui/material';
import MicTwoToneIcon from '@mui/icons-material/MicTwoTone';
import StopCircleTwoToneIcon from '@mui/icons-material/StopCircleTwoTone';

import { ReactEventHandler } from 'react';
import { isRecording } from '../util/recordingStateUtils';

export type MicrophoneRecordingStartStopProps = {
  hasPermissionForMic: boolean;
  recordingStatus: string;
  handlers: {
    startRecording: ReactEventHandler;
    stopRecording: ReactEventHandler;
  };
};

const MicRecordingStartStopButtons = ({
  hasPermissionForMic,
  recordingStatus,
  handlers,
}: MicrophoneRecordingStartStopProps) => {
  if (hasPermissionForMic) {
    return (
      <>
        <Button variant="outlined" onClick={handlers.startRecording}>
          <MicTwoToneIcon />{' '}
          {!isRecording(recordingStatus) ? 'Speak' : 'Listening...'}
        </Button>

        {/* {isRecording(recordingStatus) && (
          <Button
            variant="contained"
            sx={{ zIndex: '1301' }}
            onClick={handlers.stopRecording}
          >
            <StopCircleTwoToneIcon /> Stop
          </Button>
        )} */}
      </>
    );
  }
  return <> </>;
};

export default MicRecordingStartStopButtons;
