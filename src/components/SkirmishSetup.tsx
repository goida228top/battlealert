import React from 'react';
import { Faction, Country } from '../game/types';
import { GameEngine } from '../game/GameEngine';

interface SkirmishSetupProps {
  selectedFaction: Faction;
  setSelectedFaction: (faction: Faction) => void;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  selectedMap: string;
  setSelectedMap: (map: string) => void;
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'SETTINGS') => void;
  engineRef: React.MutableRefObject<GameEngine>;
  setGameState: (state: any) => void;
}

export const SkirmishSetup: React.FC<SkirmishSetupProps> = ({
  selectedFaction,
  setSelectedFaction,
  selectedCountry,
  setSelectedCountry,
  selectedMap,
  setSelectedMap,
  setAppState,
  engineRef,
  setGameState
}) => {
  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[url('/assets/soviet_base.png')] bg-cover bg-center overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative z-10 flex-1 flex flex-col p-2 md:p-4 lg:p-8 min-h-0 w-full">
        <div className="flex-1 overflow-y-auto pr-1">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-red-600 mb-2 md:mb-4 uppercase tracking-tighter font-display text-center md:text-left">
            Настройка Сражения
          </h1>
          
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 lg:gap-8">
            {/* Left Panel: Player Settings */}
            <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-3 md:p-4 flex flex-col gap-2 md:gap-4">
              <h2 className="text-base md:text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-1 md:pb-2">Настройка игрока</h2>
              
              <div className="flex flex-col gap-2 md:gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs md:text-sm font-bold mb-1 md:mb-2 uppercase tracking-wider">Сторона</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedFaction('FEDERATION'); setSelectedCountry('RUSSIA'); }}
                      className={`flex-1 py-1 md:py-3 text-xs md:text-base font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'FEDERATION' ? 'bg-red-700 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                    >
                      Федерация
                    </button>
                    <button 
                      onClick={() => { setSelectedFaction('COALITION'); setSelectedCountry('AMERICA'); }}
                      className={`flex-1 py-1 md:py-3 text-xs md:text-base font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'COALITION' ? 'bg-blue-700 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                    >
                      Коалиция
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs md:text-sm font-bold mb-1 md:mb-2 uppercase tracking-wider">Страна</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 md:gap-2">
                    {selectedFaction === 'FEDERATION' ? (
                      <>
                        <button onClick={() => setSelectedCountry('RUSSIA')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'RUSSIA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Россия</button>
                        <button onClick={() => setSelectedCountry('CUBA')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'CUBA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Куба</button>
                        <button onClick={() => setSelectedCountry('LIBYA')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'LIBYA' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Ливия</button>
                        <button onClick={() => setSelectedCountry('IRAQ')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'IRAQ' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Ирак</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setSelectedCountry('AMERICA')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'AMERICA' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Америка</button>
                        <button onClick={() => setSelectedCountry('BRITAIN')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'BRITAIN' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Британия</button>
                        <button onClick={() => setSelectedCountry('FRANCE')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'FRANCE' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Франция</button>
                        <button onClick={() => setSelectedCountry('GERMANY')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border ${selectedCountry === 'GERMANY' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Германия</button>
                        <button onClick={() => setSelectedCountry('KOREA')} className={`py-1 md:py-2 text-[10px] md:text-xs font-bold uppercase border col-span-2 lg:col-span-1 ${selectedCountry === 'KOREA' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>Корея</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="md:mt-2 p-2 md:p-3 bg-black/40 border border-zinc-800">
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
            <div className="flex-1 bg-zinc-900/80 border border-zinc-700 p-3 md:p-6 flex flex-col gap-2 md:gap-6">
              <h2 className="text-base md:text-xl font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-700 pb-1 md:pb-2">Настройка игры</h2>
              
              <div>
                <label className="block text-zinc-400 text-xs md:text-sm font-bold mb-1 md:mb-2 uppercase tracking-wider">Выбор карты</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedMap('RIVER_DIVIDE')}
                    className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-base text-left font-bold uppercase tracking-widest border-2 transition-all ${selectedMap === 'RIVER_DIVIDE' ? 'bg-zinc-700 text-white border-zinc-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    Разделение рекой (Умеренный)
                  </button>
                </div>
              </div>

              <div className="mt-2 md:mt-6 flex flex-col gap-1 md:gap-2">
                <label className="block text-zinc-400 text-xs md:text-sm font-bold uppercase tracking-wider">Сложность противника</label>
                <select 
                  id="skirmish-bot-difficulty"
                  className="bg-black border border-zinc-700 text-xs md:text-sm p-2 md:p-3 text-white font-bold tracking-widest outline-none focus:border-red-500 transition-colors"
                  defaultValue="NORMAL"
                >
                  <option value="EASY">Легкий</option>
                  <option value="NORMAL">Средний</option>
                  <option value="HARD">Тяжелый</option>
                </select>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 text-zinc-500 mt-2 md:mt-4 py-2 md:py-0 hidden md:flex">
                <span className="mb-1 md:mb-2">Превью карты (Недоступно)</span>
                <span className="text-[10px] md:text-xs text-zinc-600 text-center">
                  {selectedMap === 'RIVER_DIVIDE' && 'Река делит поле боя с двумя стратегическими мостами.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-row justify-between items-center w-full gap-2 md:gap-4 shrink-0 pb-6 md:pb-4 pt-2 lg:pt-4">
          <button 
            onClick={() => setAppState('MENU')}
            className="flex-1 md:flex-none py-2 md:py-4 px-4 md:px-12 text-xs md:text-base font-black uppercase tracking-widest border-2 bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 transition-all"
          >
            Назад
          </button>
          <button 
            onClick={() => {
              const botDiff = (document.getElementById('skirmish-bot-difficulty') as HTMLSelectElement)?.value || 'NORMAL';
              engineRef.current.resetGame(selectedFaction, selectedCountry, selectedMap, botDiff);
              
              const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
              const docElm = document.documentElement as any;
              const requestMethod = docElm.requestFullscreen || docElm.webkitRequestFullScreen || docElm.mozRequestFullScreen || docElm.msRequestFullscreen;
              
              if (isTouchDevice && !document.fullscreenElement && typeof requestMethod === 'function') {
                try {
                  requestMethod.call(docElm).catch(() => {});
                } catch (e) {}
              }
              
              setGameState(engineRef.current.state);
              setAppState('PLAYING');
            }}
            className={`flex-1 md:flex-none py-2 md:py-4 px-4 md:px-16 text-xs md:text-base font-black uppercase tracking-widest border-2 transition-all ${selectedFaction === 'FEDERATION' ? 'bg-red-700 hover:bg-red-600 text-white border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500/50 hover:border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
          >
            Начать
          </button>
        </div>
      </div>
    </div>
  );
};
