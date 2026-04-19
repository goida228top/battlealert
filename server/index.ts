import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { GameEngine } from "../src/game/GameEngine";

const rooms = new Map();
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

  // Aggressive heartbeat to force-sync all clients every 2 seconds
  setInterval(() => {
    const list = getRoomsList();
    io.sockets.emit('rooms_list', list);
    io.sockets.emit('server_stats', {
      online: io.engine.clientsCount,
      rooms: list.length,
      uptime: process.uptime()
    });
  }, 2000);

  // Server Game Loop!
  setInterval(() => {
    const now = performance.now();
    for (const room of rooms.values()) {
        if (room.inGame && room.engine) {
            room.engine.update(now);
            const syncState = {
                entities: room.engine.state.entities.map((e: any) => ({
                    id: e.id, health: e.health, maxHealth: e.maxHealth, owner: e.owner,
                    subType: e.subType, type: e.type, size: e.size, speed: e.speed,
                    isDeployed: e.isDeployed, targetPosition: e.targetPosition,
                    targetId: e.targetId, rank: e.rank, isRepairing: e.isRepairing,
                    position: e.position, rotation: e.rotation,
                    harvestState: e.harvestState, harvestAmount: e.harvestAmount,
                    occupiedBy: e.occupiedBy, constructionStartTime: e.constructionStartTime,
                    mindControlledBy: e.mindControlledBy, rallyPoint: e.rallyPoint,
                    isDisguised: e.isDisguised, kills: e.kills
                })),
                credits: room.engine.state.credits,
                p2Credits: room.engine.state.p2Credits,
                p3Credits: room.engine.state.p3Credits,
                p4Credits: room.engine.state.p4Credits,
                productionQueue: room.engine.state.productionQueue,
                p2ProductionQueue: room.engine.state.p2ProductionQueue,
                p3ProductionQueue: room.engine.state.p3ProductionQueue,
                p4ProductionQueue: room.engine.state.p4ProductionQueue,
                effects: room.engine.state.effects,
                projectiles: room.engine.state.projectiles,
                crates: room.engine.state.crates,
                ironCurtainActive: room.engine.state.ironCurtainActive,
                specialAbilities: room.engine.state.specialAbilities,
                p2SpecialAbilities: room.engine.state.p2SpecialAbilities,
                p3SpecialAbilities: room.engine.state.p3SpecialAbilities,
                p4SpecialAbilities: room.engine.state.p4SpecialAbilities,
                power: room.engine.state.power,
                powerConsumption: room.engine.state.powerConsumption,
                p2Power: room.engine.state.p2Power,
                p2PowerConsumption: room.engine.state.p2PowerConsumption,
                p3Power: room.engine.state.p3Power,
                p3PowerConsumption: room.engine.state.p3PowerConsumption,
                p4Power: room.engine.state.p4Power,
                p4PowerConsumption: room.engine.state.p4PowerConsumption,
                playerMappings: room.engine.state.playerMappings,
                playerColors: room.engine.state.playerColors
            };
            io.to(room.id).emit('game_state_update', syncState);
        }
    }
  }, 100); // 10 updates a second

  io.on('connection', (socket) => {
    globalConnectionsCount++;
    console.log(`[JOIN] ${socket.id} (Total: ${io.engine.clientsCount})`);
    
    // Immediate full sync for the newcomer
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

    socket.on('create_room', (data) => {
      console.log(`[CREATE] ${socket.id} -> ${data.name}`);
      const roomId = Math.random().toString(36).substring(7);
      const room = {
        id: roomId,
        name: data.name || 'Game Room',
        map: data.map,
        hostId: socket.id,
        botCount: 0,
        players: [{ ...data.player, id: socket.id, ready: true, isHost: true, color: 'RED' }]
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room_update', room);
      
      // Global broadcast to everyone!
      io.sockets.emit('rooms_list', getRoomsList());
    });

    socket.on('join_room', (data) => {
      console.log(`[JOIN_ROOM] ${socket.id} -> ${data.roomId}`);
      const room = rooms.get(data.roomId);
      if (room && room.players.length < 4) {
        const color = assignColor(room.players);
        room.players.push({ ...data.player, id: socket.id, ready: true, isHost: false, color });
        socket.join(room.id);
        io.to(room.id).emit('room_update', room);
        io.sockets.emit('rooms_list', getRoomsList());
      } else {
        socket.emit('room_error', 'Комната полна или не существует.');
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
      if (room && room.hostId === socket.id && room.players.length < 4) {
        const color = assignColor(room.players);
        room.botCount++;
        room.players.push({
           name: `Бот ${room.botCount}`,
           id: `bot-${Math.random().toString(36).substring(7)}`,
           isHost: false,
           ready: true,
           faction: Math.random() > 0.5 ? 'FEDERATION' : 'COALITION',
           country: 'RUSSIA', // default
           color,
           isBot: true
        });
        io.to(room.id).emit('room_update', room);
      }
    });

    socket.on('remove_bot', (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.hostId === socket.id) {
        const idx = room.players.findIndex((p: any) => p.id === data.botId && p.isBot);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          io.to(room.id).emit('room_update', room);
        }
      }
    });

    socket.on('start_game', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
          room.inGame = true;
          room.engine = new GameEngine();
          room.engine.role = 'SERVER'; // So it processes all logic

          // Map slots
          const mappings: any = {};
          const colors: any = {};
          let slotIdx = 1;
          const slots = ['PLAYER', 'PLAYER_2', 'PLAYER_3', 'PLAYER_4'];
          room.engine.state = { botSlots: [] } as any;

          room.players.forEach((p: any) => {
              const slot = slots[slotIdx - 1];
              mappings[p.id] = slot;
              colors[slot] = p.color;
              if (p.isBot) {
                 room.engine.state.botSlots.push(slot);
              }
              slotIdx++;
          });

          room.engine.initGame(room.map); // re-init correctly
          room.engine.state.playerMappings = mappings;
          room.engine.state.playerColors = colors;
          room.engine.state.botSlots = room.engine.state.botSlots || [];
          // apply factions
          room.players.forEach((p: any) => {
              const slot = mappings[p.id];
              const base = room.engine.state.entities.find((e: any) => e.owner === slot && (e.subType === 'MCV' || e.subType === 'ALLIED_MCV'));
              if (base) {
                  base.subType = p.faction === 'COALITION' ? 'ALLIED_MCV' : 'MCV';
              }
          });

          io.to(roomId).emit('game_started');
      }
    });

    socket.on('client_command', (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.engine && room.engine.state.playerMappings) {
          const slot = room.engine.state.playerMappings[socket.id];
          if (slot) {
              // Forced logic: the server decides the owner!
              const command = { ...data.command, owner: slot };
              room.engine.executeRemoteCommand(command);
          }
      }
    });

    socket.on('chat_message', (data) => {
      io.to(data.roomId).emit('chat_message', { sender: data.sender, text: data.text });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnect: ${socket.id}`);
      for (const [id, room] of rooms.entries()) {
        const pIndex = room.players.findIndex((p: any) => p.id === socket.id);
        if (pIndex !== -1) {
          console.log(`[Socket] Removing player ${socket.id} from room ${id}`);
          room.players.splice(pIndex, 1);
          if (room.players.length === 0) {
            console.log(`[Socket] Room ${id} is empty. Deleting.`);
            rooms.delete(id);
          } else {
            // Re-assign host if host left
            if (socket.id === room.hostId && room.players.length > 0) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
              console.log(`[Socket] New host for room ${id}: ${room.hostId}`);
            }
            io.to(id).emit('room_update', room);
          }
          io.emit('rooms_list', getRoomsList());
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
