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

  useEffect(() => {
    socket.connect();
    
    const handleRoomsList = (list: Room[]) => {
      setRooms(list);
    };

    socket.on('connect', () => {
      setStatus('Подключение к серверу установлено (v 1.2.0)');
      socket.emit('get_rooms');
    });

    socket.on('disconnect', () => {
      setStatus('Подключение разорвано. Ожидание сети...');
    });

    socket.on('rooms_list', handleRoomsList);

    const onRoomUpdate = (room: any) => {
       setRoomId(room.id);
       setAppState('MULTIPLAYER_ROOM');
    };
    socket.on('room_update', onRoomUpdate);

    // Initial check and request
    if (socket.connected) {
      setStatus('Подключение к серверу установлено (v 1.2.0)');
      socket.emit('get_rooms');
    }

    // Polling as a fallback to ensure visibility
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('get_rooms');
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('rooms_list', handleRoomsList);
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
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center text-white">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col h-full p-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-4xl font-black uppercase text-red-500 flex items-center gap-4">
              <Server size={36} /> Мультиплеер: Лобби
            </h1>
            <p className={status.includes('разорвано') ? "text-red-400 mt-2" : "text-green-400 mt-2"}>
               {status}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setAppState('MULTIPLAYER_CREATE')}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 px-6 py-3 rounded text-xl font-bold uppercase transition-colors shadow-lg"
            >
              <PlusSquare size={24} /> Создать игру
            </button>
            <button
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded text-xl font-bold uppercase transition-colors"
              onClick={() => socket.emit('get_rooms')}
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded flex flex-col">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800 bg-zinc-900/80 font-bold uppercase text-zinc-400">
            <div className="col-span-2">Название комнаты</div>
            <div>Карта</div>
            <div>Игроки</div>
            <div>Пинг</div>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            {rooms.length === 0 && (
              <div className="p-8 text-center text-zinc-500 font-bold uppercase">
                Нет доступных комнат. Создайте новую игру!
              </div>
            )}
            {rooms.map((room) => (
              <div 
                key={room.id}
                className={`grid grid-cols-5 gap-4 p-4 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded transition-colors items-center group ${room.players >= room.maxPlayers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => room.players < room.maxPlayers && handleJoin(room.id)}
              >
                <div className="col-span-2 font-bold text-lg group-hover:text-red-400">{room.name}</div>
                <div className="text-zinc-300">{room.map}</div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Users size={16} className={room.players >= room.maxPlayers ? "text-red-500" : "text-green-500"} /> {room.players}/{room.maxPlayers}
                </div>
                <div className="text-green-500">{"< 50ms (Relay)"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setAppState('MENU')}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded text-xl font-bold uppercase transition-colors"
          >
            <ArrowLeft size={24} /> Назад
          </button>
        </div>
      </div>
    </div>
  );
};
