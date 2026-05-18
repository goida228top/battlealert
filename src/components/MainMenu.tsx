import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, loginWithGoogle, loginAsGuest, logout } from '../firebase';
import { LogOut } from 'lucide-react';

interface MainMenuProps {
  setAppState: (state: 'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'SETTINGS') => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  isLocalGuest?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setAppState, playerName, setPlayerName, isLocalGuest }) => {
  const [user, loading] = useAuthState(auth);
  const isAuthenticated = !!user || isLocalGuest;

  useEffect(() => {
    if (user && user.displayName && !user.isAnonymous) {
      setPlayerName(user.displayName.substring(0, 15));
    }
  }, [user, setPlayerName]);

  return (
    <div className="absolute inset-0 z-[200] flex flex-row bg-[url('/assets/soviet_base.png')] bg-cover bg-center overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      
      {/* Left side - Logo & Nickname */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 lg:p-4 min-h-0">
        <h1 className="text-4xl sm:text-6xl lg:text-[9rem] leading-none font-black text-red-600 mb-2 lg:mb-6 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] font-display text-center">
          Battle<br />Alert
        </h1>
        
        <div className="mt-2 lg:mt-4 flex flex-col items-center bg-black/60 p-2 sm:p-4 border border-zinc-800 relative">
          <label className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] lg:text-sm mb-1 lg:mb-2">
            Ваш Позывной
          </label>
          <div className="flex items-center gap-2">
            <input 
              id="nickname-input"
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-32 sm:w-48 lg:w-64 bg-zinc-900 border-2 border-zinc-700 focus:border-red-500 text-white text-center font-bold text-sm lg:text-xl py-1 lg:py-2 px-2 outline-none transition-colors"
              placeholder="Командир"
              maxLength={15}
            />
            <button onClick={() => { logout(); window.location.reload(); }} className="p-2 bg-red-900/50 hover:bg-red-800 border-2 border-red-700 text-red-200 transition-colors" title="Выйти">
              <LogOut size={20} />
            </button>
          </div>
          {(user?.isAnonymous || isLocalGuest) && <span className="text-[10px] text-zinc-500 mt-1 uppercase">Режим гостя</span>}
        </div>
      </div>

      {/* Right side - Menu Buttons */}
      <div className="relative z-10 w-40 sm:w-64 lg:w-96 bg-zinc-950/80 border-l-2 border-red-900/50 p-4 lg:p-6 flex flex-col justify-center min-h-0">
        <div className="flex flex-col gap-2 lg:gap-4 w-full">
          <button 
            id="btn-skirmish"
            disabled={!isAuthenticated}
            onClick={() => setAppState('SKIRMISH_SETUP')}
            className={`w-full py-3 lg:py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-[10px] sm:text-sm lg:text-xl transition-all border-l-2 lg:border-l-4 ${!isAuthenticated ? 'text-zinc-600 border-transparent cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-red-900/40 border-transparent hover:border-red-500'}`}
          >
            Сражение (Боты)
          </button>
          <button 
            id="btn-multiplayer"
            disabled={!isAuthenticated}
            onClick={() => setAppState('MULTIPLAYER_LOBBY')}
            className={`w-full py-3 lg:py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-[10px] sm:text-sm lg:text-xl transition-all border-l-2 lg:border-l-4 ${!isAuthenticated ? 'text-zinc-600 border-transparent cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-red-900/40 border-transparent hover:border-red-500'}`}
          >
            Мультиплеер
          </button>
          <button 
            id="btn-settings"
            onClick={() => setAppState('SETTINGS')}
            className="w-full py-3 lg:py-4 text-center lg:text-left lg:px-6 font-black uppercase tracking-widest text-[10px] sm:text-sm lg:text-xl text-zinc-300 hover:text-white hover:bg-red-900/40 border-l-2 lg:border-l-4 border-transparent hover:border-red-500 transition-all"
          >
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
};

