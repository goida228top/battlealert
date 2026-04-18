import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function updateSpecialAbilities(this: GameEngine, timestamp: number): void {
// Player Abilities
const hasIronCurtain = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'IRON_CURTAIN');
const hasNuclearSilo = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'NUCLEAR_SILO');
const hasRadar = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'RADAR');
const hasBattleLab = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'BATTLE_LAB');
const hasChronosphere = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'CHRONOSPHERE');
const hasWeatherDevice = this.state.entities.some(e => e.owner === 'PLAYER' && e.subType === 'WEATHER_DEVICE');

if (hasIronCurtain) {
  const ic = this.state.specialAbilities.IRON_CURTAIN;
  if (!ic.ready && timestamp - ic.lastUsed > ic.cooldown) {
    ic.ready = true;
  }
} else {
  this.state.specialAbilities.IRON_CURTAIN.ready = false;
}

if (hasNuclearSilo) {
  const ns = this.state.specialAbilities.NUCLEAR_SILO;
  if (!ns.ready && timestamp - ns.lastUsed > ns.cooldown) {
    ns.ready = true;
  }
} else {
  this.state.specialAbilities.NUCLEAR_SILO.ready = false;
}

if (hasChronosphere) {
  const cs = this.state.specialAbilities.CHRONOSPHERE;
  if (!cs.ready && timestamp - cs.lastUsed > cs.cooldown) {
    cs.ready = true;
  }
} else {
  this.state.specialAbilities.CHRONOSPHERE.ready = false;
}

if (hasWeatherDevice) {
  const wd = this.state.specialAbilities.WEATHER_DEVICE;
  if (!wd.ready && timestamp - wd.lastUsed > wd.cooldown) {
    wd.ready = true;
  }
} else {
  this.state.specialAbilities.WEATHER_DEVICE.ready = false;
}

if (hasRadar) {
  const sp = this.state.specialAbilities.SPY_PLANE;
  if (sp && !sp.ready && timestamp - sp.lastUsed > sp.cooldown) {
    sp.ready = true;
  }
} else if (this.state.specialAbilities.SPY_PLANE) {
  this.state.specialAbilities.SPY_PLANE.ready = false;
}

if (hasBattleLab) {
  const pt = this.state.specialAbilities.PARATROOPERS;
  if (pt && !pt.ready && timestamp - pt.lastUsed > pt.cooldown) {
    pt.ready = true;
  }
} else if (this.state.specialAbilities.PARATROOPERS) {
  this.state.specialAbilities.PARATROOPERS.ready = false;
}

// PLAYER_2 Abilities
const aiHasIronCurtain = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'IRON_CURTAIN');
const aiHasNuclearSilo = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'NUCLEAR_SILO');
const aiHasRadar = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'RADAR');
const aiHasBattleLab = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'BATTLE_LAB');
const aiHasChronosphere = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'CHRONOSPHERE');
const aiHasWeatherDevice = this.state.entities.some(e => e.owner === 'PLAYER_2' && e.subType === 'WEATHER_DEVICE');

if (aiHasIronCurtain) {
  const ic = this.state.p2SpecialAbilities.IRON_CURTAIN;
  if (!ic.ready && timestamp - ic.lastUsed > ic.cooldown) {
    ic.ready = true;
  }
} else {
  this.state.p2SpecialAbilities.IRON_CURTAIN.ready = false;
}

if (aiHasNuclearSilo) {
  const ns = this.state.p2SpecialAbilities.NUCLEAR_SILO;
  if (!ns.ready && timestamp - ns.lastUsed > ns.cooldown) {
    ns.ready = true;
  }
} else {
  this.state.p2SpecialAbilities.NUCLEAR_SILO.ready = false;
}

if (aiHasChronosphere) {
  const cs = this.state.p2SpecialAbilities.CHRONOSPHERE;
  if (!cs.ready && timestamp - cs.lastUsed > cs.cooldown) {
    cs.ready = true;
  }
} else {
  this.state.p2SpecialAbilities.CHRONOSPHERE.ready = false;
}

if (aiHasWeatherDevice) {
  const wd = this.state.p2SpecialAbilities.WEATHER_DEVICE;
  if (!wd.ready && timestamp - wd.lastUsed > wd.cooldown) {
    wd.ready = true;
  }
} else {
  this.state.p2SpecialAbilities.WEATHER_DEVICE.ready = false;
}

if (aiHasRadar) {
  const sp = this.state.p2SpecialAbilities.SPY_PLANE;
  if (sp && !sp.ready && timestamp - sp.lastUsed > sp.cooldown) {
    sp.ready = true;
  }
} else if (this.state.p2SpecialAbilities.SPY_PLANE) {
  this.state.p2SpecialAbilities.SPY_PLANE.ready = false;
}

if (aiHasBattleLab) {
  const pt = this.state.p2SpecialAbilities.PARATROOPERS;
  if (pt && !pt.ready && timestamp - pt.lastUsed > pt.cooldown) {
    pt.ready = true;
  }
} else if (this.state.p2SpecialAbilities.PARATROOPERS) {
  this.state.p2SpecialAbilities.PARATROOPERS.ready = false;
}

// AI Usage Logic (only if PLAYER_2 is a bot)
const isP2Bot = this.state.botSlots?.includes('PLAYER_2');
if (isP2Bot) {
  if (this.state.p2SpecialAbilities.NUCLEAR_SILO.ready) {
    // Find player base or cluster of units
    const playerBase = this.state.entities.find(e => e.owner === 'PLAYER' && e.subType === 'CONSTRUCTION_YARD');
    if (playerBase) {
      this.useNuclearStrikeAI(playerBase.position);
    }
  }

  if (this.state.p2SpecialAbilities.IRON_CURTAIN.ready) {
    // Find cluster of AI units near player base
    const aiCombatUnits = this.state.entities.filter(e => e.owner === 'PLAYER_2' && e.type === 'UNIT' && ['TANK', 'RHINO_TANK', 'APOCALYPSE_TANK'].includes(e.subType || ''));
    const targetUnit = aiCombatUnits.find(u => this.aiKnownPlayerBase && Math.hypot(u.position.x - this.aiKnownPlayerBase.x, u.position.y - this.aiKnownPlayerBase.y) < 400);
    if (targetUnit) {
      this.useIronCurtainAI(targetUnit.position);
    }
  }

  if (this.state.p2SpecialAbilities.SPY_PLANE?.ready) {
    // Spy on player base
    const playerBase = this.state.entities.find(e => e.owner === 'PLAYER' && (e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD'));
    if (playerBase) {
      this.useSpyPlaneAI(playerBase.position);
    } else {
      this.useSpyPlaneAI({ x: Math.random() * this.state.map.width * this.state.map.tileSize, y: Math.random() * this.state.map.height * this.state.map.tileSize });
    }
  }

  if (this.state.p2SpecialAbilities.PARATROOPERS?.ready) {
    // Drop paratroopers near player base
    const playerBase = this.state.entities.find(e => e.owner === 'PLAYER' && (e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD'));
    if (playerBase) {
      this.useParatroopersAI({ x: playerBase.position.x + (Math.random() - 0.5) * 400, y: playerBase.position.y + (Math.random() - 0.5) * 400 });
    }
  }
}
}
