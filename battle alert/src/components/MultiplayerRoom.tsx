import React, { useState, useEffect } from 'react';
import { Faction, Country } from '../game/types';
import { GameEngine } from '../game/GameEngine';
import { User, Anchor, AlertCircle, ArrowLeft } from 'lucide-react';
import { socket } from '../game/network';

interface MultiplayerRoomProps {
  selectedFaction: Faction;
  selectedCountry: Country;
  selectedMap: string;
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_CREATE' | 'MULTIPLAYER_ROOM') => void;
  engineRef: React.MutableRefObject<GameEngine>;
  setGameState: (state: any) => void;
  roomId?: string; // We expect roomId to be passed or derived
}

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  selectedFaction,
  selectedCountry,
  selectedMap,
  setAppState,
  engineRef,
  setGameState,
  roomId
}) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    socket.on('room_update', (room) => {
      setRoomInfo(room);
      setPlayers(room.players);
    });

    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('game_started', () => {
      const isHost = players.find(p => p.id === socket.id)?.isHost;
      const role = isHost ? 'HOST' : 'CLIENT';
      const p2 = players.find(p => p.id !== socket.id);
      
      const hostP = players.find(p => p.isHost);
      const hostFaction = hostP?.faction || selectedFaction;
      const hostCountry = hostP?.country || selectedCountry;
      
      // Let engine configure map based on host's choices
      engineRef.current.resetGame(hostFaction, hostCountry, roomInfo?.map || selectedMap);
      
      // We will init AI to take place of disconnected players natively handling offline, but here we inject proper network mode.
      engineRef.current.initMultiplayer(role, roomInfo?.id, socket);
      
      // Override local faction/country for client
      if (role === 'CLIENT') {
          engineRef.current.state.playerFaction = selectedFaction;
          engineRef.current.state.playerCountry = selectedCountry;
      }
      
      setGameState(engineRef.current.state);
      setAppState('PLAYING');
    });

    return () => {
      socket.off('room_update');
      socket.off('game_started');
      socket.off('chat_message');
    };
  }, [players, roomInfo]);

  const handleStart = () => {
    if (roomInfo) {
      socket.emit('start_game', roomInfo.id);
    }
  };

  const sendChatMessage = () => {
    if (messageInput.trim() && roomInfo) {
      socket.emit('chat_message', { roomId: roomInfo.id, text: messageInput.trim(), sender: players.find(p => p.id === socket.id)?.name || 'Игрок' });
      setMessageInput('');
    }
  };

  const isHost = players.find(p => p.id === socket.id)?.isHost;

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center text-white">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col h-full p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-black text-red-600 mb-2 uppercase tracking-tighter font-display">
          Игровая Комната {roomInfo ? `- ${roomInfo.name}` : ''}
        </h1>
        <p className="text-zinc-400 mb-8 font-bold">Карта: {roomInfo ? roomInfo.map : selectedMap}</p>

        <div className="flex-1 flex gap-8">
          {/* Players List */}
          <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-4">Игроки</h2>
            
            <div className="flex flex-col gap-2 flex-1">
              {players.map(player => (
                <div key={player.id} className="flex justify-between items-center bg-zinc-800 p-4 border border-zinc-700 rounded">
                  <div className="flex items-center gap-4">
                    <User size={24} className={player.faction === 'FEDERATION' ? 'text-red-500' : 'text-blue-500'} />
                    <span className="font-bold text-lg">{player.name} {player.id === socket.id ? '(Вы)' : ''}</span>
                    {player.isHost && <span className="text-xs bg-red-600 px-2 py-1 rounded text-white font-bold ml-2">ХОСТ</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 uppercase text-sm font-bold">{player.country}</span>
                    <span className={`px-3 py-1 font-bold text-xs uppercase rounded ${player.ready ? 'bg-green-600/20 text-green-500' : 'bg-yellow-600/20 text-yellow-500'}`}>
                      {player.ready ? 'Готов' : 'Ждет'}
                    </span>
                  </div>
                </div>
              ))}
              
              {players.length < 2 && (
                <div className="flex justify-center items-center bg-zinc-800/50 p-4 border border-dashed border-zinc-700 rounded text-zinc-500 animate-pulse">
                  Ожидание игроков...
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded flex gap-4 text-green-200 text-sm">
              <AlertCircle size={24} className="shrink-0" />
              <p>
                <b>Внимание:</b> Сетевая игра подключена. Синхронизация между клиентами работает через локальный/удаленный релей-сервер Node.js (Socket.io). Возможны отвалы при плохом интернете.
              </p>
            </div>
          </div>

          {/* Chat */}
          <div className="w-[400px] bg-zinc-900/80 border border-zinc-700 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-4">Чат</h2>
            
            <div className="flex-1 bg-black/50 border border-zinc-800 p-4 rounded overflow-auto flex flex-col justify-end space-y-2">
              <div className="text-zinc-500 text-sm mb-2">-------------------------</div>
              <div className="text-green-500 text-sm font-bold">Система: Вы присоединились к комнате.</div>
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-white text-sm">
                  <span className="font-bold text-blue-400">{msg.sender}:</span> {msg.text}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage() }}
                placeholder="Ваше сообщение..." 
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-red-500"
              />
              <button onClick={sendChatMessage} className="bg-zinc-700 hover:bg-zinc-600 px-4 font-bold rounded uppercase transition-colors">
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex justify-between items-center w-full">
          <button 
            onClick={() => {
              setAppState('MULTIPLAYER_LOBBY');
              // Optionally emit leave_room
              socket.emit('get_rooms');
            }}
            className="flex items-center gap-2 py-4 px-12 font-black uppercase tracking-widest border-2 bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 transition-all"
          >
            <ArrowLeft size={24} /> Покинуть комнату
          </button>
          
          <button 
            onClick={handleStart}
            disabled={players.length < 2 || !isHost}
            className={`py-4 px-16 font-black uppercase tracking-widest border-2 transition-all ${
              players.length < 2 || !isHost
                ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed' 
                : 'bg-red-700 hover:bg-red-600 text-white border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
            }`}
          >
            {isHost ? 'Начать игру' : 'Ожидание хоста'}
          </button>
        </div>
      </div>
    </div>
  );
};
