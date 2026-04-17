import React from 'react';

interface MainMenuProps {
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY') => void;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setAppState, playerName, setPlayerName }) => {
  return (
    <div className="absolute inset-0 z-[200] flex bg-[url('/assets/soviet_base.png')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Left side - Logo & Nickname */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-12">
        <h1 className="text-[10rem] leading-none font-black text-red-600 mb-8 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] font-display text-center">
          Battle<br />Alert
        </h1>
        
        {/* Nickname Input */}
        <div className="mt-8 flex flex-col items-center bg-black/60 p-6 border border-zinc-800 rounded">
          <label className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-2">
            Ваш Позывной
          </label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-64 bg-zinc-900 border-2 border-zinc-700 focus:border-red-500 text-white text-center font-bold text-xl py-2 px-4 rounded outline-none transition-colors"
            placeholder="Командир"
            maxLength={15}
          />
        </div>
      </div>

      {/* Right side - Menu Buttons */}
      <div className="relative z-10 w-96 bg-zinc-950/80 border-l-2 border-red-900/50 p-8 flex flex-col justify-end">
        <div className="flex flex-col gap-4 mb-12">
          <button 
            onClick={() => setAppState('SKIRMISH_SETUP')}
            className="w-full py-4 px-6 text-left font-black uppercase tracking-widest text-xl text-zinc-300 hover:text-white hover:bg-red-900/40 border-l-4 border-transparent hover:border-red-500 transition-all"
          >
            Сражение (С Ботами)
          </button>
          <button 
            onClick={() => setAppState('MULTIPLAYER_LOBBY')}
            className="w-full py-4 px-6 text-left font-black uppercase tracking-widest text-xl text-zinc-300 hover:text-white hover:bg-red-900/40 border-l-4 border-transparent hover:border-red-500 transition-all"
          >
            Мультиплеер
          </button>
          <button 
            className="w-full py-4 px-6 text-left font-black uppercase tracking-widest text-xl text-zinc-600 cursor-not-allowed border-l-4 border-transparent"
          >
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
};
