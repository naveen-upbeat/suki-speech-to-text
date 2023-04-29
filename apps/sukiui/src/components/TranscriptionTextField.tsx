import { TextField } from '@mui/material';
import { RECORD_MODE } from '../util/recordingStateUtils';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

export type TranscriptionTextFieldProps = {
  refs?: any;
  maxRows?: number;
  minRows?: number;
};

const DEFAULT_TEXT_PLACEHOLDER = `Steps:
1. Click - Use Microphone button, then
2. Click - Speak, then
3. Observe a popup showing listening, use english language to talk / record
4. When done click Stop or anywhere on the screen
5. Observe this area, now containing transcription of the speech`;

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

function textFieldValue(transcriptionsArray: string[]) {
  return transcriptionsArray.join(' ').trim();
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
  useEffect(() => {
    // console.log('transcibe mode or isCurrentlyRecording changed');
  }, [isCurrentlyRecording]);
  return (
    <TextField
      value={textFieldValue(transcriptionsArray)}
      InputLabelProps={{ shrink: true }}
      inputProps={{
        placeholder: getTextFieldPlaceHolder(transcriptionsArray),
      }}
      label={getTextFieldLabel(transcriptionsArray)}
      multiline
      maxRows={maxRows}
      minRows={minRows}
    />
  );
};

export default TranscriptionTextField;
