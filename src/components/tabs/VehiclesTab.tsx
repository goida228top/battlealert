import React from 'react';
import { GameState } from '../../game/types';
import { GameEngine } from '../../game/GameEngine';
import { BuildButton } from '../BuildButton';
import { Zap, Shield, Factory, Coins, Radar, Wrench, Activity, Layers, Anchor, Users, Crosshair, Target, Skull, Bomb, Wind, Truck, Waves, Car, Square, ShieldAlert, Cpu } from 'lucide-react';

interface VehiclesTabProps {
  gameState: GameState;
  engineRef: React.MutableRefObject<GameEngine>;
  setGameState: (state: any) => void;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({ gameState, engineRef, setGameState }) => {
  const isAllied = engineRef.current.playerFaction === 'COALITION';
  const localPlayerId = engineRef.current.localPlayerId;
  const activeQueue = localPlayerId === 'PLAYER' ? gameState.productionQueue : 
                      localPlayerId === 'PLAYER_2' ? (gameState.p2ProductionQueue || []) :
                      localPlayerId === 'PLAYER_3' ? (gameState.p3ProductionQueue || []) :
                      (gameState.p4ProductionQueue || []);

  const handleCancel = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    const items = activeQueue.filter(q => q.subType === type);
    if (items.length > 0) {
      const activeItem = items.find(q => q.progress > 0 && q.progress < 100) || items[0];
      if (activeItem && !activeItem.paused && activeItem.progress < 100) {
        activeItem.paused = true;
      } else {
        const lastItem = items[items.length - 1];
        engineRef.current.removeFromQueue(lastItem.id);
      }
      setGameState({ ...engineRef.current.state });
    }
  };

  const handleClick = (type: string) => {
    const items = activeQueue.filter(q => q.subType === type);
    const activeItem = items.find(q => q.paused);
    if (activeItem) {
       activeItem.paused = false;
    } else {
       engineRef.current.startProduction(type as any);
    }
    setGameState({ ...engineRef.current.state });
  };

  return (
    <>
            <div className="grid grid-cols-2 gap-1.5">
              {!isAllied ? (
                <>
                  <BuildButton 
                    label="Танк Рино" 
                    icon={<Car className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('RHINO_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('RHINO_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'RHINO_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'RHINO_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'RHINO_TANK').length}
                    locked={!engineRef.current.isUnlocked('RHINO_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('RHINO_TANK')}
                    onContextMenu={(e) => handleCancel('RHINO_TANK', e)}
                    title="Тяжелый танк Рино: Стандартный бронированный юнит."
                  />
                  <BuildButton 
                    label="Зенитный БТР" 
                    icon={<Truck className="w-5 h-5 text-zinc-400" />} 
                    cost={engineRef.current.getCost('FLAK_TRACK')} cannotAfford={gameState.credits < engineRef.current.getCost('FLAK_TRACK')} 
                    progress={activeQueue.find(q => q.subType === 'FLAK_TRACK')?.progress} paused={activeQueue.find(q => q.subType === 'FLAK_TRACK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'FLAK_TRACK').length}
                    locked={!engineRef.current.isUnlocked('FLAK_TRACK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('FLAK_TRACK')}
                    onContextMenu={(e) => handleCancel('FLAK_TRACK', e)}
                    title="Зенитный БТР: Быстрый транспорт, эффективен против авиации."
                  />
                  <BuildButton 
                    label="Пусковая V3" 
                    icon={<Target className="w-5 h-5 text-red-500" />} 
                    cost={engineRef.current.getCost('V3_LAUNCHER')} cannotAfford={gameState.credits < engineRef.current.getCost('V3_LAUNCHER')} 
                    progress={activeQueue.find(q => q.subType === 'V3_LAUNCHER')?.progress} paused={activeQueue.find(q => q.subType === 'V3_LAUNCHER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'V3_LAUNCHER').length}
                    locked={!engineRef.current.isUnlocked('V3_LAUNCHER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('V3_LAUNCHER')}
                    onContextMenu={(e) => handleCancel('V3_LAUNCHER', e)}
                    title="Ракетная установка V3: Дальнобойная артиллерия."
                  />
                  <BuildButton 
                    label="Дрон-террорист" 
                    icon={<Crosshair className="w-5 h-5 text-zinc-400" />} 
                    cost={engineRef.current.getCost('TERROR_DRONE')} cannotAfford={gameState.credits < engineRef.current.getCost('TERROR_DRONE')} 
                    progress={activeQueue.find(q => q.subType === 'TERROR_DRONE')?.progress} paused={activeQueue.find(q => q.subType === 'TERROR_DRONE')?.paused}
                    count={activeQueue.filter(q => q.subType === 'TERROR_DRONE').length}
                    locked={!engineRef.current.isUnlocked('TERROR_DRONE', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('TERROR_DRONE')}
                    onContextMenu={(e) => handleCancel('TERROR_DRONE', e)}
                    title="Дрон-террорист: Быстрый механический паук. Разбирает технику изнутри."
                  />
                  <BuildButton 
                    label="Апокалипсис" 
                    icon={<Skull className="w-5 h-5 text-red-600" />} 
                    cost={engineRef.current.getCost('APOCALYPSE_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('APOCALYPSE_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'APOCALYPSE_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'APOCALYPSE_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'APOCALYPSE_TANK').length}
                    locked={!engineRef.current.isUnlocked('APOCALYPSE_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('APOCALYPSE_TANK')}
                    
                    onContextMenu={(e) => handleCancel('APOCALYPSE_TANK', e)}
                    title="Танк Апокалипсис: Мощнейшая машина наземного штурма."
                  />
                  {engineRef.current.playerCountry === 'RUSSIA' && (
                    <BuildButton 
                      label="Тесла-танк" 
                      icon={<Zap className="w-5 h-5 text-blue-500" />} 
                      cost={engineRef.current.getCost('TESLA_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('TESLA_TANK')} 
                      progress={activeQueue.find(q => q.subType === 'TESLA_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'TESLA_TANK')?.paused}
                      count={activeQueue.filter(q => q.subType === 'TESLA_TANK').length}
                      locked={!engineRef.current.isUnlocked('TESLA_TANK', localPlayerId)}
                      onClick={() => engineRef.current.startProduction('TESLA_TANK')}
                      
                    onContextMenu={(e) => handleCancel('TESLA_TANK', e)}
                    title="Тесла-танк: Уникальный танк России. Стреляет электрическими разрядами."
                    />
                  )}
                  {engineRef.current.playerCountry === 'LIBYA' && (
                    <BuildButton 
                      label="Грузовик-бомба" 
                      icon={<Bomb className="w-5 h-5 text-red-500" />} 
                      cost={engineRef.current.getCost('DEMOLITION_TRUCK')} cannotAfford={gameState.credits < engineRef.current.getCost('DEMOLITION_TRUCK')} 
                      progress={activeQueue.find(q => q.subType === 'DEMOLITION_TRUCK')?.progress} paused={activeQueue.find(q => q.subType === 'DEMOLITION_TRUCK')?.paused}
                      count={activeQueue.filter(q => q.subType === 'DEMOLITION_TRUCK').length}
                      locked={!engineRef.current.isUnlocked('DEMOLITION_TRUCK', localPlayerId)}
                      onClick={() => engineRef.current.startProduction('DEMOLITION_TRUCK')}
                    onContextMenu={(e) => handleCancel('DEMOLITION_TRUCK', e)}
                      title="Грузовик-бомба: Уникальный юнит Ливии. Смертник на колесах."
                    />
                  )}
                  <BuildButton 
                    label="Военный комбайн" 
                    icon={<Truck className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('HARVESTER')} cannotAfford={gameState.credits < engineRef.current.getCost('HARVESTER')} 
                    progress={activeQueue.find(q => q.subType === 'HARVESTER')?.progress} paused={activeQueue.find(q => q.subType === 'HARVESTER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'HARVESTER').length}
                    locked={!engineRef.current.isUnlocked('HARVESTER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('HARVESTER')}
                    onContextMenu={(e) => handleCancel('HARVESTER', e)}
                    title="Военный комбайн: Собирает руду. Вооружен пулеметом."
                  />
                  <BuildButton 
                    label="МСЦ" 
                    icon={<Truck className="w-5 h-5 text-green-500" />} 
                    cost={engineRef.current.getCost('MCV')} cannotAfford={gameState.credits < engineRef.current.getCost('MCV')} 
                    progress={activeQueue.find(q => q.subType === 'MCV')?.progress} paused={activeQueue.find(q => q.subType === 'MCV')?.paused}
                    count={activeQueue.filter(q => q.subType === 'MCV').length}
                    locked={!engineRef.current.isUnlocked('MCV', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('MCV')}
                    onContextMenu={(e) => handleCancel('MCV', e)}
                    title="Мобильный Сборочный Цех: Развертывается в новый Сборочный Двор."
                  />
                  <BuildButton 
                    label="Дирижабль Киров" 
                    icon={<Wind className="w-5 h-5 text-yellow-500" />} 
                    cost={engineRef.current.getCost('KIROV_AIRSHIP')} cannotAfford={gameState.credits < engineRef.current.getCost('KIROV_AIRSHIP')} 
                    progress={activeQueue.find(q => q.subType === 'KIROV_AIRSHIP')?.progress} paused={activeQueue.find(q => q.subType === 'KIROV_AIRSHIP')?.paused}
                    count={activeQueue.filter(q => q.subType === 'KIROV_AIRSHIP').length}
                    locked={!engineRef.current.isUnlocked('KIROV_AIRSHIP', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('KIROV_AIRSHIP')}
                    onContextMenu={(e) => handleCancel('KIROV_AIRSHIP', e)}
                    title="Дирижабль Киров: Тяжелый бомбардировщик. Медленный, но сокрушительный."
                  />
                  <BuildButton 
                    label="Подлодка" 
                    icon={<Waves className="w-5 h-5 text-blue-500" />} 
                    cost={engineRef.current.getCost('TYPHOON_SUB')} cannotAfford={gameState.credits < engineRef.current.getCost('TYPHOON_SUB')} 
                    progress={activeQueue.find(q => q.subType === 'TYPHOON_SUB')?.progress} paused={activeQueue.find(q => q.subType === 'TYPHOON_SUB')?.paused}
                    count={activeQueue.filter(q => q.subType === 'TYPHOON_SUB').length}
                    locked={!engineRef.current.isUnlocked('TYPHOON_SUB', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('TYPHOON_SUB')}
                    
                    onContextMenu={(e) => handleCancel('TYPHOON_SUB', e)}
                    title="Подлодка Тайфун: Скрытный морской юнит."
                  />
                  <BuildButton 
                    label="Дредноут" 
                    icon={<Anchor className="w-5 h-5 text-red-500" />} 
                    cost={engineRef.current.getCost('DREADNOUGHT')} cannotAfford={gameState.credits < engineRef.current.getCost('DREADNOUGHT')} 
                    progress={activeQueue.find(q => q.subType === 'DREADNOUGHT')?.progress} paused={activeQueue.find(q => q.subType === 'DREADNOUGHT')?.paused}
                    count={activeQueue.filter(q => q.subType === 'DREADNOUGHT').length}
                    locked={!engineRef.current.isUnlocked('DREADNOUGHT', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('DREADNOUGHT')}
                    
                    onContextMenu={(e) => handleCancel('DREADNOUGHT', e)}
                    title="Дредноут: Дальнобойная морская бомбардировка."
                  />
                </>
              ) : (
                <>
                  <BuildButton 
                    label="Танк Гризли" 
                    icon={<Car className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('GRIZZLY_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('GRIZZLY_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'GRIZZLY_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'GRIZZLY_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'GRIZZLY_TANK').length}
                    locked={!engineRef.current.isUnlocked('GRIZZLY_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('GRIZZLY_TANK')}
                    
                    onContextMenu={(e) => handleCancel('GRIZZLY_TANK', e)}
                    title="Танк Гризли: Стандартный боевой танк Коалиции."
                  />
                  <BuildButton 
                    label="Хроно-комбайн" 
                    icon={<Truck className="w-5 h-5" />} 
                    cost={engineRef.current.getCost('CHRONO_MINER')} cannotAfford={gameState.credits < engineRef.current.getCost('CHRONO_MINER')} 
                    progress={activeQueue.find(q => q.subType === 'CHRONO_MINER')?.progress} paused={activeQueue.find(q => q.subType === 'CHRONO_MINER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'CHRONO_MINER').length}
                    locked={!engineRef.current.isUnlocked('CHRONO_MINER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('CHRONO_MINER')}
                    onContextMenu={(e) => handleCancel('CHRONO_MINER', e)}
                    title="Хроно-комбайн: Собирает руду и телепортируется обратно на базу."
                  />
                  <BuildButton 
                    label="БМП" 
                    icon={<Target className="w-5 h-5 text-blue-500" />} 
                    cost={engineRef.current.getCost('IFV')} cannotAfford={gameState.credits < engineRef.current.getCost('IFV')} 
                    progress={activeQueue.find(q => q.subType === 'IFV')?.progress} paused={activeQueue.find(q => q.subType === 'IFV')?.paused}
                    count={activeQueue.filter(q => q.subType === 'IFV').length}
                    locked={!engineRef.current.isUnlocked('IFV', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('IFV')}
                    
                    onContextMenu={(e) => handleCancel('IFV', e)}
                    title="БМП: Многоцелевая машина. Меняет оружие в зависимости от пехоты внутри."
                  />
                  <BuildButton 
                    label="Танк Мираж" 
                    icon={<Wind className="w-5 h-5 text-green-600" />} 
                    cost={engineRef.current.getCost('MIRAGE_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('MIRAGE_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'MIRAGE_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'MIRAGE_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'MIRAGE_TANK').length}
                    locked={!engineRef.current.isUnlocked('MIRAGE_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('MIRAGE_TANK')}
                    
                    onContextMenu={(e) => handleCancel('MIRAGE_TANK', e)}
                    title="Танк Мираж: Маскируется под дерево, когда неподвижен."
                  />
                  <BuildButton 
                    label="Призма-танк" 
                    icon={<Zap className="w-5 h-5 text-blue-300" />} 
                    cost={engineRef.current.getCost('PRISM_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('PRISM_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'PRISM_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'PRISM_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'PRISM_TANK').length}
                    locked={!engineRef.current.isUnlocked('PRISM_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('PRISM_TANK')}
                    
                    onContextMenu={(e) => handleCancel('PRISM_TANK', e)}
                    title="Призма-танк: Дальнобойное лучевое оружие, поражающее несколько целей."
                  />
                  {engineRef.current.playerCountry === 'GERMANY' && (
                    <BuildButton 
                      label="Истр. танков" 
                      icon={<ShieldAlert className="w-5 h-5 text-zinc-400" />} 
                      cost={engineRef.current.getCost('TANK_DESTROYER')} cannotAfford={gameState.credits < engineRef.current.getCost('TANK_DESTROYER')} 
                      progress={activeQueue.find(q => q.subType === 'TANK_DESTROYER')?.progress} paused={activeQueue.find(q => q.subType === 'TANK_DESTROYER')?.paused}
                      count={activeQueue.filter(q => q.subType === 'TANK_DESTROYER').length}
                      locked={!engineRef.current.isUnlocked('TANK_DESTROYER', localPlayerId)}
                      onClick={() => engineRef.current.startProduction('TANK_DESTROYER')}
                    onContextMenu={(e) => handleCancel('TANK_DESTROYER', e)}
                      title="Истребитель танков: Уникальный юнит Германии. Эффективен против бронетехники."
                    />
                  )}
                  <BuildButton 
                    label="Робот-танк" 
                    icon={<Cpu className="w-5 h-5 text-blue-400" />} 
                    cost={engineRef.current.getCost('ROBOT_TANK')} cannotAfford={gameState.credits < engineRef.current.getCost('ROBOT_TANK')} 
                    progress={activeQueue.find(q => q.subType === 'ROBOT_TANK')?.progress} paused={activeQueue.find(q => q.subType === 'ROBOT_TANK')?.paused}
                    count={activeQueue.filter(q => q.subType === 'ROBOT_TANK').length}
                    locked={!engineRef.current.isUnlocked('ROBOT_TANK', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('ROBOT_TANK')}
                    
                    onContextMenu={(e) => handleCancel('ROBOT_TANK', e)}
                    title="Робот-танк: Беспилотный танк. Неуязвим для контроля разума."
                  />
                  <BuildButton 
                    label="Крепость" 
                    icon={<Skull className="w-5 h-5 text-zinc-600" />} 
                    cost={engineRef.current.getCost('BATTLE_FORTRESS')} cannotAfford={gameState.credits < engineRef.current.getCost('BATTLE_FORTRESS')} 
                    progress={activeQueue.find(q => q.subType === 'BATTLE_FORTRESS')?.progress} paused={activeQueue.find(q => q.subType === 'BATTLE_FORTRESS')?.paused}
                    count={activeQueue.filter(q => q.subType === 'BATTLE_FORTRESS').length}
                    locked={!engineRef.current.isUnlocked('BATTLE_FORTRESS', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('BATTLE_FORTRESS')}
                    onContextMenu={(e) => handleCancel('BATTLE_FORTRESS', e)}
                    title="Боевая крепость: Огромный транспорт, способный давить другую технику."
                  />
                  <BuildButton 
                    label="МСЦ" 
                    icon={<Truck className="w-5 h-5 text-green-500" />} 
                    cost={engineRef.current.getCost('ALLIED_MCV')} cannotAfford={gameState.credits < engineRef.current.getCost('ALLIED_MCV')} 
                    progress={activeQueue.find(q => q.subType === 'ALLIED_MCV')?.progress} paused={activeQueue.find(q => q.subType === 'ALLIED_MCV')?.paused}
                    count={activeQueue.filter(q => q.subType === 'ALLIED_MCV').length}
                    locked={!engineRef.current.isUnlocked('ALLIED_MCV', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('ALLIED_MCV')}
                    onContextMenu={(e) => handleCancel('ALLIED_MCV', e)}
                    title="Мобильный Сборочный Цех: Развертывается в Сборочный Двор Коалиции."
                  />
                  <BuildButton 
                    label="Эсминец" 
                    icon={<Waves className="w-5 h-5 text-blue-700" />} 
                    cost={engineRef.current.getCost('DESTROYER')} cannotAfford={gameState.credits < engineRef.current.getCost('DESTROYER')} 
                    progress={activeQueue.find(q => q.subType === 'DESTROYER')?.progress} paused={activeQueue.find(q => q.subType === 'DESTROYER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'DESTROYER').length}
                    locked={!engineRef.current.isUnlocked('DESTROYER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('DESTROYER')}
                    
                    onContextMenu={(e) => handleCancel('DESTROYER', e)}
                    title="Эсминец: Универсальный морской юнит с противолодочным самолетом."
                  />
                  <BuildButton 
                    label="Авианосец" 
                    icon={<Anchor className="w-5 h-5 text-blue-900" />} 
                    cost={engineRef.current.getCost('AIRCRAFT_CARRIER')} cannotAfford={gameState.credits < engineRef.current.getCost('AIRCRAFT_CARRIER')} 
                    progress={activeQueue.find(q => q.subType === 'AIRCRAFT_CARRIER')?.progress} paused={activeQueue.find(q => q.subType === 'AIRCRAFT_CARRIER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'AIRCRAFT_CARRIER').length}
                    locked={!engineRef.current.isUnlocked('AIRCRAFT_CARRIER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('AIRCRAFT_CARRIER')}
                    
                    onContextMenu={(e) => handleCancel('AIRCRAFT_CARRIER', e)}
                    title="Авианосец: Запускает самолеты для атаки с большой дистанции."
                  />
                  <BuildButton 
                    label="Харриер" 
                    icon={<Wind className="w-5 h-5 text-zinc-400" />} 
                    cost={engineRef.current.getCost('HARRIER')} cannotAfford={gameState.credits < engineRef.current.getCost('HARRIER')} 
                    progress={activeQueue.find(q => q.subType === 'HARRIER')?.progress} paused={activeQueue.find(q => q.subType === 'HARRIER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'HARRIER').length}
                    locked={!engineRef.current.isUnlocked('HARRIER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('HARRIER')}
                    onContextMenu={(e) => handleCancel('HARRIER', e)}
                    title="Харриер: Реактивный истребитель-бомбардировщик."
                  />
                  {engineRef.current.playerCountry === 'KOREA' && (
                    <BuildButton 
                      label="Черный орел" 
                      icon={<Wind className="w-5 h-5 text-zinc-800" />} 
                      cost={engineRef.current.getCost('BLACK_EAGLE')} cannotAfford={gameState.credits < engineRef.current.getCost('BLACK_EAGLE')} 
                      progress={activeQueue.find(q => q.subType === 'BLACK_EAGLE')?.progress} paused={activeQueue.find(q => q.subType === 'BLACK_EAGLE')?.paused}
                      count={activeQueue.filter(q => q.subType === 'BLACK_EAGLE').length}
                      locked={!engineRef.current.isUnlocked('BLACK_EAGLE', localPlayerId)}
                      onClick={() => engineRef.current.startProduction('BLACK_EAGLE')}
                    onContextMenu={(e) => handleCancel('BLACK_EAGLE', e)}
                      title="Черный орел: Уникальный самолет Кореи. Мощнее и прочнее Харриера."
                    />
                  )}
                  <BuildButton 
                    label="Ночной ястреб" 
                    icon={<Wind className="w-5 h-5 text-zinc-600" />} 
                    cost={engineRef.current.getCost('NIGHT_HAWK_TRANSPORT')} cannotAfford={gameState.credits < engineRef.current.getCost('NIGHT_HAWK_TRANSPORT')} 
                    progress={activeQueue.find(q => q.subType === 'NIGHT_HAWK_TRANSPORT')?.progress} paused={activeQueue.find(q => q.subType === 'NIGHT_HAWK_TRANSPORT')?.paused}
                    count={activeQueue.filter(q => q.subType === 'NIGHT_HAWK_TRANSPORT').length}
                    locked={!engineRef.current.isUnlocked('NIGHT_HAWK_TRANSPORT', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('NIGHT_HAWK_TRANSPORT')}
                    onContextMenu={(e) => handleCancel('NIGHT_HAWK_TRANSPORT', e)}
                    title="Ночной ястреб: Транспортный вертолет, невидимый для радаров."
                  />
                  <BuildButton 
                    label="Транспорт" 
                    icon={<Waves className="w-5 h-5 text-blue-400" />} 
                    cost={engineRef.current.getCost('AMPHIBIOUS_TRANSPORT')} cannotAfford={gameState.credits < engineRef.current.getCost('AMPHIBIOUS_TRANSPORT')} 
                    progress={activeQueue.find(q => q.subType === 'AMPHIBIOUS_TRANSPORT')?.progress} paused={activeQueue.find(q => q.subType === 'AMPHIBIOUS_TRANSPORT')?.paused}
                    count={activeQueue.filter(q => q.subType === 'AMPHIBIOUS_TRANSPORT').length}
                    locked={!engineRef.current.isUnlocked('AMPHIBIOUS_TRANSPORT', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('AMPHIBIOUS_TRANSPORT')}
                    onContextMenu={(e) => handleCancel('AMPHIBIOUS_TRANSPORT', e)}
                    title="Амфибия: Перевозит пехоту и технику по воде и суше."
                  />
                  <BuildButton 
                    label="Дельфин" 
                    icon={<Waves className="w-5 h-5 text-blue-300" />} 
                    cost={engineRef.current.getCost('DOLPHIN')} cannotAfford={gameState.credits < engineRef.current.getCost('DOLPHIN')} 
                    progress={activeQueue.find(q => q.subType === 'DOLPHIN')?.progress} paused={activeQueue.find(q => q.subType === 'DOLPHIN')?.paused}
                    count={activeQueue.filter(q => q.subType === 'DOLPHIN').length}
                    locked={!engineRef.current.isUnlocked('DOLPHIN', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('DOLPHIN')}
                    
                    onContextMenu={(e) => handleCancel('DOLPHIN', e)}
                    title="Дельфин: Скрытный морской юнит, эффективен против подлодок и гигантских кальмаров."
                  />
                  <BuildButton 
                    label="Крейсер Иджис" 
                    icon={<Shield className="w-5 h-5 text-blue-500" />} 
                    cost={engineRef.current.getCost('AEGIS_CRUISER')} cannotAfford={gameState.credits < engineRef.current.getCost('AEGIS_CRUISER')} 
                    progress={activeQueue.find(q => q.subType === 'AEGIS_CRUISER')?.progress} paused={activeQueue.find(q => q.subType === 'AEGIS_CRUISER')?.paused}
                    count={activeQueue.filter(q => q.subType === 'AEGIS_CRUISER').length}
                    locked={!engineRef.current.isUnlocked('AEGIS_CRUISER', localPlayerId)}
                    onClick={() => engineRef.current.startProduction('AEGIS_CRUISER')}
                    
                    onContextMenu={(e) => handleCancel('AEGIS_CRUISER', e)}
                    title="Крейсер Иджис: Мощная противовоздушная оборона на море."
                  />
                </>
              )}
            </div>
    </>
  );
};
