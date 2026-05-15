import React, { useState, useEffect } from 'react';
import { Users, Server, ArrowLeft, PlusSquare } from 'lucide-react';
import { socket } from '../game/network';

interface Room {
  id: string;
  name: string;
  map: string;
  players: number;
  maxPlayers: number;
}

interface MultiplayerLobbyProps {
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_CREATE' | 'MULTIPLAYER_ROOM') => void;
  setRoomId: (id: string) => void;
  playerName: string;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ setAppState, setRoomId, playerName }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState<string>('Подключение...');
  const [stats, setStats] = useState<{ online: number; rooms: number } | null>(null);

  useEffect(() => {
    socket.connect();
    
    const handleRoomsList = (list: Room[]) => {
      setRooms(list);
    };

    const handleStats = (s: any) => {
      setStats(s);
    };

    socket.on('connect', () => {
      setStatus(`v 1.3.0 | ID: ${socket.id?.substring(0, 5)}`);
      socket.emit('get_rooms');
    });

    socket.on('disconnect', () => {
      setStatus('Подключение разорвано. Ожидание сети...');
    });

    socket.on('rooms_list', handleRoomsList);
    socket.on('server_stats', handleStats);

    const onRoomUpdate = (room: any) => {
       setRoomId(room.id);
       setAppState('MULTIPLAYER_ROOM');
    };
    socket.on('room_update', onRoomUpdate);

    // Initial check and request
    if (socket.connected) {
      setStatus(`v 1.3.0 | ID: ${socket.id?.substring(0, 5)}`);
      socket.emit('get_rooms');
    }

    // Polling as a fallback to ensure visibility
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('get_rooms');
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('rooms_list', handleRoomsList);
      socket.off('server_stats', handleStats);
      socket.off('room_update', onRoomUpdate);
    };
  }, [setAppState, setRoomId]);

  const handleJoin = (id: string) => {
      socket.emit('join_room', { 
         roomId: id,
         player: { name: playerName, faction: 'COALITION', country: 'AMERICA' } 
      });
  };

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col h-full p-2 md:p-4 max-w-6xl mx-auto w-full min-h-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 md:mb-4 pb-2 border-b border-zinc-800 gap-2 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase text-red-500 flex items-center gap-2">
              <Server size={24} className="w-5 h-5 md:w-6 md:h-6" /> Мультиплеер: Лобби
            </h1>
            <p className={status.includes('разорвано') ? "text-red-400 mt-1 text-xs md:text-sm" : "text-green-400 mt-1 font-mono text-xs md:text-sm"}>
               {status} 
               {stats && ` | ОНЛАЙН: ${stats.online} | КОМНАТ: ${stats.rooms}`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <button
              onClick={() => setAppState('MULTIPLAYER_CREATE')}
              className="flex justify-center items-center gap-2 bg-red-700 hover:bg-red-600 px-3 md:px-4 py-2 rounded text-xs md:text-sm font-bold uppercase transition-colors shadow-lg w-full md:w-auto"
            >
              <PlusSquare size={16} className="w-4 h-4 md:w-5 md:h-5" /> Создать игру
            </button>
            <button
              className="flex justify-center items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 md:px-4 py-2 rounded text-xs md:text-sm font-bold uppercase transition-colors w-full md:w-auto"
              onClick={() => socket.emit('get_rooms')}
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded flex flex-col min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 p-2 border-b border-zinc-800 bg-zinc-900/80 font-bold uppercase text-zinc-400 text-[10px] md:text-xs">
            <div className="md:col-span-2">Название комнаты</div>
            <div className="hidden md:block">Карта</div>
            <div>Статус</div>
            <div className="hidden md:block">Пинг</div>
          </div>
          
          <div className="flex-1 overflow-auto p-1 md:p-2">
            {rooms.length === 0 && (
              <div className="p-4 md:p-8 text-center text-zinc-500 font-bold uppercase text-xs md:text-sm">
                Нет доступных комнат. Создайте новую игру!
              </div>
            )}
            {rooms.map((room) => (
              <div 
                key={room.id}
                className={`grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 p-2 md:p-3 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded transition-colors items-center group ${room.players >= room.maxPlayers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => room.players < room.maxPlayers && handleJoin(room.id)}
              >
                <div className="md:col-span-2 font-bold text-xs md:text-sm group-hover:text-red-400 truncate">{room.name}</div>
                <div className="hidden md:block text-zinc-300 text-[10px] md:text-xs truncate">{room.map}</div>
                <div className="flex items-center gap-1 md:gap-2 text-zinc-300 text-[10px] md:text-xs">
                  <Users size={14} className={room.players >= room.maxPlayers ? "text-red-500" : "text-green-500"} /> {room.players}/{room.maxPlayers}
                </div>
                <div className="hidden md:block text-green-500 text-[10px] md:text-xs">{"< 50ms (Relay)"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 md:mt-4 flex justify-between pb-1 md:pb-2 shrink-0">
          <button
            onClick={() => setAppState('MENU')}
            className="flex w-full md:w-auto justify-center items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 md:px-6 py-2 rounded text-sm md:text-base font-bold uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Назад
          </button>
        </div>
      </div>
    </div>
  );
};
