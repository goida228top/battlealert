import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function updateResources(this: GameEngine, dt: number): void {
  const owners = ['PLAYER', 'PLAYER_2', 'PLAYER_3', 'PLAYER_4'];
  const timestamp = performance.now();

  owners.forEach(owner => {
    let p = 0;
    let c = 0;

    this.state.entities.forEach(e => {
      if (e.owner === owner) {
        if (e.subType === 'POWER_PLANT') p += 100;
        if (e.subType === 'NUCLEAR_REACTOR') p += 2000;
        if (e.subType === 'ALLIED_POWER_PLANT') p += 150;
        
        if (e.subType === 'CONSTRUCTION_YARD' || e.subType === 'ALLIED_CONSTRUCTION_YARD') c += 10;
        if (e.subType === 'ORE_REFINERY' || e.subType === 'ALLIED_ORE_REFINERY') c += 20;
        if (e.subType === 'BARRACKS' || e.subType === 'ALLIED_BARRACKS') c += 15;
        if (e.subType === 'WAR_FACTORY' || e.subType === 'ALLIED_WAR_FACTORY') c += 25;
        if (e.subType === 'RADAR' || e.subType === 'AIR_FORCE_COMMAND') c += 30;
        if (e.subType === 'SERVICE_DEPOT') c += 20;
        if (e.subType === 'BATTLE_LAB' || e.subType === 'ALLIED_BATTLE_LAB') c += 50;
        if (e.subType === 'ORE_PURIFIER' || e.subType === 'ALLIED_ORE_PURIFIER') c += 40;
        if (e.subType === 'INDUSTRIAL_PLANT') c += 40;
        if (e.subType === 'PSYCHIC_SENSOR') c += 20;
        if (e.subType === 'CLONING_VATS') c += 20;
        if (e.subType === 'SENTRY_GUN' || e.subType === 'PILLBOX') c += 10;
        if (e.subType === 'FLAK_CANNON' || e.subType === 'PATRIOT_MISSILE') c += 15;
        if (e.subType === 'TESLA_COIL' || e.subType === 'PRISM_TOWER') c += 50;
        if (e.subType === 'IRON_CURTAIN' || e.subType === 'CHRONOSPHERE') c += 100;
        if (e.subType === 'NUCLEAR_SILO' || e.subType === 'WEATHER_DEVICE') c += 200;
        if (e.subType === 'GAP_GENERATOR') c += 100;

        // Oil Derrick Passive Income
        if (e.subType === 'OIL_DERRICK') {
          if (Math.floor(timestamp / 2000) !== Math.floor((timestamp - dt) / 2000)) {
            if (owner === 'PLAYER') this.state.credits += 20;
            else if (owner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) + 20;
            else if (owner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + 20;
            else if (owner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + 20;
          }
        }
      }
    });

    if (owner === 'PLAYER') {
      this.state.power = p;
      this.state.powerConsumption = c;
    } else {
        // We might want to store power per player later, but currently HUD only shows local power
        if (this.localPlayerId === owner) {
            this.state.power = p;
            this.state.powerConsumption = c;
        }
    }
  });
}
