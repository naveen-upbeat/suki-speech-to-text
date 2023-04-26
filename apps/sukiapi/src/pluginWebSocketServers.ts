import { WebSocketServer } from 'ws';
import { recognizeWaveStream, recognizeAsync } from './sttRequests';
import { Readable } from 'stream';
import {
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from '@suki-speech-to-text/suki-api-configs';

export default async (expressServer) => {
  const inputWaveStream = new Readable({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    read() {},
  });
  let outputTranscriptStream = new Readable({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    read() {},
  });

  const websocketServer = new WebSocketServer({
    noServer: true,
    path: WEB_SOCKET_BATCH_PATH,
    verifyClient: (info: any, done) => {
      done(true);
    },
  });

  const wsForStreamRecognize = new WebSocketServer({
    noServer: true,
    path: WEB_SOCKET_STREAM_PATH,
    verifyClient: (info: any, done) => {
      done(true);
    },
  });

  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      //console.log('making a connection');
      //const [_path, params] = connectionRequest?.url?.split('?');
      //const connectionParams = queryString.parse(params);

      // NOTE: connectParams are not used here but good to understand how to get
      // to them if you need to pass data with the connection to identify it (e.g., a userId).
      //console.log('webocket connection praams: ', { a: 1 });

      websocketConnection.on('message', async (message: any, isBinary) => {
        let transcription = '';
        if (isBinary) {
          transcription = await recognizeAsync({
            content: message,
          });

          websocketConnection.send(
            JSON.stringify({
              transcription,
            })
          );
        }
      });
    }
  );

  expressServer.on('upgrade', (request, socket, head) => {
    if (request.url === WEB_SOCKET_BATCH_PATH) {
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocketServer.emit('connection', websocket, request);
      });
    } else {
      wsForStreamRecognize.handleUpgrade(request, socket, head, (websocket) => {
        wsForStreamRecognize.emit('connection', websocket, request);
      });
    }
  });

  wsForStreamRecognize.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      //console.log('making a connection');
      //const [_path, params] = connectionRequest?.url?.split('?');
      //const connectionParams = queryString.parse(params);

      // NOTE: connectParams are not used here but good to understand how to get
      // to them if you need to pass data with the connection to identify it (e.g., a userId).
      //console.log('webocket connection praams: ', { a: 1 });

      outputTranscriptStream = recognizeWaveStream(inputWaveStream);
      outputTranscriptStream.on('data', (data) => {
        console.log('Transcription data:', data);
        websocketConnection.send(
          JSON.stringify({
            transcription: data.results[0].alternatives[0].transcript,
          })
        );
      });

      websocketConnection.on('message', async (message: any, isBinary) => {
        if (isBinary) {
          console.log('Stream binary', message);
          inputWaveStream.push(message);
        } else {
          console.log('Stream object:', message);
        }
      });
    }
  );

  // expressServer.on('upgrade', (request, socket, head) => {});

  return websocketServer;
};
