import express from 'express';
import websocketServer from './websocketServer';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

const server = app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});


websocketServer(server);
