import React, { useState } from 'react';
import { GameEngine } from '../game/GameEngine';

interface DebugMenuProps {
  engineRef: React.MutableRefObject<GameEngine>;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ engineRef }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Force re-render to reflect state toggles (sometimes React needs a push for debug toggles if the main game loop doesn't re-render UI based on them)
  const [, setTick] = useState(0); 

  const forceUpdate = () => setTick(t => t + 1);

  const spawnUnit = (type: string) => {
    engineRef.current.debugSpawnEntity(type);
  };
  
  const spawnBuilding = (type: string) => {
    engineRef.current.debugSpawnEntity(type, true);
  };

  const toggleFog = () => {
    engineRef.current.toggleDebugFog();
    forceUpdate();
  };

  const toggleZoom = () => {
    engineRef.current.toggleFreeZoom();
    forceUpdate();
  };

  return (
    <>
      <div 
        className="absolute top-4 left-4 bg-red-600/80 hover:bg-red-500 text-white px-4 py-1 rounded font-bold cursor-pointer border border-red-400 select-none z-50 text-sm shadow-lg whitespace-nowrap backdrop-blur-sm transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        Test
      </div>

      {isOpen && (
        <div className="absolute top-16 left-4 bg-zinc-900/90 text-zinc-300 p-4 border border-zinc-700/50 rounded-lg shadow-2xl z-50 select-none min-w-[250px] max-h-[80vh] overflow-y-auto backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">Debug Menu</h2>
          
          <div className="space-y-4">
            <section>
              <h3 className="text-sm text-zinc-400 font-bold mb-2 uppercase tracking-wider">Cheat Actions</h3>
              <div className="flex flex-col gap-2">
                <button 
                  className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-left border border-zinc-700/50 hover:border-zinc-500 transition-colors"
                  onClick={() => engineRef.current.debugGiveCredits()}
                >
                  💰 Give 100,000 Credits
                </button>
                <button 
                  className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-left border border-zinc-700/50 hover:border-zinc-500 transition-colors"
                  onClick={() => engineRef.current.debugClearEnemies()}
                >
                  💥 Destroy Enemy Entities
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-sm text-zinc-400 font-bold mb-2 uppercase tracking-wider">Game Settings</h3>
              <div className="flex flex-col gap-2">
                <button 
                  className={`p-2 rounded text-left border transition-colors ${engineRef.current.state.debugFlags?.disableFog ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50'}`}
                  onClick={toggleFog}
                >
                  {engineRef.current.state.debugFlags?.disableFog ? '👁️ Fog: Disabled' : '👁️ Fog: Enabled'}
                </button>
                <button 
                  className={`p-2 rounded text-left border transition-colors ${engineRef.current.state.debugFlags?.freeZoom ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50'}`}
                  onClick={toggleZoom}
                >
                  {engineRef.current.state.debugFlags?.freeZoom ? '🔍 Free Zoom: ON' : '🔍 Free Zoom: OFF'}
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-sm text-zinc-400 font-bold mb-2 uppercase tracking-wider">Spawn Units</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('APOCALYPSE_TANK')}>Apoc Tank</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('KIROV_AIRSHIP')}>Kirov</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('TERROR_DRONE')}>Terror Drone</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('YURI_PRIME')}>Yuri Prime</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('SNIPER')}>Sniper</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('CHRONO_LEGIONNAIRE')}>Chrono Leg.</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('TANYA')}>Tanya</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('PRISM_TANK')}>Prism Tank</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('DESOLATOR')}>Desolator</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnUnit('GIANT_SQUID')}>Giant Squid</button>
              </div>
            </section>

            <section>
              <h3 className="text-sm text-zinc-400 font-bold mb-2 uppercase tracking-wider">Spawn Buildings</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('CONSTRUCTION_YARD')}>Con. Yard</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('NUCLEAR_REACTOR')}>Nuclear Reactor</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('BATTLE_LAB')}>Battle Lab</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('CLONING_VATS')}>Cloning Vats</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('TESLA_COIL')}>Tesla Coil</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('PRISM_TOWER')}>Prism Tower</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('GRAND_CANNON')}>Grand Cannon</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('CHRONOSPHERE')}>Chronosphere</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('NUCLEAR_SILO')}>Nuclear Silo</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-xs border border-zinc-700/50" onClick={() => spawnBuilding('WEATHER_DEVICE')}>Weather Device</button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
};
