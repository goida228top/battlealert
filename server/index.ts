import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { GameEngine } from "../src/game/GameEngine";

const rooms = new Map<string, any>();
let globalConnectionsCount = 0;

const getRoomsList = () => {
  return Array.from(rooms.values()).map(r => ({
    id: r.id, name: r.name, map: r.map, players: r.players.length, maxPlayers: 4
  }));
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling'],
    pingInterval: 5000,
    pingTimeout: 10000
  });

  // Server-side Game Loop
  setInterval(() => {
    rooms.forEach(room => {
      if (room.gameStarted && room.engine) {
        room.engine.update(Date.now());
        io.to(room.id).emit('game_state_update', room.engine.state);
      }
    });
  }, 50); // ~20 ticks per second is enough for state sync, engine dt handles smoothing

  // Aggressive heartbeat tracking
  setInterval(() => {
    const list = getRoomsList();
    io.sockets.emit('rooms_list', list);
    io.sockets.emit('server_stats', {
      online: io.engine.clientsCount,
      rooms: list.length,
      uptime: process.uptime()
    });
  }, 2000);

  io.on('connection', (socket) => {
    globalConnectionsCount++;
    console.log(`[JOIN] ${socket.id} (Total: ${io.engine.clientsCount})`);
    
    socket.emit('rooms_list', getRoomsList());

    socket.on('get_rooms', () => {
      socket.emit('rooms_list', getRoomsList());
    });

    socket.on('get_room_info', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        socket.emit('room_update', room);
      }
    });

    const assignColor = (players: any[]) => {
      const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
      for (const color of colors) {
        if (!players.find(p => p.color === color)) return color;
      }
      return 'RED'; // fallback
    };

    const leaveAllRooms = () => {
      for (const [id, room] of rooms.entries()) {
        const initialCount = room.players.length;
        room.players = room.players.filter((p: any) => p.id !== socket.id);
        
        if (room.players.length !== initialCount) {
          socket.leave(id);
          if (room.players.length === 0) {
            rooms.delete(id);
          } else {
            if (socket.id === room.adminId) {
              const newAdmin = room.players.find((p: any) => !p.isBot);
              if (newAdmin) {
                room.adminId = newAdmin.id;
                newAdmin.isAdmin = true;
              }
            }
            io.to(id).emit('room_update', room);
          }
        }
      }
    };

    socket.on('create_room', (data) => {
      console.log(`[CREATE] ${socket.id} -> ${data.name}`);
      leaveAllRooms(); // Чистим старые привязки
      const roomId = Math.random().toString(36).substring(7);
      const room = {
        id: roomId,
        name: data.name || 'Название комнаты',
        map: data.map,
        adminId: socket.id,
        botCount: 0,
        players: [{ ...data.player, id: socket.id, ready: true, isAdmin: true, color: 'RED' }],
        gameStarted: false,
        engine: null
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room_update', room);
      io.sockets.emit('rooms_list', getRoomsList());
    });

    socket.on('join_room', (data) => {
      console.log(`[JOIN_ROOM] ${socket.id} -> ${data.roomId}`);
      leaveAllRooms(); // Сначала выходим из всех старых комнат
      const room = rooms.get(data.roomId);
      if (room) {
        if (room.players.length < 4) {
          const color = assignColor(room.players);
          room.players.push({ ...data.player, id: socket.id, ready: true, isAdmin: false, color });
          socket.join(room.id);
          io.to(room.id).emit('room_update', room);
          io.sockets.emit('rooms_list', getRoomsList());
        } else {
          socket.emit('room_error', 'Комната полна.');
        }
      } else {
        socket.emit('room_error', 'Комната не существует.');
      }
    });

    socket.on('update_player', (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.faction = data.faction || player.faction;
          player.country = data.country || player.country;
          io.to(room.id).emit('room_update', room);
        }
      }
    });

    socket.on('add_bot', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.adminId === socket.id && room.players.length < 4) {
        const color = assignColor(room.players);
        room.botCount++;
        room.players.push({
           name: `Бот ${room.botCount}`,
           id: `bot-${Math.random().toString(36).substring(7)}`,
           isAdmin: false,
           ready: true,
           faction: Math.random() > 0.5 ? 'FEDERATION' : 'COALITION',
           country: 'RUSSIA',
           color,
           isBot: true
        });
        io.to(room.id).emit('room_update', room);
      }
    });

    socket.on('remove_bot', (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.adminId === socket.id) {
        const idx = room.players.findIndex((p: any) => p.id === data.botId && p.isBot);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          io.to(room.id).emit('room_update', room);
        }
      }
    });

    socket.on('start_game', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.adminId === socket.id) {
        console.log(`[START] Game in room ${roomId}`);
        room.gameStarted = true;
        
        // Initialize Server Game Engine
        const engine = new GameEngine('FEDERATION', 'RUSSIA', 'SERVER');
        engine.roomId = roomId;
        engine.state.botSlots = [];
        
        const slots = ['PLAYER', 'AI', 'PLAYER_3', 'PLAYER_4'];
        room.players.forEach((p: any, index: number) => {
            const slot = slots[index % slots.length];
            engine.state.playerMappings![p.id] = slot;
            engine.state.playerColors![slot] = p.color;
            if (p.isBot) {
                engine.state.botSlots?.push(slot);
            }
        });
        
        engine.resetGame('FEDERATION', 'RUSSIA', room.map);
        room.engine = engine;
        
        io.to(roomId).emit('game_started');
      }
    });

    socket.on('client_command', (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.engine) {
        // Server handles command directly
        room.engine.executeRemoteCommand(data.command);
      }
    });

    socket.on('chat_message', (data) => {
      io.to(data.roomId).emit('chat_message', { sender: data.sender, text: data.text });
    });

    socket.on('leave_room', (roomId) => {
      console.log(`[LEAVE_ROOM] ${socket.id}`);
      leaveAllRooms();
      io.sockets.emit('rooms_list', getRoomsList());
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnect: ${socket.id}`);
      leaveAllRooms();
      io.emit('rooms_list', getRoomsList());
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
