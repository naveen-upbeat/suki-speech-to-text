import {
  getMessageKeyForStreamStart,
  getMessageKeyForStreamStop,
} from '@suki-speech-to-text/suki-api-configs';

export const BUFFER_MESSAGE_FORMAT_ERROR =
  'Buffer Message in unexpected format';

export const isMessageToSignalStreamOpen = (bufferMessage: any) => {
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

export const isMessageAboutStreamClose = (bufferMessage: any) => {
  let result = false;
  try {
    result = JSON.parse(bufferMessage.toString())[getMessageKeyForStreamStop()];
  } catch (e) {
    throw new Error(BUFFER_MESSAGE_FORMAT_ERROR);
  }
  return result;
};

/**
 * extractTransciptFromRecognizeResponse() - extracts the trancript data from the recognize 
 * response and consolidates the results to single line of text.
 * @param recognizeResponse 
 * @returns - text 
 */
export const extractTransciptFromRecognizeResponse = (
  recognizeResponse: unknown
) => {
  let recognizeResults: unknown = [];
  if (typeof recognizeResponse === 'object' && 'results' in recognizeResponse) {
    recognizeResults = recognizeResponse.results;
  }
  return Array.isArray(recognizeResults)
    ? recognizeResults
        .map((res: unknown) => {
          if (typeof res === 'object' && 'alternatives' in res) {
            return Array.isArray(res.alternatives)
              ? res.alternatives
                  .map((alt: unknown) => {
                    if (typeof alt === 'object' && 'transcript' in alt) {
                      return alt.transcript;
                    }
                    return '';
                  })
                  .join(' ')
              : '';
          }
        })
        .join(' ')
    : '';
};
