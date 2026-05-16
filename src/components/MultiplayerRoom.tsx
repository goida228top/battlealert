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
  const [botDifficulty, setBotDifficulty] = useState('NORMAL');

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
      const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const docElm = document.documentElement as any;
      const requestMethod = docElm.requestFullscreen || docElm.webkitRequestFullScreen || docElm.mozRequestFullScreen || docElm.msRequestFullscreen;
      
      if (isTouchDevice && !document.fullscreenElement && requestMethod) {
        try {
          requestMethod.call(docElm).catch(() => {});
        } catch (e) {}
      }
      
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
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative z-10 flex-1 flex flex-col p-2 md:p-8 max-w-6xl mx-auto w-full min-h-0">
        <div className="flex-1 overflow-y-auto pr-1">
          <h1 className="text-xl md:text-4xl font-black text-red-600 mb-1 md:mb-2 uppercase tracking-tighter font-display text-center md:text-left">
            Игровая Комната {roomInfo ? `- ${roomInfo.name}` : ''}
          </h1>
          <p className="text-zinc-400 mb-4 md:mb-8 font-bold text-xs md:text-base text-center md:text-left tracking-wide uppercase opacity-70">Карта: {roomInfo ? roomInfo.map : selectedMap}</p>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Players List */}
            <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-3 md:p-6 flex flex-col min-h-0">
              <h2 className="text-base md:text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-4 flex justify-between items-center">
                <span>Игроки ({players.length}/4)</span>
                {isHost && players.length < 4 && (
                  <div className="flex gap-2">
                    <select 
                      id="bot-difficulty-select"
                      className="bg-black border border-zinc-600 text-xs md:text-sm p-1 rounded text-white"
                      value={botDifficulty}
                      onChange={(e) => setBotDifficulty(e.target.value)}
                    >
                      <option value="EASY">Легкий</option>
                      <option value="NORMAL">Средний</option>
                      <option value="HARD">Тяжелый</option>
                    </select>
                    <button 
                      onClick={() => {
                        socket.emit('add_bot', { roomId: roomInfo?.id, difficulty: botDifficulty });
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-[10px] md:text-sm px-2 md:px-3 py-1 rounded border border-zinc-600 flex items-center gap-2 transition-colors"
                    >
                      <Bot size={14} className="md:w-4 md:h-4" /> +Бот
                    </button>
                  </div>
                )}
              </h2>
              
              <div className="flex flex-col gap-2">
                {players.map(player => (
                  <div key={player.id} className="flex justify-between items-center bg-zinc-800 p-2 md:p-4 border border-zinc-700 rounded relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-2 ${COLOR_MAP[player.color]}`} />
                    
                    <div className="ml-1 md:ml-2 flex items-center gap-2 md:gap-4">
                      {player.isBot ? (
                         <Bot size={18} className={`${TEXT_COLOR_MAP[player.color] || 'text-zinc-400'} md:w-6 md:h-6`} />
                      ) : (
                         <User size={18} className={`${TEXT_COLOR_MAP[player.color] || 'text-zinc-400'} md:w-6 md:h-6`} />
                      )}
                      <span className="font-bold text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{player.name} {player.id === socket.id ? '(Вы)' : ''}</span>
                      {player.isHost && <span className="text-[8px] md:text-xs bg-red-600 px-1 md:px-2 py-0.5 md:py-1 rounded text-white font-bold ml-1">ХОСТ</span>}
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      {/* Settings Dropdowns for Me */}
                      {player.id === socket.id ? (
                        <div className="flex gap-1 md:gap-2">
                          <select 
                            className="bg-black border border-zinc-700 text-[10px] p-1 rounded"
                            value={player.faction}
                            onChange={(e) => updateMySettings(e.target.value, COUNTRIES[e.target.value as Faction][0].id)}
                          >
                            {FACTIONS.map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
                          </select>
                          <select 
                            className="bg-black border border-zinc-700 text-[10px] p-1 rounded"
                            value={player.country}
                            onChange={(e) => updateMySettings(player.faction, e.target.value)}
                          >
                            {COUNTRIES[player.faction as Faction].map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-zinc-400 uppercase text-[8px] md:text-sm font-bold flex gap-1 md:gap-2">
                          <span>{player.faction}</span> - <span>{player.country}</span>
                        </span>
                      )}

                      <span className={`px-1 md:px-3 py-0.5 md:py-1 font-bold text-[8px] md:text-xs uppercase rounded ${player.ready ? 'bg-green-600/20 text-green-500' : 'bg-yellow-600/20 text-yellow-500'}`}>
                        {player.ready ? 'Готов' : 'Ждет'}
                      </span>
                      
                      {isHost && player.isBot && (
                        <button 
                          onClick={() => socket.emit('remove_bot', { roomId: roomInfo?.id, botId: player.id })}
                          className="text-red-500 hover:text-red-400 ml-1 md:ml-2"
                        >
                          <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {players.length < 4 && (
                  <div className="flex justify-center items-center bg-zinc-800/50 p-2 md:p-4 border border-dashed border-zinc-700 rounded text-zinc-500 text-[10px] md:text-sm">
                    <span className="opacity-50 tracking-widest uppercase">Свободный слот</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="w-full md:w-[400px] h-[200px] md:h-auto bg-zinc-900/80 border border-zinc-700 p-3 md:p-6 flex flex-col min-h-0">
              <h2 className="text-base md:text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-4">Чат</h2>
              
              <div className="flex-1 bg-black/50 border border-zinc-800 p-2 md:p-4 rounded overflow-y-auto flex flex-col space-y-1">
                <div className="text-zinc-500 text-[10px] md:text-sm mb-1 opacity-50">Бортовой журнал:</div>
                <div className="text-green-500 text-[10px] md:text-sm font-bold">Система: Вы в комнате.</div>
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-white text-[10px] md:text-sm">
                    <span className="font-bold text-blue-400">{msg.sender}:</span> {msg.text}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 md:mt-4 flex gap-2">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage() }}
                  placeholder="Текст..." 
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded px-2 md:px-3 py-1 md:py-2 text-[10px] md:text-sm text-white outline-none focus:border-red-500 transition-colors"
                />
                <button onClick={sendChatMessage} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 md:px-4 font-bold rounded uppercase transition-colors text-xs md:text-base">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 md:mt-8 flex flex-row justify-between items-center w-full gap-2 md:gap-4 shrink-0 pb-2 md:pb-4 border-t border-zinc-800 pt-2 lg:pt-4">
          <button 
            onClick={() => {
              setAppState('MULTIPLAYER_LOBBY');
              socket.emit('get_rooms');
            }}
            className="flex-1 md:flex-none py-2 md:py-4 px-4 md:px-12 text-xs md:text-base font-black uppercase tracking-widest border-2 bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} className="md:w-6 md:h-6" /> Покинуть
          </button>
          
          <button 
            onClick={handleStart}
            disabled={players.length < 2 || !isHost}
            className={`flex-1 md:flex-none py-2 md:py-4 px-4 md:px-16 text-xs md:text-base font-black uppercase tracking-widest border-2 transition-all ${
              players.length < 2 || !isHost
                ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed' 
                : 'bg-red-700 hover:bg-red-600 text-white border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
            }`}
          >
            {isHost ? 'В БОЙ' : 'ЖДЕМ ХОСТА'}
          </button>
        </div>
      </div>
    </div>
  );
};

