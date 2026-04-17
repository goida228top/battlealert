import React, { useState, useEffect } from 'react';
import { Faction, Country } from '../game/types';
import { GameEngine } from '../game/GameEngine';
import { User, Anchor, AlertCircle, ArrowLeft, Bot, Trash2 } from 'lucide-react';
import { socket } from '../game/network';

interface MultiplayerRoomProps {
  selectedFaction: Faction;
  selectedCountry: Country;
  selectedMap: string;
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_CREATE' | 'MULTIPLAYER_ROOM') => void;
  engineRef: React.MutableRefObject<GameEngine>;
  setGameState: (state: any) => void;
  roomId?: string; // We expect roomId to be passed or derived
  playerName: string;
}

const FACTIONS: { id: Faction, label: string }[] = [
  { id: 'FEDERATION', label: 'СССР (Советский Союз)' },
  { id: 'COALITION', label: 'Альянс' },
];

const COUNTRIES: Record<Faction, { id: Country, label: string }[]> = {
  FEDERATION: [
    { id: 'RUSSIA', label: 'Россия (Ракеты Тэсла)' },
    { id: 'CUBA', label: 'Куба (Террористы)' },
    { id: 'LIBYA', label: 'Ливия (Грузовики Разрушители)' },
    { id: 'IRAQ', label: 'Ирак (Дезоляторы)' },
  ],
  COALITION: [
    { id: 'AMERICA', label: 'США (Десант)' },
    { id: 'BRITAIN', label: 'Британия (Снайперы)' },
    { id: 'FRANCE', label: 'Франция (Гранд Пушка)' },
    { id: 'GERMANY', label: 'Германия (Танк-Уничтожитель)' },
    { id: 'KOREA', label: 'Корея (Черные Орлы)' },
  ],
};

const COLOR_MAP: Record<string, string> = {
  'RED': 'bg-red-500',
  'BLUE': 'bg-blue-500',
  'GREEN': 'bg-green-500',
  'YELLOW': 'bg-yellow-500'
};

const TEXT_COLOR_MAP: Record<string, string> = {
  'RED': 'text-red-500',
  'BLUE': 'text-blue-500',
  'GREEN': 'text-green-500',
  'YELLOW': 'text-yellow-500'
};

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  selectedFaction,
  selectedCountry,
  selectedMap,
  setAppState,
  engineRef,
  setGameState,
  roomId,
  playerName
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
      
      const hostP = players.find(p => p.isHost);
      const hostFaction = hostP?.faction || selectedFaction;
      const hostCountry = hostP?.country || selectedCountry;
      
      // We pass the full room info to the game engine now so it knows about all 4 players
      engineRef.current.resetGame(hostFaction, hostCountry, roomInfo?.map || selectedMap);
      
      engineRef.current.initMultiplayer(role, roomInfo?.id, socket, roomInfo);
      
      const me = players.find(p => p.id === socket.id);
      if (me) {
          engineRef.current.playerFaction = me.faction;
          engineRef.current.playerCountry = me.country;
      }
      
      setGameState(engineRef.current.state);
      setAppState('PLAYING');
    });

    return () => {
      socket.off('room_update');
      socket.off('game_started');
      socket.off('chat_message');
    };
  }, [players, roomInfo, selectedCountry, selectedFaction, selectedMap, setAppState, setGameState, engineRef]);

  useEffect(() => {
    if (roomId) {
      socket.emit('get_room_info', roomId);
    }
  }, [roomId]);

  const handleStart = () => {
    if (roomInfo && players.length >= 2) {
      socket.emit('start_game', roomInfo.id);
    }
  };

  const sendChatMessage = () => {
    if (messageInput.trim() && roomInfo) {
      socket.emit('chat_message', { roomId: roomInfo.id, text: messageInput.trim(), sender: playerName });
      setMessageInput('');
    }
  };

  const updateMySettings = (faction: string, country: string) => {
    socket.emit('update_player', { roomId: roomInfo?.id, faction, country });
  };

  const isHost = players.find(p => p.id === socket.id)?.isHost;
  const me = players.find(p => p.id === socket.id);

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
            <h2 className="text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-4 flex justify-between items-center">
              <span>Игроки ({players.length}/4)</span>
              {isHost && players.length < 4 && (
                <button 
                  onClick={() => socket.emit('add_bot', roomInfo?.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-sm px-3 py-1 rounded border border-zinc-600 flex items-center gap-2 transition-colors"
                >
                  <Bot size={16} /> Добавить Бота
                </button>
              )}
            </h2>
            
            <div className="flex flex-col gap-2 flex-1">
              {players.map(player => (
                <div key={player.id} className="flex justify-between items-center bg-zinc-800 p-4 border border-zinc-700 rounded relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${COLOR_MAP[player.color]}`} />
                  
                  <div className="ml-2 flex items-center gap-4">
                    {player.isBot ? (
                       <Bot size={24} className={TEXT_COLOR_MAP[player.color] || 'text-zinc-400'} />
                    ) : (
                       <User size={24} className={TEXT_COLOR_MAP[player.color] || 'text-zinc-400'} />
                    )}
                    <span className="font-bold text-lg">{player.name} {player.id === socket.id ? '(Вы)' : ''}</span>
                    {player.isHost && <span className="text-xs bg-red-600 px-2 py-1 rounded text-white font-bold ml-2">ХОСТ</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Settings Dropdowns for Me */}
                    {player.id === socket.id ? (
                      <div className="flex gap-2">
                        <select 
                          className="bg-black border border-zinc-700 text-xs p-1 rounded"
                          value={player.faction}
                          onChange={(e) => updateMySettings(e.target.value, COUNTRIES[e.target.value as Faction][0].id)}
                        >
                          {FACTIONS.map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
                        </select>
                        <select 
                          className="bg-black border border-zinc-700 text-xs p-1 rounded"
                          value={player.country}
                          onChange={(e) => updateMySettings(player.faction, e.target.value)}
                        >
                          {COUNTRIES[player.faction as Faction].map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="text-zinc-400 uppercase text-sm font-bold flex gap-2">
                        <span>{player.faction}</span> - <span>{player.country}</span>
                      </span>
                    )}

                    <span className={`px-3 py-1 font-bold text-xs uppercase rounded ${player.ready ? 'bg-green-600/20 text-green-500' : 'bg-yellow-600/20 text-yellow-500'}`}>
                      {player.ready ? 'Готов' : 'Ждет'}
                    </span>
                    
                    {isHost && player.isBot && (
                      <button 
                        onClick={() => socket.emit('remove_bot', { roomId: roomInfo?.id, botId: player.id })}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {players.length < 4 && (
                <div className="flex justify-center items-center bg-zinc-800/50 p-4 border border-dashed border-zinc-700 rounded text-zinc-500">
                  <span className="opacity-50">Свободный слот</span>
                </div>
              )}
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

