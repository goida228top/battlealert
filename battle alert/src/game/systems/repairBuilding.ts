import { GameEngine } from '../GameEngine';

export function repairBuilding(this: GameEngine, building: any): boolean {
  if (building.health < building.maxHealth) {
    building.isRepairing = !building.isRepairing;
    if (building.isRepairing) {
      building.lastRepairTime = performance.now();
    }
    return true;
  }
  building.isRepairing = false;
  return false;
}
