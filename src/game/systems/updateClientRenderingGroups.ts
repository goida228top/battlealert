
import { GameEngine } from '../GameEngine';
import { Entity } from '../types';

export function updateClientRenderingGroups(this: GameEngine): void {
  this.state.visUnits = [];
  this.state.visBuildings = [];
  this.state.visScenery = [];
  
  const visEntities: Entity[] = [];
  const mapTileSize = this.state.map.tileSize;

  this.state.entities.forEach((e: Entity) => {
    if (e.health <= 0) return;
    
    // CRITICAL: ALL ENTITIES ARE ALWAYS VISIBLE REGARDLESS OF FOG/SHROUD.
    // NEVER HIDE ENTITIES BASED ON VISIBILITY AGAIN.
    visEntities.push(e);
    if (e.subType === 'TREE') {
      (this.state as any).visScenery.push(e);
    } else if (e.type === 'BUILDING') {
      (this.state as any).visBuildings.push(e);
    } else {
      (this.state as any).visUnits.push(e);
    }
  });

  (this.state as any).sortedVisEntities = visEntities.sort((a, b) => {
    const ay = (a as any).renderY || a.position.y;
    const by = (b as any).renderY || b.position.y;
    return ay - by;
  });
}
