import React from 'react';
import { GameState } from '../../game/types';
import { GameEngine } from '../../game/GameEngine';
import { BuildButton } from '../BuildButton';
import { Zap, Shield, Factory, Coins, Radar, Wrench, Activity, Layers, Anchor, Users, Crosshair, Target, Skull, Bomb, Wind, Truck, Waves, Car, Square, ShieldAlert } from 'lucide-react';

interface DefenseTabProps {
  gameState: GameState;
  engineRef: React.MutableRefObject<GameEngine>;
}

export const DefenseTab: React.FC<DefenseTabProps> = ({ gameState, engineRef }) => {
  const isAllied = engineRef.current.playerFaction === 'COALITION';

  const handleCancel = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    const item = gameState.productionQueue.find(q => q.subType === type);
    if (item) {
      engineRef.current.removeFromQueue(item.id);
      if (gameState.placingBuilding === type) {
        engineRef.current.state.placingBuilding = null;
      }
    }
  };

  return (
    <>
            <div className="grid grid-cols-2 gap-2">
              {!isAllied ? (
                <>
                  <BuildButton 
                    label="Стена" 
                    icon={<Square className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('SOVIET_WALL')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'SOVIET_WALL')?.progress}
                    active={gameState.placingBuilding === 'SOVIET_WALL'}
                    locked={!engineRef.current.isUnlocked('SOVIET_WALL', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'SOVIET_WALL');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('SOVIET_WALL');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('SOVIET_WALL');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('SOVIET_WALL', e)}
                    title="Стена: Базовая защита от пехоты и техники."
                  />
                  <BuildButton 
                    label="Пулемет" 
                    icon={<Target className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('SENTRY_GUN')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'SENTRY_GUN')?.progress}
                    active={gameState.placingBuilding === 'SENTRY_GUN'}
                    locked={!engineRef.current.isUnlocked('SENTRY_GUN', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'SENTRY_GUN');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('SENTRY_GUN');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('SENTRY_GUN');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('SENTRY_GUN', e)}
                    title="Пулеметная вышка: Базовая защита против пехоты."
                  />
                  <BuildButton 
                    label="Зенитка" 
                    icon={<Crosshair className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('FLAK_CANNON')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'FLAK_CANNON')?.progress}
                    active={gameState.placingBuilding === 'FLAK_CANNON'}
                    locked={!engineRef.current.isUnlocked('FLAK_CANNON', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'FLAK_CANNON');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('FLAK_CANNON');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('FLAK_CANNON');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('FLAK_CANNON', e)}
                    title="Зенитное орудие: Защита от воздушных целей."
                  />
                  <BuildButton 
                    label="Катушка Теслы" 
                    icon={<Zap className="w-5 h-5 text-blue-400" />} 
                    cost={engineRef.current.getCost('TESLA_COIL')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'TESLA_COIL')?.progress}
                    active={gameState.placingBuilding === 'TESLA_COIL'}
                    locked={!engineRef.current.isUnlocked('TESLA_COIL', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'TESLA_COIL');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('TESLA_COIL');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('TESLA_COIL');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('TESLA_COIL', e)}
                    title="Катушка Теслы: Мощная защита против наземных целей."
                  />
                  <BuildButton 
                    label="Пси-сенсор" 
                    icon={<Activity className="w-5 h-5 text-purple-400" />} 
                    cost={engineRef.current.getCost('PSYCHIC_SENSOR')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'PSYCHIC_SENSOR')?.progress}
                    active={gameState.placingBuilding === 'PSYCHIC_SENSOR'}
                    locked={!engineRef.current.isUnlocked('PSYCHIC_SENSOR', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'PSYCHIC_SENSOR');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('PSYCHIC_SENSOR');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('PSYCHIC_SENSOR');
                      }
                    }}
                    title="Психический сенсор: Обнаруживает вражеские приказы в радиусе действия."
                  />
                  <BuildButton 
                    label="Железный занавес" 
                    icon={<ShieldAlert className="w-5 h-5 text-red-500" />} 
                    cost={engineRef.current.getCost('IRON_CURTAIN')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'IRON_CURTAIN')?.progress}
                    active={gameState.placingBuilding === 'IRON_CURTAIN'}
                    locked={!engineRef.current.isUnlocked('IRON_CURTAIN', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'IRON_CURTAIN');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('IRON_CURTAIN');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('IRON_CURTAIN');
                      }
                    }}
                    title="Железный занавес: Делает технику неуязвимой на короткое время."
                  />
                  <BuildButton 
                    label="Ядерная шахта" 
                    icon={<Bomb className="w-5 h-5 text-yellow-500" />} 
                    cost={engineRef.current.getCost('NUCLEAR_SILO')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'NUCLEAR_SILO')?.progress}
                    active={gameState.placingBuilding === 'NUCLEAR_SILO'}
                    locked={!engineRef.current.isUnlocked('NUCLEAR_SILO', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'NUCLEAR_SILO');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('NUCLEAR_SILO');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('NUCLEAR_SILO');
                      }
                    }}
                    title="Ядерная шахта: Запускает разрушительную ядерную ракету."
                  />
                </>
              ) : (
                <>
                  {engineRef.current.playerCountry === 'AMERICA' && (
                    <BuildButton 
                      label="Десант" 
                      icon={<Users className="w-5 h-5 text-green-400" />} 
                      cost={0} 
                      progress={gameState.specialAbilities.PARATROOPERS.ready ? 100 : (Date.now() - gameState.specialAbilities.PARATROOPERS.lastUsed) / gameState.specialAbilities.PARATROOPERS.cooldown * 100}
                      active={gameState.interactionMode === 'USE_PARATROOPERS'}
                      locked={!gameState.specialAbilities.PARATROOPERS.ready}
                      onClick={() => {
                        if (gameState.specialAbilities.PARATROOPERS.ready) {
                          engineRef.current.state.interactionMode = 'USE_PARATROOPERS';
                        }
                      }}
                      title="Высадка десанта: Вызывает группу пехотинцев в любую точку карты."
                    />
                  )}
                  {engineRef.current.playerCountry === 'FRANCE' && (
                    <BuildButton 
                      label="Гранд-Канон" 
                      icon={<Target className="w-5 h-5 text-zinc-600" />} 
                      cost={engineRef.current.getCost('GRAND_CANNON')} 
                      progress={gameState.productionQueue.find(q => q.subType === 'GRAND_CANNON')?.progress}
                      active={gameState.placingBuilding === 'GRAND_CANNON'}
                      locked={!engineRef.current.isUnlocked('GRAND_CANNON', engineRef.current.localPlayerId)}
                      onClick={() => {
                        const item = gameState.productionQueue.find(q => q.subType === 'GRAND_CANNON');
                        if (item && item.progress >= 100) {
                          engineRef.current.startPlacing('GRAND_CANNON');
                          
                        } else if (!item) {
                          engineRef.current.startProduction('GRAND_CANNON');
                        }
                      }}
                      title="Гранд-Канон: Уникальная пушка Франции. Огромная дальность и мощь."
                    />
                  )}
                  <BuildButton 
                    label="Дот" 
                    icon={<Target className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('PILLBOX')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'PILLBOX')?.progress}
                    active={gameState.placingBuilding === 'PILLBOX'}
                    locked={!engineRef.current.isUnlocked('PILLBOX', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'PILLBOX');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('PILLBOX');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('PILLBOX');
                      }
                    }}
                    title="Дот: Базовая защита против пехоты."
                  />
                  <BuildButton 
                    label="Патриот" 
                    icon={<Crosshair className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('PATRIOT_MISSILE')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'PATRIOT_MISSILE')?.progress}
                    active={gameState.placingBuilding === 'PATRIOT_MISSILE'}
                    locked={!engineRef.current.isUnlocked('PATRIOT_MISSILE', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'PATRIOT_MISSILE');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('PATRIOT_MISSILE');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('PATRIOT_MISSILE');
                      }
                    }}
                    title="Ракета Патриот: Защита от воздушных целей."
                  />
                  <BuildButton 
                    label="Призма" 
                    icon={<Zap className="w-5 h-5 text-blue-300" />} 
                    cost={engineRef.current.getCost('PRISM_TOWER')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'PRISM_TOWER')?.progress}
                    active={gameState.placingBuilding === 'PRISM_TOWER'}
                    locked={!engineRef.current.isUnlocked('PRISM_TOWER', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'PRISM_TOWER');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('PRISM_TOWER');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('PRISM_TOWER');
                      }
                    }}
                    title="Призменная башня: Мощная защита, способная соединяться с другими башнями."
                  />
                  <BuildButton 
                    label="Хроносфера" 
                    icon={<Zap className="w-5 h-5 text-purple-500" />} 
                    cost={engineRef.current.getCost('CHRONOSPHERE')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'CHRONOSPHERE')?.progress}
                    active={gameState.placingBuilding === 'CHRONOSPHERE'}
                    locked={!engineRef.current.isUnlocked('CHRONOSPHERE', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'CHRONOSPHERE');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('CHRONOSPHERE');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('CHRONOSPHERE');
                      }
                    }}
                    title="Хроносфера: Телепортирует технику в любую точку карты."
                  />
                  <BuildButton 
                    label="Грозовая туча" 
                    icon={<Wind className="w-5 h-5 text-blue-600" />} 
                    cost={engineRef.current.getCost('WEATHER_DEVICE')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'WEATHER_DEVICE')?.progress}
                    active={gameState.placingBuilding === 'WEATHER_DEVICE'}
                    locked={!engineRef.current.isUnlocked('WEATHER_DEVICE', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'WEATHER_DEVICE');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('WEATHER_DEVICE');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('WEATHER_DEVICE');
                      }
                    }}
                    title="Устройство управления погодой: Создает разрушительный шторм."
                  />
                  <BuildButton 
                    label="Генератор помех" 
                    icon={<Layers className="w-5 h-5 text-zinc-400" />} 
                    cost={engineRef.current.getCost('GAP_GENERATOR')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'GAP_GENERATOR')?.progress}
                    active={gameState.placingBuilding === 'GAP_GENERATOR'}
                    locked={!engineRef.current.isUnlocked('GAP_GENERATOR', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'GAP_GENERATOR');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('GAP_GENERATOR');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('GAP_GENERATOR');
                      }
                    }}
                    title="Генератор помех: Скрывает базу от вражеских радаров."
                  />
                  <BuildButton 
                    label="Спутник-шпион" 
                    icon={<Radar className="w-5 h-5 text-blue-400" />} 
                    cost={engineRef.current.getCost('SPY_SATELLITE')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'SPY_SATELLITE')?.progress}
                    active={gameState.placingBuilding === 'SPY_SATELLITE'}
                    locked={!engineRef.current.isUnlocked('SPY_SATELLITE', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'SPY_SATELLITE');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('SPY_SATELLITE');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('SPY_SATELLITE');
                      }
                    }}
                    title="Спутник-шпион: Открывает всю карту для игрока."
                  />
                  <BuildButton 
                    label="Стена" 
                    icon={<Square className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_WALL')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_WALL')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_WALL'}
                    locked={!engineRef.current.isUnlocked('ALLIED_WALL', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_WALL');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_WALL');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_WALL');
                      }
                    }}
                    title="Стена: Базовая защита от пехоты и техники."
                  />
                </>
              )}
            </div>
    </>
  );
};
