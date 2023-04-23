import speech from '@google-cloud/speech';
// import type AudioEncoding from '@google-cloud/speech';
const client = new speech.SpeechClient();

async function handleGoogleSpeechToText({ content }) {
  // The path to the remote LINEAR16 file stored in Google Cloud Storage

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: content,
  };
  const config = {
    encoding: 1 /** LINEAR16 */,
    audioChannelCount: 1,
    languageCode: 'en-US',
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

export default handleGoogleSpeechToText;
