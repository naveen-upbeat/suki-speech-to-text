import {
  getMessageKeyForStreamStart,
  getMessageKeyForStreamStop,
} from '@suki-speech-to-text/suki-api-configs';

export const BUFFER_MESSAGE_FORMAT_ERROR =
  'Buffer Message in unexpected format';

export const shouldOpenStreamRecognize = (bufferMessage: any) => {
  let result = true;
  try {
    result = JSON.parse(bufferMessage.toString())[
      getMessageKeyForStreamStart()
    ];
  } catch (e) {
    throw new Error(BUFFER_MESSAGE_FORMAT_ERROR);
  }
  return result;
};

export const shouldCloseStreamRecognize = (bufferMessage: any) => {
  let result = false;
  try {
    result = JSON.parse(bufferMessage.toString())[getMessageKeyForStreamStop()];
  } catch (e) {
    throw new Error(BUFFER_MESSAGE_FORMAT_ERROR);
  }
  return result;
};
