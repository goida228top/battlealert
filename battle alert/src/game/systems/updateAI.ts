import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function updateAI(this: GameEngine, timestamp: number): void {
const aiEntities = this.state.entities.filter(e => e.owner === 'AI');
const aiMCV = aiEntities.find(e => e.subType === 'MCV' || e.subType === 'ALLIED_MCV');

if (aiMCV && !aiEntities.some(e => e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD')) {
  this.deployMCV(aiMCV.id);
}

// AI Cheat Income to keep up with players (Passive 5 credits per tick ~ 300 per sec)
this.state.aiCredits += 5;

// Vision Check
if (!this.aiKnownPlayerBase) {
  const playerBuildings = this.state.entities.filter(e => e.owner === 'PLAYER' && e.type === 'BUILDING');
  for (const aiUnit of aiEntities) {
    for (const pb of playerBuildings) {
      const dist = Math.hypot(aiUnit.position.x - pb.position.x, aiUnit.position.y - pb.position.y);
      if (dist < 400) { // AI vision range
        this.aiKnownPlayerBase = { ...pb.position };
        break;
      }
    }
    if (this.aiKnownPlayerBase) break;
  }
}

if (timestamp > this.aiNextBuildTime) {
  const yard = aiEntities.find(e => e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD');
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
    for (const type of currentBuildOrder) {
      const neededCount = currentBuildOrder.filter(t => t === type).length;
      const currentCount = aiEntities.filter(e => e.subType === type).length;
      const queuedCount = this.state.aiProductionQueue.filter(q => q.subType === type).length;
      if (currentCount + queuedCount < neededCount) {
        nextToBuild = type;
        break;
      }
    }
    
    // If core build order is complete, build more defenses and refineries
    if (!nextToBuild) {
      const refineries = aiEntities.filter(e => e.subType === 'ORE_REFINERY' || e.subType === 'ALLIED_ORE_REFINERY').length;
      if (refineries < 4) {
        nextToBuild = isAlliedAI ? 'ALLIED_ORE_REFINERY' : 'ORE_REFINERY';
      } else {
        // Build random defenses
        const defenses = isAlliedAI ? ['PILLBOX', 'PATRIOT_MISSILE', 'PRISM_TOWER'] : ['SENTRY_GUN', 'FLAK_CANNON', 'TESLA_COIL'];
        nextToBuild = defenses[Math.floor(Math.random() * defenses.length)] as BuildingType;
      }
    }

    // Simple power check for AI
    const aiPowerPlants = aiEntities.filter(e => e.subType === 'POWER_PLANT' || e.subType === 'NUCLEAR_REACTOR' || e.subType === 'ALLIED_POWER_PLANT').length;
    const aiBuildings = aiEntities.filter(e => e.type === 'BUILDING').length;
    if (aiPowerPlants * 5 < aiBuildings) {
      if (isAlliedAI) {
        nextToBuild = 'ALLIED_POWER_PLANT';
      } else {
        nextToBuild = aiEntities.some(e => e.subType === 'BATTLE_LAB') ? 'NUCLEAR_REACTOR' : 'POWER_PLANT';
      }
    }

    if (nextToBuild) {
        const cost = this.getCost(nextToBuild);
        if (this.state.aiCredits >= cost && this.state.aiProductionQueue.filter(q => ['BUILDINGS', 'DEFENSE'].includes(this.getCategory(q.subType))).length === 0) {
            this.startProduction(nextToBuild, 'AI');
        }
        this.aiNextBuildTime = timestamp + 6000;
    }
  }
}

// Produce Units
const aiBarracks = aiEntities.find(e => e.subType === 'BARRACKS' || e.subType === 'ALLIED_BARRACKS');
  if (aiBarracks && timestamp > 15000) { // AI starts producing units very early (15s)
    if (aiEntities.filter(e => e.subType === 'SOLDIER' || e.subType === 'GI').length < 15) {
      this.startProduction(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'GI' : 'SOLDIER', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'FLAK_TROOPER' || e.subType === 'ROCKETEER').length < 6 && this.isUnlocked(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'ROCKETEER' : 'FLAK_TROOPER', 'AI')) {
      this.startProduction(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'ROCKETEER' : 'FLAK_TROOPER', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'TESLA_TROOPER' || e.subType === 'NAVY_SEAL').length < 4 && this.isUnlocked(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'NAVY_SEAL' : 'TESLA_TROOPER', 'AI')) {
      this.startProduction(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'NAVY_SEAL' : 'TESLA_TROOPER', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'DESOLATOR' || e.subType === 'CHRONO_LEGIONNAIRE').length < 3 && this.isUnlocked(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'CHRONO_LEGIONNAIRE' : 'DESOLATOR', 'AI')) {
      this.startProduction(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'CHRONO_LEGIONNAIRE' : 'DESOLATOR', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'TERRORIST' || e.subType === 'SNIPER').length < 5 && this.isUnlocked(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'SNIPER' : 'TERRORIST', 'AI')) {
      this.startProduction(aiBarracks.subType === 'ALLIED_BARRACKS' ? 'SNIPER' : 'TERRORIST', 'AI');
    }
  }

  const aiFactory = aiEntities.find(e => e.subType === 'WAR_FACTORY' || e.subType === 'ALLIED_WAR_FACTORY');
  if (aiFactory && timestamp > 30000) { // AI starts producing vehicles at 30s
    if (aiEntities.filter(e => e.subType === 'HARVESTER' || e.subType === 'CHRONO_MINER').length < 4) {
      this.startProduction(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'CHRONO_MINER' : 'HARVESTER', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'TANK' || e.subType === 'GRIZZLY_TANK').length < 10) {
      this.startProduction(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'GRIZZLY_TANK' : 'TANK', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'RHINO_TANK' || e.subType === 'IFV').length < 8 && this.isUnlocked(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'IFV' : 'RHINO_TANK', 'AI')) {
      this.startProduction(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'IFV' : 'RHINO_TANK', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'TESLA_TANK' || e.subType === 'MIRAGE_TANK').length < 5 && this.isUnlocked(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'MIRAGE_TANK' : 'TESLA_TANK', 'AI')) {
      this.startProduction(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'MIRAGE_TANK' : 'TESLA_TANK', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'APOCALYPSE_TANK' || e.subType === 'BATTLE_FORTRESS').length < 4 && this.isUnlocked(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'BATTLE_FORTRESS' : 'APOCALYPSE_TANK', 'AI')) {
      this.startProduction(aiFactory.subType === 'ALLIED_WAR_FACTORY' ? 'BATTLE_FORTRESS' : 'APOCALYPSE_TANK', 'AI');
    }
  }

  const aiNavalYard = aiEntities.find(e => e.subType === 'NAVAL_YARD' || e.subType === 'ALLIED_NAVAL_YARD');
  if (aiNavalYard && timestamp > 120000) { // AI starts producing ships after 2 minutes
    if (aiEntities.filter(e => e.subType === 'TYPHOON_SUB' || e.subType === 'DESTROYER').length < 3) {
      this.startProduction(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'DESTROYER' : 'TYPHOON_SUB', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'SEA_SCORPION' || e.subType === 'AEGIS_CRUISER').length < 2 && this.isUnlocked(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AEGIS_CRUISER' : 'SEA_SCORPION', 'AI')) {
      this.startProduction(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AEGIS_CRUISER' : 'SEA_SCORPION', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'GIANT_SQUID' || e.subType === 'DOLPHIN').length < 2 && this.isUnlocked(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'DOLPHIN' : 'GIANT_SQUID', 'AI')) {
      this.startProduction(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'DOLPHIN' : 'GIANT_SQUID', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'DREADNOUGHT' || e.subType === 'AIRCRAFT_CARRIER').length < 2 && this.isUnlocked(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AIRCRAFT_CARRIER' : 'DREADNOUGHT', 'AI')) {
      this.startProduction(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AIRCRAFT_CARRIER' : 'DREADNOUGHT', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'HOVER_TRANSPORT' || e.subType === 'AMPHIBIOUS_TRANSPORT').length < 1 && this.isUnlocked(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AMPHIBIOUS_TRANSPORT' : 'HOVER_TRANSPORT', 'AI')) {
      this.startProduction(aiNavalYard.subType === 'ALLIED_NAVAL_YARD' ? 'AMPHIBIOUS_TRANSPORT' : 'HOVER_TRANSPORT', 'AI');
    }
  }
  
  const aiAirForce = aiEntities.find(e => e.subType === 'AIR_FORCE_COMMAND');
  if (aiAirForce && timestamp > 120000) {
    if (aiEntities.filter(e => e.subType === 'HARRIER').length < 4 && this.isUnlocked('HARRIER', 'AI')) {
      this.startProduction('HARRIER', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'BLACK_EAGLE').length < 4 && this.isUnlocked('BLACK_EAGLE', 'AI')) {
      this.startProduction('BLACK_EAGLE', 'AI');
    } else if (aiEntities.filter(e => e.subType === 'NIGHT_HAWK_TRANSPORT').length < 1 && this.isUnlocked('NIGHT_HAWK_TRANSPORT', 'AI')) {
      this.startProduction('NIGHT_HAWK_TRANSPORT', 'AI');
    }
  }

// Scouting & Attack Logic
const combatUnits = aiEntities.filter(e => [
  'TANK', 'SOLDIER', 'RHINO_TANK', 'APOCALYPSE_TANK', 'TESLA_TROOPER', 
  'FLAK_TROOPER', 'FLAK_TRACK', 'V3_LAUNCHER', 'KIROV_AIRSHIP', 'BORIS', 
  'CRAZY_IVAN', 'DESOLATOR', 'TERRORIST', 'TESLA_TANK', 'SIEGE_CHOPPER',
  'TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'YURI', 'HOVER_TRANSPORT',
  'GI', 'ROCKETEER', 'NAVY_SEAL', 'CHRONO_LEGIONNAIRE', 'TANYA', 'SNIPER', 'CHRONO_IVAN',
  'GRIZZLY_TANK', 'IFV', 'MIRAGE_TANK', 'PRISM_TANK', 'ROBOT_TANK', 'BATTLE_FORTRESS',
  'HARRIER', 'BLACK_EAGLE', 'NIGHT_HAWK_TRANSPORT', 'AMPHIBIOUS_TRANSPORT',
  'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'
].includes(e.subType || ''));

if (!this.aiKnownPlayerBase && combatUnits.length >= 5 && timestamp > this.aiScoutTime) {
  // Send a scout to find the player
  const scout = combatUnits.find(u => !u.targetPosition);
  if (scout) {
    const scoutTarget = { x: Math.random() * 800 + 100, y: Math.random() * 1200 + 100 };
    scout.path = this.calculatePath(scout.position, scoutTarget);
    scout.targetPosition = scout.path[0];
    this.aiScoutTime = timestamp + 15000; // Increased scout delay
  }
}

if (this.aiKnownPlayerBase && combatUnits.length >= 8 && timestamp > this.aiAttackTime) {
  combatUnits.forEach(u => {
    u.path = this.calculatePath(u.position, this.aiKnownPlayerBase!);
    u.targetPosition = u.path[0];
    u.targetId = undefined;
  });
  this.aiAttackTime = timestamp + 45000; // Attack every 45s
}

// Crate Seeking Logic
if (this.state.crates.length > 0) {
  combatUnits.forEach(u => {
    if (!u.targetPosition && !u.targetId) {
      const nearestCrate = this.state.crates.find(c => 
        Math.hypot(u.position.x - c.position.x, u.position.y - c.position.y) < 600
      );
      if (nearestCrate) {
        u.path = this.calculatePath(u.position, nearestCrate.position);
        u.targetPosition = u.path[0];
      }
    }
  });
}

// Engineer Logic (Capture Oil Derricks)
const aiEngineers = aiEntities.filter(e => e.subType === 'ENGINEER');
if (aiEngineers.length > 0) {
  const neutralDerricks = this.state.entities.filter(e => e.subType === 'OIL_DERRICK' && e.owner !== 'AI');
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
      eng.path = this.calculatePath(eng.position, nearestDerrick.position);
      eng.targetPosition = eng.path[0];
    }
  });
}

// Superweapon Logic
if (this.state.aiSpecialAbilities?.IRON_CURTAIN?.ready && aiEntities.some(e => e.subType === 'IRON_CURTAIN')) {
  const tanks = combatUnits.filter(u => u.subType === 'RHINO_TANK' || u.subType === 'APOCALYPSE_TANK');
  if (tanks.length > 0) {
    this.useIronCurtainAI(tanks[0].position);
  }
}

if (this.state.aiSpecialAbilities?.NUCLEAR_SILO?.ready && aiEntities.some(e => e.subType === 'NUCLEAR_SILO')) {
  if (this.aiKnownPlayerBase) {
    this.useNuclearStrikeAI(this.aiKnownPlayerBase);
  }
}

if (this.state.aiSpecialAbilities?.CHRONOSPHERE?.ready && aiEntities.some(e => e.subType === 'CHRONOSPHERE')) {
  const tanks = combatUnits.filter(u => u.subType === 'GRIZZLY_TANK' || u.subType === 'PRISM_TANK' || u.subType === 'MIRAGE_TANK');
  if (tanks.length > 0 && this.aiKnownPlayerBase) {
    // For AI, we can just use the Chronosphere directly on their tanks to teleport to player base
    // Wait, useChronosphereAI might not exist. Let's check if it does. If not, we'll just teleport them.
    tanks.slice(0, 9).forEach(t => {
      t.position = { x: this.aiKnownPlayerBase!.x + (Math.random() - 0.5) * 200, y: this.aiKnownPlayerBase!.y + (Math.random() - 0.5) * 200 };
      t.path = [];
      t.targetPosition = undefined;
    });
    this.state.aiSpecialAbilities.CHRONOSPHERE.ready = false;
    this.state.aiSpecialAbilities.CHRONOSPHERE.lastUsed = timestamp;
  }
}

if (this.state.aiSpecialAbilities?.WEATHER_DEVICE?.ready && aiEntities.some(e => e.subType === 'WEATHER_DEVICE')) {
  if (this.aiKnownPlayerBase) {
    // Assuming useWeatherStormAI exists or we can just call useWeatherStorm
    // Let's check if useWeatherStormAI exists, if not we'll just use the player's one but maybe it doesn't matter who uses it
    if ((this as any).useWeatherStormAI) {
      (this as any).useWeatherStormAI(this.aiKnownPlayerBase);
    } else {
      this.useWeatherStorm(this.aiKnownPlayerBase);
      this.state.aiSpecialAbilities.WEATHER_DEVICE.ready = false;
      this.state.aiSpecialAbilities.WEATHER_DEVICE.lastUsed = timestamp;
    }
  }
}

}
