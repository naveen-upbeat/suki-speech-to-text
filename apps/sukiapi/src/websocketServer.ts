import WebSocket from 'ws';
import handleGoogleSpeechToText from './googleSpeechToTextHandler';
//import { Blob } from 'buffer';
import Blob from 'node-blob';
//import queryString from 'query-string';

const tempChunks = [];
const mimeType = 'audio/webm';

const isAudioChunkSizeAbout30kb = (audioChunks: any) => {
  console.log('checking chunk size');
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  console.log('audio blob size:', audioBlob.size);
  if (audioBlob.size >= 32760) {
    return true;
  }
  return false;
};

export default async (expressServer) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    // server: expressServer,
    path: '/ws',
    verifyClient: (info: any, done) => {
      //console.log('client info', info);
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
        // let parsedMessage;
        let transcription = '';
        // let isFinalMessage = false;
        if (isBinary) {
          // parsedMessage = message;
          console.log('blob object', message);
          transcription = await handleGoogleSpeechToText({ content: message });
        }
        //console.log(parsedMessage);

        websocketConnection.send(
          JSON.stringify({
            //message: 'There be gold in them thar hills.',
            transcription,
          })
        );
      });
    }
  );

  expressServer.on('upgrade', (request, socket, head) => {
    //console.log('receiving a ws call', websocketServer.handleUpgrade);

    //websocketServer.emit('connection', socket, request);

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      console.log('emiting a connection event');
      websocketServer.emit('connection', websocket, request);
    });
  });

  return websocketServer;
};
