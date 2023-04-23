import { Container, Box } from '@mui/material';
import React from 'react';

const AudioClips = React.memo(({ socketMessageQueueState }: any) => {
  return (
    <Container sx={{ gap: '30px' }}>
      {socketMessageQueueState.map((bl: any, ind: number) => {
        console.log('Blob number:', ind, bl);
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: '30px',
            }}
            key={'aud' + ind}
          >
            <Box
              sx={{ flex: '0 0 30%', justifyContent: 'right', display: 'flex' }}
            >
              {' '}
              Clip: {ind + 1}
            </Box>
            <Box
              sx={{ flex: '0 0 60%', justifyContent: 'left', display: 'flex' }}
            >
              <audio src={URL.createObjectURL(bl)} controls></audio>
            </Box>
          </Box>
        );
      })}
    </Container>
  );
});

export default AudioClips;
