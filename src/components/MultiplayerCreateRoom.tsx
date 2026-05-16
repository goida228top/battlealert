import React, { useState } from 'react';
import { Faction, Country } from '../game/types';
import { socket } from '../game/network';

interface MultiplayerCreateRoomProps {
  selectedFaction: Faction;
  setSelectedFaction: (faction: Faction) => void;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  selectedMap: string;
  setSelectedMap: (map: string) => void;
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_CREATE' | 'MULTIPLAYER_ROOM' | 'SETTINGS') => void;
  setRoomId: (id: string) => void;
  playerName: string;
}

export const MultiplayerCreateRoom: React.FC<MultiplayerCreateRoomProps> = ({
  selectedFaction,
  setSelectedFaction,
  selectedCountry,
  setSelectedCountry,
  selectedMap,
  setSelectedMap,
  setAppState,
  setRoomId,
  playerName
}) => {
  const [roomName, setRoomName] = useState('Моя игра');

  React.useEffect(() => {
    const onRoomUpdate = (room: any) => {
      setRoomId(room.id);
      setAppState('MULTIPLAYER_ROOM');
    };
    socket.on('room_update', onRoomUpdate);
    return () => {
      socket.off('room_update', onRoomUpdate);
    };
  }, [setAppState, setRoomId]);

  const handleCreate = () => {
    socket.emit('create_room', {
      name: roomName,
      map: selectedMap,
      player: {
        name: playerName,
        faction: selectedFaction,
        country: selectedCountry
      }
    });
  };
  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative z-10 flex-1 flex flex-col p-2 md:p-4 max-w-6xl mx-auto w-full min-h-0">
        <div className="flex-1 overflow-y-auto pr-1">
          <h1 className="text-xl md:text-3xl font-black text-red-600 mb-2 md:mb-4 uppercase tracking-tighter font-display text-center md:text-left">
            Создание Комнаты
          </h1>
          
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 lg:gap-8">
            {/* Left Panel: Player Settings */}
            <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-3 md:p-4 flex flex-col gap-2 md:gap-4">
              <h2 className="text-base md:text-lg font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-1">Настройка игрока</h2>
              
              <div className="flex flex-col gap-2 md:gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase tracking-wider">Сторона</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedFaction('FEDERATION'); setSelectedCountry('RUSSIA'); }}
                      className={`flex-1 py-1 md:py-2 text-xs md:text-sm font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'FEDERATION' ? 'bg-red-700 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                    >
                      Федерация
                    </button>
                    <button 
                      onClick={() => { setSelectedFaction('COALITION'); setSelectedCountry('AMERICA'); }}
                      className={`flex-1 py-1 md:py-2 text-xs md:text-sm font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'COALITION' ? 'bg-blue-700 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                    >
                      Коалиция
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase tracking-wider">Страна</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 md:gap-2">
                    {selectedFaction === 'FEDERATION' ? (
                      <>
                        <button onClick={() => setSelectedCountry('RUSSIA')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'RUSSIA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Россия</button>
                        <button onClick={() => setSelectedCountry('CUBA')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'CUBA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Куба</button>
                        <button onClick={() => setSelectedCountry('LIBYA')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'LIBYA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Ливия</button>
                        <button onClick={() => setSelectedCountry('IRAQ')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'IRAQ' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Ирак</button>
                      </>
                    ) : (
                       <>
                        <button onClick={() => setSelectedCountry('AMERICA')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'AMERICA' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Америка</button>
                        <button onClick={() => setSelectedCountry('BRITAIN')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'BRITAIN' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Британия</button>
                        <button onClick={() => setSelectedCountry('FRANCE')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'FRANCE' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Франция</button>
                        <button onClick={() => setSelectedCountry('GERMANY')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'GERMANY' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Германия</button>
                        <button onClick={() => setSelectedCountry('KOREA')} className={`py-1 text-[10px] md:text-xs font-bold uppercase border col-span-2 lg:col-span-1 ${selectedCountry === 'KOREA' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Корея</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-1 md:mt-2 p-2 bg-black/40 border border-zinc-800 rounded">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Особое оружие:</div>
                  <div className="text-xs md:text-sm font-bold text-zinc-200 italic">
                    {selectedCountry === 'RUSSIA' && 'Тесла-танк: Эффективен против пехоты и легкой техники.'}
                    {selectedCountry === 'CUBA' && 'Террорист: Пехотинец-смертник с мощным зарядом.'}
                    {selectedCountry === 'LIBYA' && 'Демо-грузовик: Грузовик с ядерным зарядом.'}
                    {selectedCountry === 'IRAQ' && 'Опустошитель: Пехотинец, заражающий местность радиацией.'}
                    {selectedCountry === 'AMERICA' && 'Десант: Бесплатные десантники каждые несколько минут.'}
                    {selectedCountry === 'BRITAIN' && 'Снайпер: Дальнобойная пехота, мгновенно убивающая людей.'}
                    {selectedCountry === 'FRANCE' && 'Пушка: Мощное оборонительное орудие большой дальности.'}
                    {selectedCountry === 'GERMANY' && 'Истребитель танков: Бронетехника для борьбы с танками.'}
                    {selectedCountry === 'KOREA' && 'Черный орел: Улучшенный самолет с мощными ракетами.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Game Settings */}
            <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-3 md:p-4 flex flex-col gap-2 md:gap-4">
              <h2 className="text-base md:text-lg font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-1">Настройки Карты</h2>
              
              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase tracking-wider">Выбор карты</label>
                <div className="flex flex-col gap-1 md:gap-2">
                  <button 
                    onClick={() => setSelectedMap('RIVER_DIVIDE')}
                    className={`py-1 md:py-2 px-2 md:px-4 text-xs md:text-sm text-left font-bold uppercase tracking-widest border-2 transition-all ${selectedMap === 'RIVER_DIVIDE' ? 'bg-zinc-700 text-white border-zinc-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    Разделение рекой (Умеренный)
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 text-zinc-500 mt-2 py-2 md:py-0 hidden md:flex">
                <span className="mb-1 text-xs">Превью карты (Недоступно)</span>
                <span className="text-[10px] md:text-xs text-zinc-600 text-center">
                  {selectedMap === 'RIVER_DIVIDE' && 'Река делит поле боя с двумя стратегическими мостами.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-2 md:mt-4 flex flex-col md:flex-row justify-between items-center w-full gap-2 md:gap-4 shrink-0 pb-1 md:pb-2 border-t border-zinc-800 pt-2 lg:pt-4">
          <button 
            onClick={() => setAppState('MULTIPLAYER_LOBBY')}
            className="flex-1 md:flex-none w-full md:w-auto py-2 px-6 md:px-12 text-sm md:text-base font-black uppercase tracking-widest border-2 bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 transition-all"
          >
            Отмена
          </button>
          <button 
            onClick={handleCreate}
            className={`flex-1 md:flex-none w-full md:w-auto py-2 px-8 md:px-16 text-sm md:text-base font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'FEDERATION' ? 'bg-red-700 hover:bg-red-600 text-white border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500/50 hover:border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};
