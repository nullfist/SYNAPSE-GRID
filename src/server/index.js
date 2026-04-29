import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Simulation } from './simulation.js';
import { fetchUrlhausSummary } from './external-intelligence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/external-intelligence/urlhaus', async (request, response) => {
  try {
    response.json(await fetchUrlhausSummary());
  } catch (error) {
    response.status(502).json({
      enabled: false,
      provider: 'URLhaus abuse.ch',
      message: error.message,
      samples: []
    });
  }
});

const server = app.listen(port, () => {
  console.log(`SYNAPSE GRID running at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });
const clients = new Set();

const simulation = new Simulation({
  broadcast: (message) => {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }
});

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ type: 'STATE', reason: 'connected', state: simulation.state() }));

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      handleClientMessage(message);
    } catch (error) {
      socket.send(JSON.stringify({ type: 'ERROR', error: error.message }));
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
  });
});

function handleClientMessage(message) {
  const payload = message.payload || {};
  switch (message.type) {
    case 'SEND_DATA':
      simulation.sendData(payload);
      break;
    case 'BURST_TRAFFIC':
      simulation.burstTraffic(payload);
      break;
    case 'FAIL_NODE':
      simulation.failNode(payload.nodeId);
      break;
    case 'RECOVER_NODE':
      simulation.recoverNode(payload.nodeId);
      break;
    case 'TOGGLE_MALICIOUS':
      simulation.toggleMalicious(payload.nodeId);
      break;
    case 'SET_BEHAVIOR':
      simulation.setBehavior(payload.nodeId, payload.behavior);
      break;
    case 'CHANGE_TOPOLOGY':
      simulation.changeTopology(payload.mode);
      break;
    case 'RUN_SCENARIO':
      simulation.runScenario(payload.name);
      break;
    case 'RESET':
      simulation.reset(payload);
      break;
    default:
      simulation.publish('unknown_command');
      break;
  }
}

setInterval(() => simulation.tick(), 1800);
