import { io, Socket } from 'socket.io-client';

// Если деплоим на Render, можно оставить пустым для текущего хоста
const SERVER_URL = '';

export const BUILD_VERSION = 'v1.3.4-ULTRA';

// Persistent player ID to survive reconnections
const getPersistentId = () => {
  let id = localStorage.getItem('battle_alert_player_id');
  if (!id) {
    id = 'p-' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('battle_alert_player_id', id);
  }
  return id;
};

export const PLAYER_ID = getPersistentId();

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
});
