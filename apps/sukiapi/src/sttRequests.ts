import speech from '@google-cloud/speech';
import { Readable } from 'stream';
const client = new speech.SpeechClient();
import { google } from '@google-cloud/speech/build/protos/protos';

export async function recognizeAsync({ content }) {
  // The path to the remote LINEAR16 file stored in Google Cloud Storage
  const audio = {
    content: content,
  };
  const config = {
    encoding: 1 /** LINEAR16 */,
    audioChannelCount: 1,
    languageCode: 'en-US',
    metadata: {
      interactionType:
        google.cloud.speech.v1.RecognitionMetadata.InteractionType.DICTATION,
    },
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join(' ');
  console.log(
    `Transcription: ${transcription}, Results length: ${response.results.length}`
  );
  return transcription;
}

export function recognizeWaveStream(inputWaveBlobStream) {
  // const outputTranscriptStream = new Readable({
  //   // eslint-disable-next-line @typescript-eslint/no-empty-function
  //   read() {},
  // });

  const request = {
    config: {
      encoding: 1,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    interimResults: false, // If you want interim results, set this to true
  };

  let recognizeStream;
  try {
    // Stream the audio to the Google Cloud Speech API
    recognizeStream = client
      .streamingRecognize(request)
      .on('error', (err) => {
        console.error(err);
      })
      .on('data', (data) => {
        this.console.log(
          `Transcription: ${data.results[0].alternatives[0].transcript}`
        );
        // outputTranscriptStream.push(data.results[0].alternatives[0].transcript);
      });
      recognizeStream
      // recognizeStream.on('data')
  } catch (err) {
    console.log('Error making stream request', err);
  }
  
  inputWaveBlobStream.pipe(recognizeStream);

  return recognizeStream;
}