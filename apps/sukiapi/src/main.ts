import express from 'express';
import websocketServer from './websocketServer';
import path from 'path';

const host =
  process.env.HOST ?? process.env.NODE_ENV
    ? process.env.NODE_ENV === 'PRODUCTION'
      ? '0.0.0.0'
      : 'localhost'
    : 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const CLIENT_BUILD_PATH = path.join(__dirname, '../sukiui');

const app = express();
app.use(express.static(CLIENT_BUILD_PATH));

app.get('/api', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.get('*', (request, response) => {
  console.log(__dirname);
  console.log('running ui');
  response.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

const server = app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

websocketServer(server);
