import { TextField } from '@mui/material';

export type TranscriptionTextFieldProps = {
  maxRows?: number;
  minRows?: number;
  transcriptionsArray: string[];
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
  transcriptionsArray: [''],
};

const TranscriptionTextField = ({
  maxRows,
  minRows,
  transcriptionsArray,
} = defaultProps) => {
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
