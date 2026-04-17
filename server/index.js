const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
    
    // Broadcast new rooms list to all
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
      socket.emit('room_error', 'Комната полна или не найдена');
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
    if (room && room.hostId) {
      io.to(room.hostId).emit('remote_command', data.command);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [id, room] of rooms.entries()) {
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(id);
        } else {
          if (socket.id === room.hostId && room.players.length > 0) {
            room.hostId = room.players[0].id; // Reassign host
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Standalone multiplayer server running on port ${PORT}`);
});
