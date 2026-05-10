import { BuildingsTab } from './tabs/BuildingsTab';
import { InfantryTab } from './tabs/InfantryTab';
import { VehiclesTab } from './tabs/VehiclesTab';
import { DefenseTab } from './tabs/DefenseTab';
import React, { useEffect, useState, useRef } from 'react';
import { GameState, Vector2 } from '../game/types';
import { GameEngine } from '../game/GameEngine';
import { BuildButton } from './BuildButton';
import { Minimap } from './Minimap';
import { Wrench, DollarSign, Wind, Users, ShieldAlert, Bomb, Activity, Factory, Shield, Truck, Zap, Coins, Radar, Crosshair, Skull, Target, Layers, Cpu, Anchor, Waves, Square, User, Car, MoveDown } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  engineRef: React.MutableRefObject<GameEngine>;
  setGameState: (state: any) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, engineRef, setGameState }) => {
  const [displayedCredits, setDisplayedCredits] = useState(gameState.credits);
  const animationRef = useRef<number>();
  const creditsTargetRef = useRef(gameState.credits);

  // Update target ref when gameState changes
  useEffect(() => {
    const owner = engineRef.current.localPlayerId;
    const currentCredits = owner === 'PLAYER_2' ? (gameState.p2Credits || 0) : owner === 'PLAYER_3' ? (gameState.p3Credits || 0) : owner === 'PLAYER_4' ? (gameState.p4Credits || 0) : gameState.credits;
    creditsTargetRef.current = currentCredits;
  }, [gameState.credits, gameState.p2Credits, gameState.p3Credits, gameState.p4Credits, engineRef]);

  useEffect(() => {
    const updateCredits = () => {
      const target = creditsTargetRef.current;

      setDisplayedCredits(prev => {
        if (prev === target) return prev;
        const diff = target - prev;
        const step = Math.sign(diff) * Math.max(1, Math.floor(Math.abs(diff) * 0.15));
        
        if (Math.abs(diff) <= Math.abs(step)) {
          return target;
        }
        return prev + step;
      });
      animationRef.current = requestAnimationFrame(updateCredits);
    };
    
    animationRef.current = requestAnimationFrame(updateCredits);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []); 

  const owner = engineRef.current.localPlayerId;
  const localGameState = {
     ...gameState,
     credits: owner === 'PLAYER_2' ? (gameState.p2Credits || 0) : owner === 'PLAYER_3' ? (gameState.p3Credits || 0) : owner === 'PLAYER_4' ? (gameState.p4Credits || 0) : gameState.credits,
     productionQueue: owner === 'PLAYER_2' ? (gameState.p2ProductionQueue || []) : owner === 'PLAYER_3' ? (gameState.p3ProductionQueue || []) : owner === 'PLAYER_4' ? (gameState.p4ProductionQueue || []) : gameState.productionQueue,
     specialAbilities: owner === 'PLAYER_2' ? (gameState.p2SpecialAbilities || gameState.specialAbilities) : owner === 'PLAYER_3' ? (gameState.p3SpecialAbilities || gameState.specialAbilities) : owner === 'PLAYER_4' ? (gameState.p4SpecialAbilities || gameState.specialAbilities) : gameState.specialAbilities,
     power: owner === 'PLAYER_2' ? (gameState.p2Power || 0) : owner === 'PLAYER_3' ? (gameState.p3Power || 0) : owner === 'PLAYER_4' ? (gameState.p4Power || 0) : gameState.power,
     powerConsumption: owner === 'PLAYER_2' ? (gameState.p2PowerConsumption || 0) : owner === 'PLAYER_3' ? (gameState.p3PowerConsumption || 0) : owner === 'PLAYER_4' ? (gameState.p4PowerConsumption || 0) : gameState.powerConsumption,
  };

  return (
    <div className="w-[280px] bg-zinc-950 border-l-2 border-zinc-800 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.8)] relative z-20 overflow-hidden">
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Network Ping Indicator */}
      <div className="absolute top-2 left-2 z-50 pointer-events-none">
        <div className={`px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded flex items-center gap-1.5 border ${engineRef.current.ping > 150 ? 'border-red-900/50 text-red-500 shadow-[0_0_5px_rgba(239,68,68,0.3)]' : engineRef.current.ping > 75 ? 'border-yellow-900/50 text-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.3)]' : 'border-green-900/50 text-green-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${engineRef.current.ping > 150 ? 'bg-red-500' : engineRef.current.ping > 75 ? 'bg-yellow-500' : 'bg-green-500'} ${engineRef.current.ping > 150 ? 'animate-ping' : 'animate-pulse'}`} />
          <span className="text-[10px] font-mono font-black">{engineRef.current.ping} MS</span>
        </div>
      </div>

      {/* Minimap Section (Top) */}
      <div className="p-2 bg-zinc-900/50 border-b border-zinc-800 aspect-square flex items-center justify-center relative overflow-hidden">
        {localGameState.entities.some(e => e.type === 'BUILDING' && e.owner === engineRef.current.localPlayerId && (e.subType === 'RADAR' || e.subType === 'AIR_FORCE_COMMAND')) && localGameState.power >= localGameState.powerConsumption ? (
          <Minimap 
            gameState={localGameState} 
            onMinimapClick={(pos) => {
              const canvas = document.querySelector('canvas'); // Main game canvas
              if (!canvas) return;
              engineRef.current.state.camera.x = -pos.x * engineRef.current.state.camera.zoom + canvas.width / 2;
              engineRef.current.state.camera.y = -pos.y * engineRef.current.state.camera.zoom + canvas.height / 2;
              setGameState({ ...engineRef.current.state });
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 shadow-inner relative group">
            {/* Scanline overlay for the placeholder */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
            
            {engineRef.current.playerFaction === 'FEDERATION' ? (
              <div className="flex flex-col items-center opacity-40 group-hover:opacity-60 transition-opacity">
                <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center border-2 border-red-600/20">
                  <ShieldAlert className="w-12 h-12 text-red-700" />
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em]">Federation</span>
                  <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40 group-hover:opacity-60 transition-opacity">
                <div className="w-20 h-20 bg-blue-900/10 rounded-full flex items-center justify-center border-2 border-blue-600/20">
                  <Shield className="w-12 h-12 text-blue-700" />
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em]">Coalition</span>
                  <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-3 text-[9px] font-bold text-zinc-800 uppercase tracking-widest">
              Ожидание данных радара
            </div>
          </div>
        )}
      </div>

      {/* Credits Section */}
      <div className="px-4 py-2 bg-black border-b border-zinc-800 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-1 bg-zinc-900/50 rounded-sm border border-zinc-700 shadow-inner w-full justify-center">
          <span className="font-mono text-2xl font-black tracking-tighter text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">
            ${Math.floor(displayedCredits).toLocaleString('en-US')}
          </span>
        </div>
      </div>

      {/* Utility & Special Abilities Row */}
      <div className="p-2 bg-zinc-900/30 border-b border-zinc-800">
        <div className="grid grid-cols-2 gap-1 mb-1">
          <button 
            onClick={() => { engineRef.current.state.interactionMode = 'REPAIR'; setGameState({ ...engineRef.current.state }); }}
            className={`py-1.5 flex flex-col items-center justify-center rounded-sm border transition-all ${gameState.interactionMode === 'REPAIR' ? 'bg-zinc-700 border-zinc-400 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
            title="Ремонт (W)"
          >
            <Wrench className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { engineRef.current.state.interactionMode = 'SELL'; setGameState({ ...engineRef.current.state }); }}
            className={`py-1.5 flex flex-col items-center justify-center rounded-sm border transition-all ${gameState.interactionMode === 'SELL' ? 'bg-zinc-700 border-zinc-400 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
            title="Продажа ($)"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Tab Row */}
      <div className="flex gap-0.5 p-1 bg-black border-b border-zinc-800">
        <button 
          onClick={() => { engineRef.current.state.sidebarTab = 'BUILDINGS'; setGameState({ ...engineRef.current.state }); }}
          className={`flex-1 py-3 flex items-center justify-center rounded-sm transition-all border ${gameState.sidebarTab === 'BUILDINGS' ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-transparent text-zinc-600 hover:text-zinc-400'}`}
          title="Здания"
        >
          <Factory className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { engineRef.current.state.sidebarTab = 'DEFENSE'; setGameState({ ...engineRef.current.state }); }}
          className={`flex-1 py-3 flex items-center justify-center rounded-sm transition-all border ${gameState.sidebarTab === 'DEFENSE' ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-transparent text-zinc-600 hover:text-zinc-400'}`}
          title="Оборона"
        >
          <Shield className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { engineRef.current.state.sidebarTab = 'INFANTRY'; setGameState({ ...engineRef.current.state }); }}
          className={`flex-1 py-3 flex items-center justify-center rounded-sm transition-all border ${gameState.sidebarTab === 'INFANTRY' ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-transparent text-zinc-600 hover:text-zinc-400'}`}
          title="Пехота"
        >
          <Users className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { engineRef.current.state.sidebarTab = 'VEHICLES'; setGameState({ ...engineRef.current.state }); }}
          className={`flex-1 py-3 flex items-center justify-center rounded-sm transition-all border ${gameState.sidebarTab === 'VEHICLES' ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-transparent text-zinc-600 hover:text-zinc-400'}`}
          title="Техника"
        >
          <Truck className="w-5 h-5" />
        </button>
      </div>

      {/* Selected MCV Action Button */}
      {gameState.entities.some(e => e.selected && e.owner === engineRef.current.localPlayerId && (e.subType === 'MCV' || e.subType === 'ALLIED_MCV')) && (
        <div className="p-2 bg-zinc-900 border-b border-zinc-800">
          <button 
            onClick={() => {
              const selectedMCV = gameState.entities.find(e => e.selected && e.owner === engineRef.current.localPlayerId && (e.subType === 'MCV' || e.subType === 'ALLIED_MCV'));
              if (selectedMCV) {
                engineRef.current.deployMCV(selectedMCV.id);
                setGameState({ ...engineRef.current.state });
              }
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded border-2 border-white/20 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 animate-pulse"
          >
            <Factory className="w-5 h-5" />
            РАЗВЕРНУТЬ БАЗУ (D)
          </button>
        </div>
      )}

      {/* Build Area with Power Bar */}
      <div className="flex-1 flex overflow-hidden bg-black">
        {/* Power Bar (Vertical) */}
        <div className="w-10 bg-zinc-950 border-r border-zinc-800 flex flex-col-reverse p-1.5 relative group" title={`Энергия: ${localGameState.power} / Потребление: ${localGameState.powerConsumption}`}>
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="flex-1 w-full bg-black rounded-sm overflow-hidden relative border border-zinc-800">
            {/* Power Level Indicator */}
            <div 
              className={`absolute bottom-0 left-0 w-full transition-all duration-700 ${localGameState.power >= localGameState.powerConsumption ? 'bg-gradient-to-t from-green-900 via-green-700 to-green-600' : 'bg-gradient-to-t from-red-900 via-red-700 to-red-600'}`}
              style={{ height: `${Math.min(100, (localGameState.power / Math.max(1, localGameState.powerConsumption)) * 50)}%` }}
            />
            {/* Consumption Marker */}
            <div 
              className="absolute left-0 w-full h-0.5 bg-zinc-400 z-10"
              style={{ bottom: '50%' }}
            />
          </div>
          <div className="text-center mt-2">
            <Zap className={`w-4 h-4 mx-auto ${localGameState.power >= localGameState.powerConsumption ? 'text-green-500' : 'text-red-500 animate-pulse'}`} />
          </div>
          
          {/* Power Tooltip */}
          <div className="absolute left-full ml-2 bottom-4 bg-zinc-900 border border-zinc-700 p-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            <div className="font-bold text-white mb-1">Статус энергии</div>
            <div className="text-green-400">Произведено: {localGameState.power} МВт</div>
            <div className="text-red-400">Потреблено: {localGameState.powerConsumption} МВт</div>
          </div>
        </div>

        {/* Build Grid */}
        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
          {localGameState.sidebarTab === 'BUILDINGS' && <BuildingsTab gameState={localGameState} engineRef={engineRef} setGameState={setGameState} />}
          {localGameState.sidebarTab === 'INFANTRY' && <InfantryTab gameState={localGameState} engineRef={engineRef} setGameState={setGameState} />}
          {localGameState.sidebarTab === 'VEHICLES' && <VehiclesTab gameState={localGameState} engineRef={engineRef} setGameState={setGameState} />}
          {localGameState.sidebarTab === 'DEFENSE' && <DefenseTab gameState={localGameState} engineRef={engineRef} setGameState={setGameState} />}
        </div>
      </div>
    </div>
  );
};
