import { WebSocketServer } from 'ws';
import { recognizeWaveStream, recognizeAsync } from './sttRequests';
import { Readable } from 'stream';
import {
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from '@suki-speech-to-text/suki-api-configs';
import {
  shouldCloseStreamRecognize,
  shouldOpenStreamRecognize,
} from './utils/streamRecognizeUtils';

export default async (expressServer) => {
  // A dedicated webSocket server for async recognize requests
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: WEB_SOCKET_BATCH_PATH,
    verifyClient: (info: any, done) => {
      done(true);
    },
  });

  // A dedicated webSocket server for stream recognize requests
  const wsForStreamRecognize = new WebSocketServer({
    noServer: true,
    path: WEB_SOCKET_STREAM_PATH,
    verifyClient: (info: any, done) => {
      done(true);
    },
  });

  //handle the 'connection' event from client (usually UI)
  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      //console.log('making a connection');
      //const [_path, params] = connectionRequest?.url?.split('?');
      //const connectionParams = queryString.parse(params);

      // NOTE: connectParams are not used here but good to understand how to get
      // to them if you need to pass data with the connection to identify it (e.g., a userId).
      //console.log('webocket connection praams: ', { a: 1 });

      //receives a WaveBlob from UI and returns the 'transcription' returned from STT API
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
    let webSocketServerInstance = wsForStreamRecognize;
    if (request.url === WEB_SOCKET_BATCH_PATH) {
      webSocketServerInstance = websocketServer;
    }
    webSocketServerInstance.handleUpgrade(
      request,
      socket,
      head,
      (websocket) => {
        webSocketServerInstance.emit('connection', websocket, request);
      }
    );
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

      let inputWaveStream = new Readable({
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        read() {},
      });
      let outputTranscriptStream;

      //receives a Stream from UI and returns the 'transcription' returned from STT API
      websocketConnection.on('message', async (message: any, isBinary) => {
        if (isBinary) {
          inputWaveStream.push(message);
        } else {
          if (shouldCloseStreamRecognize(message)) {
            outputTranscriptStream.emit('close');
          } else if (shouldOpenStreamRecognize(message)) {
            inputWaveStream = new Readable({
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              read() {},
            });
            const { recognizeStream: outputTranscriptStreamNew } =
              recognizeWaveStream(inputWaveStream);
            outputTranscriptStream = outputTranscriptStreamNew;
            outputTranscriptStream.on('data', (data) => {
              const transciptDataConsolidated = data.results
                .map((res: any) => {
                  return res.alternatives
                    .map((alt: any) => alt.transcript)
                    .join(' ');
                })
                .join(' ');
              console.log('Transcription data:', transciptDataConsolidated);
              websocketConnection.send(
                JSON.stringify({
                  transcription: transciptDataConsolidated,
                })
              );
            });
          }
        }
      });
    }
  );
  return websocketServer;
};
