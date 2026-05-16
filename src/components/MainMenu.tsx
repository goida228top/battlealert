import React from 'react';

interface MainMenuProps {
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY') => void;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setAppState, playerName, setPlayerName }) => {
  return (
    <div className="absolute inset-0 z-[200] flex flex-col lg:flex-row bg-[url('/assets/soviet_base.png')] bg-cover bg-center overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      
      {/* Left side - Logo & Nickname */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 min-h-min py-8">
        <h1 className="text-6xl lg:text-[9rem] leading-none font-black text-red-600 mb-4 lg:mb-6 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] font-display text-center">
          Battle<br />Alert
        </h1>
        
        {/* Nickname Input */}
        <div className="mt-2 lg:mt-4 flex flex-col items-center bg-black/60 p-4 border border-zinc-800 rounded">
          <label className="text-zinc-400 font-bold uppercase tracking-widest text-xs lg:text-sm mb-2">
            Ваш Позывной
          </label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-48 lg:w-64 bg-zinc-900 border-2 border-zinc-700 focus:border-red-500 text-white text-center font-bold text-base lg:text-xl py-2 px-4 rounded outline-none transition-colors"
            placeholder="Командир"
            maxLength={15}
          />
        </div>
      </div>

      {/* Right side - Menu Buttons */}
      <div className="relative z-10 w-full lg:w-96 bg-zinc-950/80 border-t-2 lg:border-t-0 lg:border-l-2 border-red-900/50 p-6 flex flex-col justify-center min-h-min">
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => setAppState('SKIRMISH_SETUP')}
            className="w-full py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-sm lg:text-xl text-zinc-300 hover:text-white hover:bg-red-900/40 border-b-4 lg:border-b-0 lg:border-l-4 border-transparent hover:border-red-500 transition-all"
          >
            Сражение (С Ботами)
          </button>
          <button 
            onClick={() => setAppState('MULTIPLAYER_LOBBY')}
            className="w-full py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-sm lg:text-xl text-zinc-300 hover:text-white hover:bg-red-900/40 border-b-4 lg:border-b-0 lg:border-l-4 border-transparent hover:border-red-500 transition-all"
          >
            Мультиплеер
          </button>
          <button 
            className="w-full py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-sm lg:text-xl text-zinc-600 cursor-not-allowed border-b-4 lg:border-b-0 lg:border-l-4 border-transparent"
          >
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
};
