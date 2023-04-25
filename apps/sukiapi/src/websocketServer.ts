import { WebSocketServer } from 'ws';
import handleGoogleSpeechToTextAsync from './googleSpeechToTextHandler';

export default async (expressServer) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: '/ws',
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
          console.log('blob object', message);
          transcription = await handleGoogleSpeechToTextAsync({ content: message });
        } else {
          console.log('not a blog object, sorry no transcription');
        }

        websocketConnection.send(
          JSON.stringify({
            transcription,
          })
        );
      });
    }
  );

  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      console.log('emiting a connection event');
      websocketServer.emit('connection', websocket, request);
    });
  });

  return websocketServer;
};
