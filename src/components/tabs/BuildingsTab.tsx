import React from 'react';
import { GameState } from '../../game/types';
import { GameEngine } from '../../game/GameEngine';
import { BuildButton } from '../BuildButton';
import { Zap, Shield, Factory, Coins, Radar, Wrench, Activity, Layers, Anchor, Users, Crosshair, Target, Skull, Bomb, Wind, Truck, Waves, Car, Square, ShieldAlert, Cpu } from 'lucide-react';

interface BuildingsTabProps {
  gameState: GameState;
  engineRef: React.MutableRefObject<GameEngine>;
}

export const BuildingsTab: React.FC<BuildingsTabProps> = ({ gameState, engineRef }) => {
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
                    label="Тесла-реактор" 
                    icon={<Zap className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('POWER_PLANT')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'POWER_PLANT')?.progress}
                    active={gameState.placingBuilding === 'POWER_PLANT'}
                    locked={!engineRef.current.isUnlocked('POWER_PLANT', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'POWER_PLANT');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('POWER_PLANT');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('POWER_PLANT');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('POWER_PLANT', e)}
                    title="Тесла-реактор: Обеспечивает энергией другие постройки."
                  />
                  <BuildButton 
                    label="Обогатитель" 
                    icon={<Coins className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ORE_REFINERY')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ORE_REFINERY')?.progress}
                    active={gameState.placingBuilding === 'ORE_REFINERY'}
                    locked={!engineRef.current.isUnlocked('ORE_REFINERY', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ORE_REFINERY');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ORE_REFINERY');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ORE_REFINERY');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('ORE_REFINERY', e)}
                    title="Обогатитель руды: Перерабатывает руду в кредиты. В комплекте идет бесплатный Харвестер."
                  />
                  <BuildButton 
                    label="Казармы" 
                    icon={<Users className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('BARRACKS')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'BARRACKS')?.progress}
                    active={gameState.placingBuilding === 'BARRACKS'}
                    locked={!engineRef.current.isUnlocked('BARRACKS', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'BARRACKS');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('BARRACKS');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('BARRACKS');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('BARRACKS', e)}
                    title="Казармы: Обучают пехотные подразделения."
                  />
                  <BuildButton 
                    label="Военный завод" 
                    icon={<Factory className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('WAR_FACTORY')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'WAR_FACTORY')?.progress}
                    active={gameState.placingBuilding === 'WAR_FACTORY'}
                    locked={!engineRef.current.isUnlocked('WAR_FACTORY', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'WAR_FACTORY');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('WAR_FACTORY');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('WAR_FACTORY');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('WAR_FACTORY', e)}
                    title="Военный завод: Строит технику и танки."
                  />
                  <BuildButton 
                    label="Верфь" 
                    icon={<Anchor className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('NAVAL_YARD')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'NAVAL_YARD')?.progress}
                    active={gameState.placingBuilding === 'NAVAL_YARD'}
                    locked={!engineRef.current.isUnlocked('NAVAL_YARD', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'NAVAL_YARD');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('NAVAL_YARD');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('NAVAL_YARD');
                      }
                    }}
                    onContextMenu={(e) => handleCancel('NAVAL_YARD', e)}
                    title="Морская верфь: Строит корабли. Должна быть размещена на воде."
                  />
                  <BuildButton 
                    label="Радар" 
                    icon={<Radar className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('RADAR')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'RADAR')?.progress}
                    active={gameState.placingBuilding === 'RADAR'}
                    locked={!engineRef.current.isUnlocked('RADAR', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'RADAR');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('RADAR');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('RADAR');
                      }
                    }}
                    title="Радар: Включает миникарту и открывает доступ к продвинутым постройкам."
                  />
                  <BuildButton 
                    label="Ремонтный цех" 
                    icon={<Wrench className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('SERVICE_DEPOT')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'SERVICE_DEPOT')?.progress}
                    active={gameState.placingBuilding === 'SERVICE_DEPOT'}
                    locked={!engineRef.current.isUnlocked('SERVICE_DEPOT', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'SERVICE_DEPOT');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('SERVICE_DEPOT');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('SERVICE_DEPOT');
                      }
                    }}
                    title="Ремонтный цех: Ремонтирует поврежденную технику."
                  />
                  <BuildButton 
                    label="Техцентр" 
                    icon={<Cpu className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('BATTLE_LAB')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'BATTLE_LAB')?.progress}
                    active={gameState.placingBuilding === 'BATTLE_LAB'}
                    locked={!engineRef.current.isUnlocked('BATTLE_LAB', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'BATTLE_LAB');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('BATTLE_LAB');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('BATTLE_LAB');
                      }
                    }}
                    title="Боевая лаборатория: Открывает доступ к элитным юнитам и супероружию."
                  />
                  <BuildButton 
                    label="Ядерный реактор" 
                    icon={<Zap className="w-5 h-5 text-yellow-500" />} 
                    cost={engineRef.current.getCost('NUCLEAR_REACTOR')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'NUCLEAR_REACTOR')?.progress}
                    active={gameState.placingBuilding === 'NUCLEAR_REACTOR'}
                    locked={!engineRef.current.isUnlocked('NUCLEAR_REACTOR', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'NUCLEAR_REACTOR');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('NUCLEAR_REACTOR');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('NUCLEAR_REACTOR');
                      }
                    }}
                    title="Ядерный реактор: Производит огромное количество энергии."
                  />
                  <BuildButton 
                    label="Чаны клонир." 
                    icon={<Layers className="w-5 h-5 text-pink-500" />} 
                    cost={engineRef.current.getCost('CLONING_VATS')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'CLONING_VATS')?.progress}
                    active={gameState.placingBuilding === 'CLONING_VATS'}
                    locked={!engineRef.current.isUnlocked('CLONING_VATS', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'CLONING_VATS');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('CLONING_VATS');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('CLONING_VATS');
                      }
                    }}
                    title="Чаны клонирования: Создает бесплатного клона для каждого обученного пехотинца."
                  />
                </>
              ) : (
                <>
                  <BuildButton 
                    label="Электростанция" 
                    icon={<Zap className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_POWER_PLANT')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_POWER_PLANT')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_POWER_PLANT'}
                    locked={!engineRef.current.isUnlocked('ALLIED_POWER_PLANT', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_POWER_PLANT');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_POWER_PLANT');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_POWER_PLANT');
                      }
                    }}
                    title="Электростанция: Обеспечивает энергией другие постройки."
                  />
                  <BuildButton 
                    label="Обогатитель" 
                    icon={<Coins className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_ORE_REFINERY')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_ORE_REFINERY')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_ORE_REFINERY'}
                    locked={!engineRef.current.isUnlocked('ALLIED_ORE_REFINERY', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_ORE_REFINERY');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_ORE_REFINERY');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_ORE_REFINERY');
                      }
                    }}
                    title="Обогатитель руды: Перерабатывает руду в кредиты. В комплекте идет бесплатный Харвестер."
                  />
                  <BuildButton 
                    label="Казармы" 
                    icon={<Users className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_BARRACKS')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_BARRACKS')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_BARRACKS'}
                    locked={!engineRef.current.isUnlocked('ALLIED_BARRACKS', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_BARRACKS');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_BARRACKS');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_BARRACKS');
                      }
                    }}
                    title="Казармы: Обучают пехотные подразделения."
                  />
                  <BuildButton 
                    label="Военный завод" 
                    icon={<Factory className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_WAR_FACTORY')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_WAR_FACTORY')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_WAR_FACTORY'}
                    locked={!engineRef.current.isUnlocked('ALLIED_WAR_FACTORY', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_WAR_FACTORY');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_WAR_FACTORY');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_WAR_FACTORY');
                      }
                    }}
                    title="Военный завод: Строит технику и танки."
                  />
                  <BuildButton 
                    label="ВВС" 
                    icon={<Wind className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('AIR_FORCE_COMMAND')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'AIR_FORCE_COMMAND')?.progress}
                    active={gameState.placingBuilding === 'AIR_FORCE_COMMAND'}
                    locked={!engineRef.current.isUnlocked('AIR_FORCE_COMMAND', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'AIR_FORCE_COMMAND');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('AIR_FORCE_COMMAND');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('AIR_FORCE_COMMAND');
                      }
                    }}
                    title="Штаб ВВС: Открывает доступ к авиации и обеспечивает радар."
                  />
                  <BuildButton 
                    label="Техцентр" 
                    icon={<Cpu className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_BATTLE_LAB')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_BATTLE_LAB')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_BATTLE_LAB'}
                    locked={!engineRef.current.isUnlocked('ALLIED_BATTLE_LAB', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_BATTLE_LAB');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_BATTLE_LAB');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_BATTLE_LAB');
                      }
                    }}
                    title="Боевая лаборатория: Открывает доступ к элитным юнитам и супероружию."
                  />
                  <BuildButton 
                    label="Ремонтный цех" 
                    icon={<Wrench className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('SERVICE_DEPOT')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'SERVICE_DEPOT')?.progress}
                    active={gameState.placingBuilding === 'SERVICE_DEPOT'}
                    locked={!engineRef.current.isUnlocked('SERVICE_DEPOT', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'SERVICE_DEPOT');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('SERVICE_DEPOT');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('SERVICE_DEPOT');
                      }
                    }}
                    title="Ремонтный цех: Ремонтирует поврежденную технику."
                  />
                  <BuildButton 
                    label="Очиститель руды" 
                    icon={<Activity className="w-5 h-5 text-green-400" />} 
                    cost={engineRef.current.getCost('ALLIED_ORE_PURIFIER')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_ORE_PURIFIER')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_ORE_PURIFIER'}
                    locked={!engineRef.current.isUnlocked('ALLIED_ORE_PURIFIER', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_ORE_PURIFIER');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_ORE_PURIFIER');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_ORE_PURIFIER');
                      }
                    }}
                    title="Очиститель руды: Повышает ценность собираемой руды на 25%."
                  />
                  <BuildButton 
                    label="Центр роботов" 
                    icon={<Cpu className="w-5 h-5 text-blue-400" />} 
                    cost={engineRef.current.getCost('ROBOT_CONTROL_CENTER')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ROBOT_CONTROL_CENTER')?.progress}
                    active={gameState.placingBuilding === 'ROBOT_CONTROL_CENTER'}
                    locked={!engineRef.current.isUnlocked('ROBOT_CONTROL_CENTER', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ROBOT_CONTROL_CENTER');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ROBOT_CONTROL_CENTER');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ROBOT_CONTROL_CENTER');
                      }
                    }}
                    title="Центр управления роботами: Позволяет строить роботов-танков."
                  />
                  <BuildButton 
                    label="Верфь" 
                    icon={<Anchor className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('ALLIED_NAVAL_YARD')} 
                    progress={gameState.productionQueue.find(q => q.subType === 'ALLIED_NAVAL_YARD')?.progress}
                    active={gameState.placingBuilding === 'ALLIED_NAVAL_YARD'}
                    locked={!engineRef.current.isUnlocked('ALLIED_NAVAL_YARD', engineRef.current.localPlayerId)}
                    onClick={() => {
                      const item = gameState.productionQueue.find(q => q.subType === 'ALLIED_NAVAL_YARD');
                      if (item && item.progress >= 100) {
                        engineRef.current.startPlacing('ALLIED_NAVAL_YARD');
                        
                      } else if (!item) {
                        engineRef.current.startProduction('ALLIED_NAVAL_YARD');
                      }
                    }}
                    title="Верфь: Строит корабли. Должна быть размещена на воде."
                  />
                </>
              )}
            </div>
    </>
  );
};
