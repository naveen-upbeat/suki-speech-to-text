import speech from '@google-cloud/speech';
import * as pumpify from 'pumpify';
import { google } from '@google-cloud/speech/build/protos/protos';
import { Readable } from 'stream';
import {
  getAudioChannelCount,
  getSampleRateForRecognize,
} from '@suki-speech-to-text/suki-api-configs';
import { extractTransciptFromRecognizeResponse } from './utils/streamRecognizeUtils';

const requestConfigDefault = {
  encoding: 1 /** LINEAR16 */,
  audioChannelCount: getAudioChannelCount(),
  sampleRateHertz: getSampleRateForRecognize(),
  languageCode: 'en-US',
};

const client = new speech.SpeechClient();

/**
 * recognizeAsync() -> Makes a async recognize request
 * to Google Speect To Text API, and returns 'Transcription'
 * evaluated by the SST API
 * @param content - audio blob received from the UI
 * @returns - transcription
 */
export async function recognizeAsync({ content }) {
  // The path to the remote LINEAR16 file stored in Google Cloud Storage
  const audio = {
    content: content,
  };
  const config = {
    ...requestConfigDefault,
    metadata: {
      interactionType:
        google.cloud.speech.v1.RecognitionMetadata.InteractionType.DICTATION,
    },
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech from audio content specified in the request
  const [response] = await client.recognize(request);
  const transcription = extractTransciptFromRecognizeResponse(response);
  console.log(
    `Transcription: ${transcription}, Results length: ${response.results.length}`
  );
  return transcription;
}

/**
 * recognizeWaveStream() - makes a full duplex / gRPC call to STT api
 * using stream
 * @param inputWaveStream - the stream of audio buffer converted to WAV encoding from UI
 * @returns - transcription
 */
export function recognizeWaveStream(inputWaveStream: Readable) {
  const request = {
    config: {
      ...requestConfigDefault,
    },
    single_utterance: true,
    interimResults: false, // If you want interim results, set this to true
  };

  let recognizeStream: pumpify;
  try {
    // Stream the audio to the Google Cloud Speech API
    recognizeStream = client.streamingRecognize(request).on('error', (err) => {
      if (err.message.indexOf('was destroyed') >= 0) {
        console.log('Stream recognition ended gracefully');
      } else {
        console.error('Recognize Stream received an error:', err);
      }
    });
  } catch (err) {
    console.log('Error making recognize stream request', err);
  }

  inputWaveStream.pipe(recognizeStream);

  return { recognizeStream, client };
}
