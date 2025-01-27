const ws = new WebSocket('wss://nikos-testing-space-3f707f51b575.herokuapp.com/wavelength'); // Update for production: wss://your-app-name.herokuapp.com/wavelength

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const player1Data = document.getElementById('player1Data');
const player2Data = document.getElementById('player2Data');
let messageBuffer = [];
let ClientsConnected = 0;

// Handle WebSocket events
ws.onopen = () => {
  console.log('Connected to the WebSocket server');
};

ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'client-status') {
    // Update ClientsConnected based on the server broadcast
    ClientsConnected = data.clients; // Server sends the total number of connected clients
    console.log(`Clients connected: ${ClientsConnected}`);
  } else if (data.type === 'message') {
    // Safeguard message parsing
    if (!data.message || typeof data.message !== 'string') {
      console.error('Invalid message received:', data);
      return;
    }

    const message = data.message;

    // Add received message to Player 2's data
    const listItem = document.createElement('li');
    listItem.textContent = 'Sent'; // Placeholder for the countdown
    listItem.classList.add('received');
    player2Data.appendChild(listItem);

    // Add to buffer and start timer
    messageBuffer.push({ element: listItem, message });
    checkAndStartTimer();
  }
};

ws.onclose = () => {
  console.log('Disconnected from the WebSocket server');
};

// Send a message
function sendMessage() {
  if (ClientsConnected < 2) {
    alert(`No other client connected! Currently connected clients: ${ClientsConnected}`);
    return;
  }

  const message = messageInput.value.trim();
  if (message) {
    ws.send(JSON.stringify({ type: 'message', message }));

    // Add "sent" placeholder to Player 1's data
    const listItem = document.createElement('li');
    listItem.textContent = 'Sent';
    listItem.classList.add('sent');
    player1Data.appendChild(listItem);

    // Add to buffer and start timer
    messageBuffer.push({ element: listItem, message });
    checkAndStartTimer();

    // Clear the input field
    messageInput.value = '';
  }
}

// Timer and display logic
function checkAndStartTimer() {
    let playerMessages = [];
  if (messageBuffer.length === 2) {
    let countdown = 3;
    const interval = setInterval(() => {
      messageBuffer.forEach(({ element, message }) => {
        if (countdown > 0) {
          element.textContent = countdown.toString();
        } else {
          element.textContent = message;
          playerMessages.push(message);
        }
      });

      countdown--;

      if (countdown < 0) {
        clearInterval(interval);
        messageBuffer = [];
        if(playerMessages[0].toLowerCase()==playerMessages[1].toLowerCase()){
            alert("YOU WIN!!!!")
        }else{
            alert("Try again come on")
        }





      }
    }, 1000);
  }
}

// Add event listener for the Send button
sendButton.addEventListener('click', sendMessage);
