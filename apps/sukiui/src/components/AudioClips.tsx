import { Container, Box, Typography } from '@mui/material';
import React from 'react';

export type AudioClipsProps = {
  socketMessageQueueState: Blob[];
  transcriptionsArray: string[];
};

const AudioClips = React.memo(
  ({ socketMessageQueueState, transcriptionsArray }: AudioClipsProps) => {
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
                  justifyContent: 'right',
                  display: 'flex',
                }}
              >
                {' '}
                Clip: {ind + 1}
              </Box>
              <Box
                sx={{
                  justifyContent: 'left',
                  display: 'flex',
                }}
              >
                <audio src={URL.createObjectURL(bl)} controls></audio>
              </Box>
              <Box sx={{ border: '1px solid #cecece' }}>
                <Typography>{transcriptionsArray[ind] + ' '}</Typography>
              </Box>
            </Box>
          );
        })}
      </Container>
    );
  }
);

export default AudioClips;
