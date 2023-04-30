import { TextField, Box } from '@mui/material';
import { RECORD_MODE } from '../util/recordingStateUtils';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import DoneAllTwoToneIcon from '@mui/icons-material/DoneAllTwoTone';
import {
  alignJustifyItemsCenter,
  allCenter,
  displayFlexRow,
} from '../util/styleUtils';

export type TranscriptionTextFieldProps = {
  refs?: any;
  maxRows?: number;
  minRows?: number;
};

const DEFAULT_TEXT_PLACEHOLDER = `Steps:
1. Hover on - Ask Microphone Permission button, then
2. Click - Start, then
3. Observe a popup showing listening (use english language for dictation)
4. When finished, click Stop or anywhere on the screen
5. Observe this area, now containing transcription of the speech`;

const UN_RECOGNIZED_TRANSCRIPT = '▮';
const HELPER_TEXT_INFO = `Uh oh! Some part of this dictation was not recognized. The characters '${UN_RECOGNIZED_TRANSCRIPT}' represent the un-recognized part. Please notify support if problem persists. Thank you!`;
const HELPER_TEXT_SUCCESS = `Looks like a successful transcription. How did we do?`;
const TEXT_FIELD_LABEL_INSTRUCTIONS = 'Instructions';
const TEXT_FIELD_LABLE_TRANSCR = 'Transcription';

function getTextFieldPlaceHolder(transcriptionsArray: string[]) {
  return transcriptionsArray.join('').length === 0
    ? DEFAULT_TEXT_PLACEHOLDER
    : '';
}

function getTextFieldLabel(transcriptionsArray: string[]) {
  return transcriptionsArray.join('').trim().length === 0
    ? TEXT_FIELD_LABEL_INSTRUCTIONS
    : TEXT_FIELD_LABLE_TRANSCR;
}

function joinTranscripts(transcriptionsArray: string[]) {
  return transcriptionsArray
    .map((transcript: string, idx: number) => {
      let transcriptDelimiter = ', ';
      if (idx === transcriptionsArray.length - 1) {
        transcriptDelimiter = '';
      }
      if (transcript.trim().length > 0) {
        return transcript + transcriptDelimiter;
      }
      return UN_RECOGNIZED_TRANSCRIPT;
    })
    .join('');
}

const defaultProps: TranscriptionTextFieldProps = {
  maxRows: 10,
  minRows: 4,
};

const TranscriptionTextField = ({ maxRows, minRows, refs } = defaultProps) => {
  const { socketDataReceivedRef, streamSocketDataReceivedRef } = refs;
  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);
  const { isCurrentlyRecording } = useSelector(
    (state: any) => state.microPhone
  );
  const transcriptionsArray =
    transcribeMode === RECORD_MODE.batch
      ? socketDataReceivedRef.current
      : streamSocketDataReceivedRef.current;
  const textFieldValue = joinTranscripts(transcriptionsArray);
  const hasUnrecognizedTranscripts = textFieldValue.includes(
    UN_RECOGNIZED_TRANSCRIPT
  );

  const capitalizedText =
    textFieldValue.charAt(0).toUpperCase() + textFieldValue.slice(1);
  useEffect(() => {
    // console.log('transcibe mode or isCurrentlyRecording changed');
  }, [isCurrentlyRecording]);
  return (
    <TextField
      value={capitalizedText}
      InputLabelProps={{ shrink: true }}
      inputProps={{
        placeholder: getTextFieldPlaceHolder(transcriptionsArray),
        style: { WebkitTextStroke: 'thin' },
      }}
      label={getTextFieldLabel(transcriptionsArray)}
      multiline
      color={hasUnrecognizedTranscripts ? 'warning' : 'success'}
      helperText={
        hasUnrecognizedTranscripts ? (
          <Box
            sx={{
              ...displayFlexRow,
              ...allCenter,
              justifyContent: 'left',
              gap: '10px',
              color: 'orange',
            }}
          >
            <WarningTwoToneIcon />
            {HELPER_TEXT_INFO}
          </Box>
        ) : (
          textFieldValue && (
            <Box
              sx={{
                ...displayFlexRow,
                ...alignJustifyItemsCenter,
                justifyContent: 'left',
                gap: '10px',
                color: 'green',
              }}
            >
              <DoneAllTwoToneIcon /> {HELPER_TEXT_SUCCESS}
            </Box>
          )
        )
      }
      maxRows={maxRows}
      minRows={minRows}
    />
  );
};

export default TranscriptionTextField;
