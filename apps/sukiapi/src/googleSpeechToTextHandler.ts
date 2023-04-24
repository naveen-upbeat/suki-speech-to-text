import speech from '@google-cloud/speech';
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

  // load the environment variable with our keys
  const keysEnvVar = process.env['CREDS'];
  if (keysEnvVar) {
    const encodedText = Buffer.from(keysEnvVar, 'base64');
    // console.log(`ec: ${encodedText}, dec: ${decodedJsonText}`);
    // console.log('ecs', `${encodedText}`.replace(/\n/g, '\\n'));
    const plainText = `${encodedText}`;
    const partialText1 =
      plainText.substring(0, 133) + plainText.substring(1856);
    const partialText2 = `{${plainText.substring(134, 1855)}}`;
    // console.log(partialText1, partialText2);
    const partialTextReplaceNewLine = partialText2.replace(/\n/g, '\\n');

    const partialJson1 = JSON.parse(partialText1);
    const partialJson2 = JSON.parse(partialTextReplaceNewLine);

    const parsedKey = { ...partialJson1, ...partialJson2 };

    // console.log(`parsedKey: ${JSON.stringify(parsedKey)}`);
    //throw new Error('The $CREDS environment variable was not found!');
    client.auth.fromJSON(parsedKey);
  }

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
