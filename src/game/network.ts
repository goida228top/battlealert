import { io, Socket } from 'socket.io-client';

// Если деплоим на Render, можно оставить пустым для текущего хоста
const SERVER_URL = '';

export const BUILD_VERSION = 'v1.3.2-STABLE';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
});
