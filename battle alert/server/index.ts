import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  // Use process.env.PORT, otherwise default to 3000 which AI studio expects for external traffic
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    socket.on('get_rooms', () => {
      const roomsList = Array.from(rooms.values()).map(r => ({
        id: r.id, name: r.name, map: r.map, players: r.players.length, maxPlayers: 2
      }));
      socket.emit('rooms_list', roomsList);
    });

    socket.on('create_room', (data) => {
      const roomId = Math.random().toString(36).substring(7);
      const room = {
        id: roomId,
        name: data.name || 'Game Room',
        map: data.map,
        hostId: socket.id,
        players: [{ ...data.player, id: socket.id, ready: true, isHost: true }]
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room_update', room);
      
      const roomsList = Array.from(rooms.values()).map(r => ({
        id: r.id, name: r.name, map: r.map, players: r.players.length, maxPlayers: 2
      }));
      io.emit('rooms_list', roomsList);
    });

    socket.on('join_room', (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.players.length < 2) {
        room.players.push({ ...data.player, id: socket.id, ready: true, isHost: false });
        socket.join(room.id);
        io.to(room.id).emit('room_update', room);
        
        const roomsList = Array.from(rooms.values()).map(r => ({
          id: r.id, name: r.name, map: r.map, players: r.players.length, maxPlayers: 2
        }));
        io.emit('rooms_list', roomsList);
      } else {
        socket.emit('room_error', 'Комната полна или не существует.');
      }
    });

    socket.on('start_game', (roomId) => {
      io.to(roomId).emit('game_started');
    });

    socket.on('host_state_update', (data) => {
      socket.to(data.roomId).emit('game_state_update', data.state);
    });

    socket.on('client_command', (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        io.to(room.hostId).emit('remote_command', data.command);
      }
    });

    socket.on('chat_message', (data) => {
      io.to(data.roomId).emit('chat_message', { sender: data.sender, text: data.text });
    });

    socket.on('disconnect', () => {
      for (const [id, room] of rooms.entries()) {
        const pIndex = room.players.findIndex((p: any) => p.id === socket.id);
        if (pIndex !== -1) {
          room.players.splice(pIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(id);
          } else {
            // Re-assign host if host left
            if (socket.id === room.hostId && room.players.length > 0) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
            }
            io.to(id).emit('room_update', room);
          }
          const roomsList = Array.from(rooms.values()).map(r => ({
            id: r.id, name: r.name, map: r.map, players: r.players.length, maxPlayers: 2
          }));
          io.emit('rooms_list', roomsList);
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
