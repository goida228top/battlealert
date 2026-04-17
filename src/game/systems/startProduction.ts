
import { UnitType, BuildingType } from '../types';

export function startProduction(this: any, subType: UnitType | BuildingType, owner: string = 'PLAYER') {
  if (this.role === 'CLIENT' && owner === this.localPlayerId) {
      this.socket.emit('client_command', {
          roomId: this.roomId,
          command: { type: 'START_PRODUCTION', subType, owner: this.localPlayerId }
      });
      return;
  }

  const category = this.getCategory(subType);
  const queue = owner === 'PLAYER' ? this.state.productionQueue : 
                owner === 'AI' ? this.state.aiProductionQueue : 
                owner === 'PLAYER_3' ? (this.state.p3ProductionQueue = this.state.p3ProductionQueue || []) : 
                (this.state.p4ProductionQueue = this.state.p4ProductionQueue || []);
                
  const credits = owner === 'PLAYER' ? this.state.credits : 
                  owner === 'AI' ? this.state.aiCredits : 
                  owner === 'PLAYER_3' ? (this.state.p3Credits = this.state.p3Credits || 10000) : 
                  (this.state.p4Credits = this.state.p4Credits || 10000);
  
  const queuedCount = queue.filter((q: any) => this.getCategory(q.subType) === category).length;
  
  if ((category === 'BUILDINGS' || category === 'DEFENSE') && queuedCount >= 1) {
    return; // Only 1 building queued at a time
  }
  if (queuedCount >= 15) {
    return; // Max 15 units in queue per category
  }

  const isVehicle = ['TANK', 'RHINO_TANK', 'FLAK_TRACK', 'V3_LAUNCHER', 'TERROR_DRONE', 'APOCALYPSE_TANK', 'HARVESTER', 'MCV', 'KIROV_AIRSHIP', 'TESLA_TANK', 'SIEGE_CHOPPER', 'CHRONO_MINER', 'GRIZZLY_TANK', 'IFV', 'MIRAGE_TANK', 'PRISM_TANK', 'ROBOT_TANK', 'BATTLE_FORTRESS'].includes(subType);
  const hasIndustrialPlant = this.state.entities.some((e: any) => e.owner === owner && e.subType === 'INDUSTRIAL_PLANT');

  let cost = this.getCost(subType);
  let time = this.getBuildTime(subType);

  if (isVehicle && hasIndustrialPlant) {
    time *= 0.75;
  }

  if (credits >= cost && this.isUnlocked(subType, owner)) {
    if (owner === 'PLAYER') {
      this.state.credits -= cost;
    } else if (owner === 'AI') {
      this.state.aiCredits -= cost;
    } else if (owner === 'PLAYER_3') {
      this.state.p3Credits! -= cost;
    } else if (owner === 'PLAYER_4') {
      this.state.p4Credits! -= cost;
    }
    
    queue.push({
      id: `${subType}-${Date.now()}-${Math.random()}`,
      subType,
      progress: 0,
      cost,
      time,
      startTime: 0,
      owner,
    });
  }
}

