// server.js (Node.js WebSocket chatroom server)
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Unique ID generator
const app = express();

app.use(express.static('public')); // Serve static files (HTML, JS, CSS)

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = []; // Store connected clients
let chatHistory = []; // Store chat messages

wss.on('connection', (ws) => {
  const clientId = uuidv4(); // Assign unique ID to each client
  console.log(`New client connected: ${clientId}`);
  clients.push({ id: clientId, socket: ws });

  // Send initial data (clientId and chat history)
  ws.send(JSON.stringify({ type: 'init', clientId, history: chatHistory }));

  // Handle incoming messages
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    const messageWithId = { ...parsedMessage, clientId };

    chatHistory.push(messageWithId); // Save to history

    // Broadcast the message to all other clients
    clients.forEach(client => {
      if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ type: 'message', data: messageWithId }));
      }
    });
  });

  // Remove client on disconnect
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    clients = clients.filter(client => client.socket !== ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});