import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function updateAI(this: GameEngine, timestamp: number): void {
  let bots = this.state.botSlots || [];
  
  // Create state objects if they don't exist
  if (!this.aiStates) this.aiStates = {};

  bots.forEach(botOwner => {
     let aiId = botOwner;
     if (!this.aiStates[aiId]) {
        this.aiStates[aiId] = {
           knownPlayerBase: null,
           nextBuildTime: 0,
           scoutTime: 0,
           attackTime: 0
        };
     }
     const botState = this.aiStates[aiId];

     // Use helper functions or directly map to the owner string
     // owner inside this function refers to botOwner
     const addCredits = (amount: number) => {
         if (botOwner === 'PLAYER') this.state.credits += amount;
         else if (botOwner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) + amount;
         else if (botOwner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + amount;
         else if (botOwner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + amount;
     };
     const getCreditsLocal = () => {
         if (botOwner === 'PLAYER') return this.state.credits;
         if (botOwner === 'PLAYER_2') return this.state.p2Credits || 0;
         if (botOwner === 'PLAYER_3') return this.state.p3Credits || 0;
         if (botOwner === 'PLAYER_4') return this.state.p4Credits || 0;
         return 0;
     };
     const getQueueLocal = () => {
         if (botOwner === 'PLAYER') return this.state.productionQueue;
         if (botOwner === 'PLAYER_2') return this.state.p2ProductionQueue || [];
         if (botOwner === 'PLAYER_3') return this.state.p3ProductionQueue || [];
         if (botOwner === 'PLAYER_4') return this.state.p4ProductionQueue || [];
         return [];
     };
     const getSpecialLocal = () => {
         if (botOwner === 'PLAYER') return this.state.specialAbilities;
         if (botOwner === 'PLAYER_2') return this.state.p2SpecialAbilities;
         if (botOwner === 'PLAYER_3') return this.state.p3SpecialAbilities;
         if (botOwner === 'PLAYER_4') return this.state.p4SpecialAbilities;
         return undefined;
     };

     // The core logic starts here:
      const difficulty = this.state.botDifficulties?.[botOwner] || 'NORMAL';
     const diffParams = {
        EASY: { income: 3, buildDelay: 8000, infLmt: 4, tnkLmt: 2, atkLimit: 4, atkDelay: 60000 },
        NORMAL: { income: 8, buildDelay: 3500, infLmt: 8, tnkLmt: 4, atkLimit: 6, atkDelay: 30000 },
        HARD: { income: 15, buildDelay: 1500, infLmt: 20, tnkLmt: 10, atkLimit: 12, atkDelay: 15000 }
     }[difficulty] || { income: 8, buildDelay: 3500, infLmt: 8, tnkLmt: 4, atkLimit: 6, atkDelay: 30000 };
     
     // Use cached entities from frameCache
     const aiUnits = (this as any).frameCache.unitsByOwner[botOwner] || [];
     const aiBuildings = (this as any).frameCache.buildingsByOwner[botOwner] || [];
     const botEntities = aiUnits.concat(aiBuildings);
     const enemies = (this as any).frameCache.enemiesByOwner[botOwner] || [];
     const enemyBuildings = enemies.filter(e => e.type === 'BUILDING' && e.subType !== 'TREE' && e.subType !== 'MOUNTAIN');
     
     const counts: Record<string, number> = {};
     botEntities.forEach(e => {
       if (e.subType) counts[e.subType] = (counts[e.subType] || 0) + 1;
     });

     const aiMCV = aiUnits.find(e => e.subType === 'MCV' || e.subType === 'ALLIED_MCV');
     const hasYard = (counts['CONSTRUCTION_YARD'] || 0) > 0 || (counts['ALLIED_CONSTRUCTION_YARD'] || 0) > 0;

     if (aiMCV && !hasYard) {
       this.deployMCV(aiMCV.id);
     }

     // AI Cheat Income to keep up with players
     addCredits(diffParams.income);

     // Cheat to find player base immediately if it's skirmish
     if (!botState.knownPlayerBase) {
        const playerYard = enemies.find(e => e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD');
        if (playerYard) {
           botState.knownPlayerBase = { ...playerYard.position };
        } else {
           // Fallback to searching nearby buildings
           const anyEnemyBuilding = enemies.find(e => e.type === 'BUILDING' && e.subType !== 'TREE' && e.subType !== 'MOUNTAIN');
           if (anyEnemyBuilding) botState.knownPlayerBase = { ...anyEnemyBuilding.position };
        }
     }

if (timestamp > botState.nextBuildTime) {
  const yard = aiBuildings.find(e => e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD');
  if (yard) {
    // Determine AI faction based on yard type
    const isAlliedAI = yard.subType === 'ALLIED_CONSTRUCTION_YARD';
    
    const sovietBuildOrder: BuildingType[] = [
      'POWER_PLANT', 'ORE_REFINERY', 'BARRACKS', 'ORE_REFINERY', 'WAR_FACTORY', 'POWER_PLANT', 'RADAR',
      'SENTRY_GUN', 'FLAK_CANNON', 'TESLA_COIL', 'BATTLE_LAB', 'NUCLEAR_REACTOR',
      'INDUSTRIAL_PLANT', 'CLONING_VATS', 'IRON_CURTAIN', 'NUCLEAR_SILO'
    ];
    
    const alliedBuildOrder: BuildingType[] = [
      'ALLIED_POWER_PLANT', 'ALLIED_ORE_REFINERY', 'ALLIED_BARRACKS', 'ALLIED_ORE_REFINERY', 'ALLIED_WAR_FACTORY', 'ALLIED_POWER_PLANT', 'AIR_FORCE_COMMAND',
      'PILLBOX', 'PATRIOT_MISSILE', 'PRISM_TOWER', 'ALLIED_BATTLE_LAB', 'ALLIED_ORE_PURIFIER',
      'GAP_GENERATOR', 'CHRONOSPHERE', 'WEATHER_DEVICE'
    ];

    const currentBuildOrder = isAlliedAI ? alliedBuildOrder : sovietBuildOrder;

    // AI will build the first thing in the order that doesn't exist or is requested multiple times
    let nextToBuild: BuildingType | undefined;
    const currentQueue = getQueueLocal();
    
    for (const type of currentBuildOrder) {
      const neededCount = currentBuildOrder.filter(t => t === type).length;
      const currentCount = counts[type] || 0;
      const queuedCount = currentQueue.filter(q => q.subType === type).length;
      if (currentCount + queuedCount < neededCount) {
        nextToBuild = type;
        break;
      }
    }
    
    // If core build order is complete, build more defenses and refineries
    if (!nextToBuild) {
      const refineries = (counts['ORE_REFINERY'] || 0) + (counts['ALLIED_ORE_REFINERY'] || 0);
      if (refineries < 4) {
        nextToBuild = isAlliedAI ? 'ALLIED_ORE_REFINERY' : 'ORE_REFINERY';
      } else {
        // Build random defenses
        const defenses = isAlliedAI ? ['PILLBOX', 'PATRIOT_MISSILE', 'PRISM_TOWER'] : ['SENTRY_GUN', 'FLAK_CANNON', 'TESLA_COIL'];
        nextToBuild = defenses[Math.floor(Math.random() * defenses.length)] as BuildingType;
      }
    }

    // Simple power check for AI
    const aiPowerPlants = (counts['POWER_PLANT'] || 0) + (counts['NUCLEAR_REACTOR'] || 0) + (counts['ALLIED_POWER_PLANT'] || 0);
    const aiBuildingsCount = aiBuildings.length;
    if (aiPowerPlants * 5 < aiBuildingsCount) {
      if (isAlliedAI) {
        nextToBuild = 'ALLIED_POWER_PLANT';
      } else {
        nextToBuild = (counts['BATTLE_LAB'] || 0) > 0 ? 'NUCLEAR_REACTOR' : 'POWER_PLANT';
      }
    }

    if (nextToBuild) {
        const cost = this.getCost(nextToBuild);
        if (getCreditsLocal() >= cost && currentQueue.filter(q => ['BUILDINGS', 'DEFENSE'].includes(this.getCategory(q.subType))).length === 0) {
            this.startProduction(nextToBuild, botOwner);
        }
        botState.nextBuildTime = timestamp + diffParams.buildDelay; // Scale build speed based on difficulty
    }
  }
}

// Infantry Production
const barracksSubType = aiBuildings.find(e => e.subType === 'BARRACKS' || e.subType === 'ALLIED_BARRACKS')?.subType;
if (barracksSubType) {
    const isAllied = barracksSubType === 'ALLIED_BARRACKS';
    const mainInfantry = isAllied ? 'GI' : 'SOLDIER';
    const antiAirInfantry = isAllied ? 'ROCKETEER' : 'FLAK_TROOPER';
    const specialInfantry = isAllied ? 'TANYA' : 'BORIS';

    const currentQueue = getQueueLocal();
    const infantryQueue = currentQueue.filter(q => this.getCategory(q.subType) === 'INFANTRY');
    
    if (infantryQueue.length < 1) { // Throttle queue efficiency for AI
      if ((counts[mainInfantry] || 0) < diffParams.infLmt) {
        this.startProduction(mainInfantry, botOwner);
      } else if ((counts[antiAirInfantry] || 0) < Math.floor(diffParams.infLmt * 0.4) && this.isUnlocked(antiAirInfantry, botOwner)) {
        this.startProduction(antiAirInfantry, botOwner);
      } else if ((counts[specialInfantry] || 0) < Math.floor(diffParams.infLmt * 0.1) && this.isUnlocked(specialInfantry, botOwner)) {
        this.startProduction(specialInfantry, botOwner);
      }
    }
}

// Vehicle Production
const factorySubType = aiBuildings.find(e => e.subType === 'WAR_FACTORY' || e.subType === 'ALLIED_WAR_FACTORY')?.subType;
if (factorySubType) {
    const isAllied = factorySubType === 'ALLIED_WAR_FACTORY';
    const mainHarvester = isAllied ? 'CHRONO_MINER' : 'HARVESTER';
    const mainTank = isAllied ? 'GRIZZLY_TANK' : 'TANK';
    const offensiveTank = isAllied ? 'IFV' : 'RHINO_TANK';
    const heavyTank = isAllied ? 'BATTLE_FORTRESS' : 'APOCALYPSE_TANK';

    const currentQueue = getQueueLocal();
    const vehicleQueue = currentQueue.filter(q => this.getCategory(q.subType) === 'VEHICLES');

    if (vehicleQueue.length < 1) { // Throttle queue efficiency
      if ((counts[mainHarvester] || 0) < 2) {
        this.startProduction(mainHarvester, botOwner);
      } else if ((counts[mainTank] || 0) < diffParams.tnkLmt) {
        this.startProduction(mainTank, botOwner);
      } else if ((counts[offensiveTank] || 0) < Math.floor(diffParams.tnkLmt * 0.75) && this.isUnlocked(offensiveTank, botOwner)) {
        this.startProduction(offensiveTank, botOwner);
      } else if ((counts[heavyTank] || 0) < Math.floor(diffParams.tnkLmt * 0.4) && this.isUnlocked(heavyTank, botOwner)) {
        this.startProduction(heavyTank, botOwner);
      }
    }
}

  const navalYardSubType = aiBuildings.find(e => e.subType === 'NAVAL_YARD' || e.subType === 'ALLIED_NAVAL_YARD')?.subType;
  if (navalYardSubType && timestamp > 120000) { // AI starts producing ships after 2 minutes
    const isAllied = navalYardSubType === 'ALLIED_NAVAL_YARD';
    if (((counts['TYPHOON_SUB'] || 0) + (counts['DESTROYER'] || 0)) < 3) {
      this.startProduction(isAllied ? 'DESTROYER' : 'TYPHOON_SUB', botOwner);
    } else if (((counts['SEA_SCORPION'] || 0) + (counts['AEGIS_CRUISER'] || 0)) < 2 && this.isUnlocked(isAllied ? 'AEGIS_CRUISER' : 'SEA_SCORPION', botOwner)) {
      this.startProduction(isAllied ? 'AEGIS_CRUISER' : 'SEA_SCORPION', botOwner);
    } else if (((counts['GIANT_SQUID'] || 0) + (counts['DOLPHIN'] || 0)) < 2 && this.isUnlocked(isAllied ? 'DOLPHIN' : 'GIANT_SQUID', botOwner)) {
      this.startProduction(isAllied ? 'DOLPHIN' : 'GIANT_SQUID', botOwner);
    } else if (((counts['DREADNOUGHT'] || 0) + (counts['AIRCRAFT_CARRIER'] || 0)) < 2 && this.isUnlocked(isAllied ? 'AIRCRAFT_CARRIER' : 'DREADNOUGHT', botOwner)) {
      this.startProduction(isAllied ? 'AIRCRAFT_CARRIER' : 'DREADNOUGHT', botOwner);
    } else if (((counts['HOVER_TRANSPORT'] || 0) + (counts['AMPHIBIOUS_TRANSPORT'] || 0)) < 1 && this.isUnlocked(isAllied ? 'AMPHIBIOUS_TRANSPORT' : 'HOVER_TRANSPORT', botOwner)) {
      this.startProduction(isAllied ? 'AMPHIBIOUS_TRANSPORT' : 'HOVER_TRANSPORT', botOwner);
    }
  }
  
  if (counts['AIR_FORCE_COMMAND'] > 0 && timestamp > 120000) {
    if ((counts['HARRIER'] || 0) < 4 && this.isUnlocked('HARRIER', botOwner)) {
      this.startProduction('HARRIER', botOwner);
    } else if ((counts['BLACK_EAGLE'] || 0) < 4 && this.isUnlocked('BLACK_EAGLE', botOwner)) {
      this.startProduction('BLACK_EAGLE', botOwner);
    } else if ((counts['NIGHT_HAWK_TRANSPORT'] || 0) < 1 && this.isUnlocked('NIGHT_HAWK_TRANSPORT', botOwner)) {
      this.startProduction('NIGHT_HAWK_TRANSPORT', botOwner);
    }
  }

// Scouting & Attack Logic
const combatUnits = aiUnits.filter(e => [
  'TANK', 'SOLDIER', 'RHINO_TANK', 'APOCALYPSE_TANK', 'TESLA_TROOPER', 
  'FLAK_TROOPER', 'FLAK_TRACK', 'V3_LAUNCHER', 'KIROV_AIRSHIP', 'BORIS', 
  'CRAZY_IVAN', 'DESOLATOR', 'TERRORIST', 'TESLA_TANK', 'SIEGE_CHOPPER',
  'TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'YURI', 'HOVER_TRANSPORT',
  'GI', 'ROCKETEER', 'NAVY_SEAL', 'CHRONO_LEGIONNAIRE', 'TANYA', 'SNIPER', 'CHRONO_IVAN',
  'GRIZZLY_TANK', 'IFV', 'MIRAGE_TANK', 'PRISM_TANK', 'ROBOT_TANK', 'BATTLE_FORTRESS',
  'HARRIER', 'BLACK_EAGLE', 'NIGHT_HAWK_TRANSPORT', 'AMPHIBIOUS_TRANSPORT',
  'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'
].includes(e.subType || ''));

if (!botState.knownPlayerBase && combatUnits.length >= 5 && timestamp > botState.scoutTime) {
  // Send a scout patrol to find the player (2-3 units instead of 1)
  const idleUnits = combatUnits.filter(u => !u.targetPosition && !u.isAttackMoving);
  // Pick up to 3 units for a scout patrol
  const scouts = idleUnits.slice(0, 3);
  
  if (scouts.length > 0) {
    const scoutTarget = { 
      x: Math.random() * this.state.map.width * this.state.map.tileSize, 
      y: Math.random() * this.state.map.height * this.state.map.tileSize 
    };
    
    scouts.forEach(scout => {
      scout.path = this.calculatePath(scout.position, scoutTarget, scout);
      scout.targetPosition = scout.path?.[0];
    });
    botState.scoutTime = timestamp + 15000;
  }
}

if (botState.knownPlayerBase && combatUnits.length >= diffParams.atkLimit && timestamp > botState.attackTime) {
  // Send all combat units to attack
  combatUnits.forEach(u => {
    if (u.isAttackMoving && Math.random() > 0.1) return; // Keep going if already attacking, with some re-tasking

    // Target a random building or units if buildings are gone
    let targetEntity = enemyBuildings.length > 0 
      ? enemyBuildings[Math.floor(Math.random() * enemyBuildings.length)]
      : (enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)] : null);
      
    const targetPos = targetEntity ? targetEntity.position : botState.knownPlayerBase!;
      
    u.path = this.calculatePath(u.position, targetPos, u);
    if (u.path && u.path.length > 0) {
      u.targetPosition = u.path[0];
      u.targetId = undefined;
      u.isAttackMoving = true;
      u.attackMoveTarget = { ...targetPos };
    }
  });
  botState.attackTime = timestamp + diffParams.atkDelay;
}

// Crate Seeking Logic OR idle attack
if (this.state.crates.length > 0) {
  combatUnits.forEach(u => {
    if (!u.targetPosition && !u.targetId && !u.isAttackMoving) { // Only idle, non-attacking units seek crates
      const nearestCrate = this.state.crates.find(c => 
        Math.hypot(u.position.x - c.position.x, u.position.y - c.position.y) < 600
      );
      if (nearestCrate) {
        u.path = this.calculatePath(u.position, nearestCrate.position, u);
        if (u.path && u.path.length > 0) {
           u.targetPosition = u.path[0];
        }
      }
    }
  });
}

// Push idle attacking units forward
combatUnits.forEach(u => {
  if (u.isAttackMoving && !u.targetPosition && !u.targetId && botState.knownPlayerBase) {
    // If they reached the known base and see no buildings, clear the known base so they scout again
    const distToBase = Math.hypot(u.position.x - botState.knownPlayerBase.x, u.position.y - botState.knownPlayerBase.y);
    if (distToBase < 200 && enemyBuildings.length === 0) {
        botState.knownPlayerBase = null;
        return; // Next loop it will trigger scout logic
    }

    // If they finished attack move but enemies probably still exist, find a new target
    const targetBuilding = enemyBuildings.length > 0 
      ? enemyBuildings[Math.floor(Math.random() * enemyBuildings.length)]
      : null;
      
    const targetPos = targetBuilding ? targetBuilding.position : botState.knownPlayerBase;

    // More aggressive re-tasking: if idle and in attack mode, always find something to do
    if (targetPos) {
        u.path = this.calculatePath(u.position, targetPos, u);
        if (u.path && u.path.length > 0) {
            u.targetPosition = u.path[0];
            u.attackMoveTarget = { ...targetPos };
        }
    }
  }
});

// Engineer Logic (Capture Oil Derricks)
const aiEngineers = aiUnits.filter(e => e.subType === 'ENGINEER');
if (aiEngineers.length > 0) {
  const neutralDerricks = (this as any).frameCache.enemiesByOwner[botOwner]?.filter((e: any) => e.subType === 'OIL_DERRICK') || [];
  aiEngineers.forEach(eng => {
    if (!eng.targetPosition && !eng.targetId && neutralDerricks.length > 0) {
      // Find nearest neutral derrick
      let nearestDerrick = neutralDerricks[0];
      let minDist = Math.hypot(eng.position.x - nearestDerrick.position.x, eng.position.y - nearestDerrick.position.y);
      
      for (let i = 1; i < neutralDerricks.length; i++) {
        const dist = Math.hypot(eng.position.x - neutralDerricks[i].position.x, eng.position.y - neutralDerricks[i].position.y);
        if (dist < minDist) {
          minDist = dist;
          nearestDerrick = neutralDerricks[i];
        }
      }
      
      eng.targetId = nearestDerrick.id;
      eng.path = this.calculatePath(eng.position, nearestDerrick.position, eng);
      eng.targetPosition = eng.path[0];
    }
  });
}

// Superweapon Logic
if (getSpecialLocal()?.IRON_CURTAIN?.ready && aiBuildings.some(e => e.subType === 'IRON_CURTAIN')) {
  const tanks = combatUnits.filter(u => u.subType === 'RHINO_TANK' || u.subType === 'APOCALYPSE_TANK');
  if (tanks.length > 0) {
    this.useIronCurtainAI(tanks[0].position);
  }
}

if (getSpecialLocal()?.NUCLEAR_SILO?.ready && aiBuildings.some(e => e.subType === 'NUCLEAR_SILO')) {
  if (botState.knownPlayerBase) {
    this.useNuclearStrikeAI(botState.knownPlayerBase);
  }
}

if (getSpecialLocal()?.CHRONOSPHERE?.ready && aiBuildings.some(e => e.subType === 'CHRONOSPHERE')) {
  const tanks = combatUnits.filter(u => u.subType === 'GRIZZLY_TANK' || u.subType === 'PRISM_TANK' || u.subType === 'MIRAGE_TANK');
  if (tanks.length > 0 && botState.knownPlayerBase) {
    // For AI, we can just use the Chronosphere directly on their tanks to teleport to player base
    // Wait, useChronosphereAI might not exist. Let's check if it does. If not, we'll just teleport them.
    tanks.slice(0, 9).forEach(t => {
      t.position = { x: botState.knownPlayerBase!.x + (Math.random() - 0.5) * 200, y: botState.knownPlayerBase!.y + (Math.random() - 0.5) * 200 };
      t.path = [];
      t.targetPosition = undefined;
    });
    getSpecialLocal().CHRONOSPHERE.ready = false;
    getSpecialLocal().CHRONOSPHERE.lastUsed = timestamp;
  }
}

if (getSpecialLocal()?.WEATHER_DEVICE?.ready && aiBuildings.some(e => e.subType === 'WEATHER_DEVICE')) {
  if (botState.knownPlayerBase) {
    // Assuming useWeatherStormAI exists or we can just call useWeatherStorm
    // Let's check if useWeatherStormAI exists, if not we'll just use the player's one but maybe it doesn't matter who uses it
    if ((this as any).useWeatherStormAI) {
      (this as any).useWeatherStormAI(botState.knownPlayerBase);
    } else {
      this.useWeatherStorm(botState.knownPlayerBase);
      getSpecialLocal().WEATHER_DEVICE.ready = false;
      getSpecialLocal().WEATHER_DEVICE.lastUsed = timestamp;
    }
  }
}

  });
}
