import { io, Socket } from 'socket.io-client';

// If deployed on Render, change the URL here, e.g., 'https://my-ra2-server.onrender.com'
// Empty string means it will connect to the same host natively (works for dev proxy)
const SERVER_URL = '';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
});
