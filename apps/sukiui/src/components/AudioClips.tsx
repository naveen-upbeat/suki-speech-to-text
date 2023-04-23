import { Container, Box } from '@mui/material';
import React from 'react';

export type AudioClipsProps = {
  socketMessageQueueState: Blob[];
};

const AudioClips = React.memo(
  ({ socketMessageQueueState }: AudioClipsProps) => {
    return (
      <Container sx={{ padding: '10px' }}>
        {socketMessageQueueState.map((bl: any, ind: number) => {
          return (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '10px',
              }}
              key={'aud' + ind}
            >
              <Box
                sx={{
                  flex: '0 0 30%',
                  justifyContent: 'right',
                  display: 'flex',
                }}
              >
                {' '}
                Clip: {ind + 1}
              </Box>
              <Box
                sx={{
                  flex: '0 0 60%',
                  justifyContent: 'left',
                  display: 'flex',
                }}
              >
                <audio src={URL.createObjectURL(bl)} controls></audio>
              </Box>
            </Box>
          );
        })}
      </Container>
    );
  }
);

export default AudioClips;
