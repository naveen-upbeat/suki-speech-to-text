import {
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from '@suki-speech-to-text/suki-api-configs';
import {
  LOCAL_HOST,
  evaluateHostBasedOnEnvironment,
  getAPIServerPort,
} from './environmentUtils';
import { RECORD_MODE } from './recordingStateUtils';

const hostName = evaluateHostBasedOnEnvironment();

const protocolForWebsocket =
  window.location.protocol === 'https:' ? 'wss' : 'ws';

export function generateWebSocketAddressForBatching() {
  const portSuffix = hostName !== LOCAL_HOST ? '' : `:${getAPIServerPort()}`;
  return `${protocolForWebsocket}://${hostName}${portSuffix}${WEB_SOCKET_BATCH_PATH}`;
}

export function generateWebSocketAddressForStreaming() {
  const portSuffix = hostName !== LOCAL_HOST ? '' : `:${getAPIServerPort()}`;
  return `${protocolForWebsocket}://${hostName}${portSuffix}${WEB_SOCKET_STREAM_PATH}`;
}

export function getWebsocketAddress(
  recordingMode: (typeof RECORD_MODE)[keyof typeof RECORD_MODE]
) {
  let websocketPath = WEB_SOCKET_BATCH_PATH;
  if (recordingMode === RECORD_MODE.stream) {
    websocketPath = WEB_SOCKET_STREAM_PATH;
  }
  const portSuffix = hostName !== LOCAL_HOST ? '' : `:${getAPIServerPort()}`;
  return `${protocolForWebsocket}://${hostName}${portSuffix}${websocketPath}`;
}
