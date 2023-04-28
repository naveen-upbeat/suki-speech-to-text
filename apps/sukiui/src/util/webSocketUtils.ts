import { RECORD_MODE } from './recordingStateUtils';
import { getWebsocketAddress } from './urlUtils';

export function setupWebsocketForStreamRecognize(
  streamSocketConnectionRef: any,
  streamSocketDataReceivedRef: any
) {
  const streamSocket = new WebSocket(getWebsocketAddress(RECORD_MODE.stream));

  streamSocket.onmessage = function (e) {
    const latestTranscriptionData = e.data
      ? JSON.parse(e.data)?.transcription
      : '';
    console.log('Stream transcription:', latestTranscriptionData);
    const streamSocketDataReceived =
      streamSocketDataReceivedRef.current as string[];
    streamSocketDataReceived.push(latestTranscriptionData);
  };

  streamSocketConnectionRef.current = streamSocket;
}
