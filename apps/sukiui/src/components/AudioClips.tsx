import { Container, Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export type AudioClipsProps = {
  // transcriptionsArray: string[];
  refs: any;
};

const AudioClips = React.memo(({ refs }: AudioClipsProps) => {
  const { socketMessageSendQueueCopy, socketDataReceivedRef } = refs;
  const transcriptionsArray = socketDataReceivedRef.current;
  const { isCurrentRecordingMarkedForSplit } = useSelector(
    (state: any) => state.batchRecording
  );
  // const { capturedWaveBlobs } = useSelector(
  //   (state: any) => state.batchRecording
  // );
  const socketMessageQueueState = socketMessageSendQueueCopy.current;
  // useEffect(() => {
  //   console.log('have some transcripts', socketDataReceivedRef.current.length);
  // }, [isCurrentRecordingMarkedForSplit]);
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
            <Box
              sx={{
                border: '1px solid #cecece',
                display: 'flex',
                flex: '0 0 20%',
              }}
            >
              <Typography>{transcriptionsArray[ind] ?? ' '}</Typography>
            </Box>
          </Box>
        );
      })}
    </Container>
  );
});

export default AudioClips;
