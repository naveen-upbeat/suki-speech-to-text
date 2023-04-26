import { Button } from '@mui/material';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import { ReactEventHandler } from 'react';

export type AskMicPermissionsProps = {
  hasPermissionForMic: boolean;
  handlers: {
    getMicrophonePermission: ReactEventHandler;
  };
};

const AskMicPermissionsButton = ({
  hasPermissionForMic,
  handlers,
}: AskMicPermissionsProps) => {
  if (!hasPermissionForMic) {
    return (
      <Button
        onMouseOver={handlers.getMicrophonePermission}
        variant="contained"
        sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}
        onClick={handlers.getMicrophonePermission}
      >
        Ask Microphone Permission <SettingsVoiceIcon />
      </Button>
    );
  } else {
    return <> </>;
  }
};

export default AskMicPermissionsButton;
