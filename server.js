const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Unique ID generator
const app = express();

app.use(express.static('public')); // Serve static files (HTML, JS, CSS)

const server = http.createServer(app);

// WebSocket servers for "chatroom" and "wavelength"
const chatroomWSS = new WebSocket.Server({ noServer: true });
const wavelengthWSS = new WebSocket.Server({ noServer: true });

// Connection and history for chatroom
let chatroomClients = [];
let chatroomHistory = [];

// Handle WebSocket upgrades and route to the correct WebSocket server
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/chatroom') {
    chatroomWSS.handleUpgrade(request, socket, head, (ws) => {
      chatroomWSS.emit('connection', ws, request);
    });
  } else if (pathname === '/wavelength') {
    wavelengthWSS.handleUpgrade(request, socket, head, (ws) => {
      wavelengthWSS.emit('connection', ws, request);
    });
  } else {
    socket.destroy(); // Reject connections to unknown paths
  }
});

// Chatroom WebSocket server logic
chatroomWSS.on('connection', (ws) => {
  const clientId = uuidv4();
  console.log(`New client connected to chatroom: ${clientId}`);
  chatroomClients.push({ id: clientId, socket: ws });

  // Send initial data (clientId and chatroom history)
  ws.send(JSON.stringify({ type: 'init', clientId, history: chatroomHistory }));

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    const messageWithId = { ...parsedMessage, clientId };

    chatroomHistory.push(messageWithId); // Save to chatroom history

    // Broadcast message to all other clients
    chatroomClients.forEach((client) => {
      if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ type: 'message', data: messageWithId }));
      }
    });
  });

  ws.on('close', () => {
    console.log(`Client disconnected from chatroom: ${clientId}`);
    chatroomClients = chatroomClients.filter((client) => client.socket !== ws);
  });
});

// Wavelength WebSocket server logic
wavelengthWSS.on('connection', (ws) => {
  console.log('New client connected to wavelength');

  // Function to broadcast the number of connected clients
  const broadcastClientStatus = () => {
    const clients = wavelengthWSS.clients.size; // Total connected clients
    wavelengthWSS.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'client-status', clients }));
      }
    });
  };

  // Broadcast client status on connection
  broadcastClientStatus();

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'message') {
      // Broadcast message to other clients
      wavelengthWSS.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'message', message: data.message }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from wavelength');
    // Broadcast updated client status
    broadcastClientStatus();
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
