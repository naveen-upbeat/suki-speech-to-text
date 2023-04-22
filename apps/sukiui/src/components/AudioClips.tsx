import { Container, Box } from '@mui/material';
import React from 'react';

const AudioClips = React.memo(({ socketMessageQueueState }: any) => {
  return (
    <Container disableGutters>
      {socketMessageQueueState.map((bl: any, ind: number) => {
        console.log('Blob number:', ind, bl);
        return (
          <Box sx={{ display: 'flex' }} key={'aud' + ind}>
            <Box sx={{ flex: '0 0 50%' }}> Clip: {ind}</Box>
            <Box sx={{ flex: '0 0 50%' }}>
              <audio src={URL.createObjectURL(bl)} controls></audio>
            </Box>
          </Box>
        );
      })}
    </Container>
  );
});

export default AudioClips;
