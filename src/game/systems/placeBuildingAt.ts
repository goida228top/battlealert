import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function placeBuildingAt(this: GameEngine, pos: Vector2, type: BuildingType, owner: string, providedEntityId?: string): boolean {
  const tileSize = this.state.map.tileSize;
  const dims = getBuildingDimensions(type);

  // Calculate top-left tile based on provided position
  const tx = Math.floor((pos.x - (dims.w * tileSize) / 2) / tileSize);
  const ty = Math.floor((pos.y - (dims.h * tileSize) / 2) / tileSize);

  // 1. Bounds and Terrain Check
  for (let dy = 0; dy < dims.h; dy++) {
    for (let dx = 0; dx < dims.w; dx++) {
      const curX = tx + dx;
      const curY = ty + dy;

      if (curX < 0 || curX >= this.state.map.width || curY < 0 || curY >= this.state.map.height) {
        return false; // Out of bounds
      }

      const tileType = this.state.map.tiles[curY][curX];
      if (tileType === 'WATER' || tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER' || tileType === 'ORE') {
        return false; // Cannot build on water or ore
      }
    }
  }

  // Calculate snapped center position
  const snappedX = (tx + dims.w / 2) * tileSize;
  const snappedY = (ty + dims.h / 2) * tileSize;
  const snappedPos = { x: snappedX, y: snappedY };

  // 2. Overlap Check
  const margin = 5;
  const bounds = {
    minX: snappedX - (dims.w * tileSize) / 2 + margin,
    maxX: snappedX + (dims.w * tileSize) / 2 - margin,
    minY: snappedY - (dims.h * tileSize) / 2 + margin,
    maxY: snappedY + (dims.h * tileSize) / 2 - margin
  };

  const hasOverlap = this.state.entities.some((e: any) => {
    if (e.type !== 'BUILDING') return false;
    const eDims = getBuildingDimensions(e.subType as BuildingType);
    const eBounds = {
      minX: e.position.x - (eDims.w * tileSize) / 2 + margin,
      maxX: e.position.x + (eDims.w * tileSize) / 2 - margin,
      minY: e.position.y - (eDims.h * tileSize) / 2 + margin,
      maxY: e.position.y + (eDims.h * tileSize) / 2 - margin
    };
    return !(bounds.maxX < eBounds.minX || bounds.minX > eBounds.maxX || bounds.maxY < eBounds.minY || bounds.minY > eBounds.maxY);
  });

  if (hasOverlap && type !== 'SOVIET_WALL' && type !== 'ALLIED_WALL') return false;

  // 3. Proximity Check (Must be near a friendly building)
  const isNearFriendly = this.state.entities.some((e: any) => {
    if (e.type !== 'BUILDING' || e.owner !== owner) return false;
    const dist = Math.hypot(e.position.x - snappedPos.x, e.position.y - snappedPos.y);
    return dist < 800; // Allow 800 distance for placing (so it's not too restrictive)
  });

  if (!isNearFriendly && this.state.entities.some(e => e.type === 'BUILDING' && e.owner === owner)) {
    return false;
  }

  let health = 2000;
  let size = dims.w * tileSize;
  if (type === 'SENTRY_GUN') { health = 800; }
  else if (type === 'FLAK_CANNON') { health = 900; }
  else if (type === 'TESLA_COIL') { health = 1500; }
  else if (type === 'RADAR') { health = 1500; }
  else if (type === 'SERVICE_DEPOT') { health = 1200; }
  else if (type === 'BATTLE_LAB') { health = 3000; }
  else if (type === 'ORE_PURIFIER') { health = 2000; }
  else if (type === 'INDUSTRIAL_PLANT') { health = 2500; }
  else if (type === 'NUCLEAR_REACTOR') { health = 5000; }
  else if (type === 'PSYCHIC_SENSOR') { health = 1000; }
  else if (type === 'CLONING_VATS') { health = 2000; }
  else if (type === 'SPY_SATELLITE') { health = 1500; }
  else if (type === 'IRON_CURTAIN') { health = 5000; }
  else if (type === 'NUCLEAR_SILO') { health = 6000; }
  else if (type === 'NAVAL_YARD') { health = 2000; }
  else if (type === 'SOVIET_WALL') { health = 500; }

  // Allied Buildings
  else if (type === 'ALLIED_CONSTRUCTION_YARD') { health = 2000; }
  else if (type === 'ALLIED_POWER_PLANT') { health = 1000; }
  else if (type === 'ALLIED_BARRACKS') { health = 1000; }
  else if (type === 'ALLIED_ORE_REFINERY') { health = 2000; }
  else if (type === 'ALLIED_WAR_FACTORY') { health = 2000; }
  else if (type === 'AIR_FORCE_COMMAND') { health = 1500; }
  else if (type === 'ALLIED_BATTLE_LAB') { health = 3000; }
  else if (type === 'ALLIED_ORE_PURIFIER') { health = 2000; }
  else if (type === 'ALLIED_NAVAL_YARD') { health = 2000; }
  else if (type === 'ALLIED_WALL') { health = 500; }
  else if (type === 'PILLBOX') { health = 800; }
  else if (type === 'PATRIOT_MISSILE') { health = 900; }
  else if (type === 'PRISM_TOWER') { health = 1500; }
  else if (type === 'GRAND_CANNON') { health = 2000; }
  else if (type === 'GAP_GENERATOR') { health = 1000; }
  else if (type === 'CHRONOSPHERE') { health = 5000; }
  else if (type === 'WEATHER_DEVICE') { health = 6000; }
  else if (type === 'ROBOT_CONTROL_CENTER') { health = 1500; }

  const entityId = providedEntityId || `${type}-${Date.now()}-${Math.random()}`;
  
  const entity: Entity = {
    id: entityId,
    type: 'BUILDING',
    subType: type,
    position: snappedPos,
    health,
    maxHealth: health,
    owner,
    size,
    constructionStartTime: performance.now(),
  };

  // 4. Consume from queue WITHOUT refunding
  const queue = owner === 'PLAYER' ? this.state.productionQueue : 
                owner === 'PLAYER_2' ? (this.state.p2ProductionQueue || []) : 
                owner === 'PLAYER_3' ? (this.state.p3ProductionQueue || []) : 
                (this.state.p4ProductionQueue || []);
  if (queue) {
    const qIndex = queue.findIndex((q: any) => q.subType === type && q.progress >= 100);
    if (qIndex !== -1) {
      queue.splice(qIndex, 1);
    } else if (type !== 'CONSTRUCTION_YARD' && type !== 'ALLIED_CONSTRUCTION_YARD' && !providedEntityId?.includes('debug')) {
      // If none found in queue, and it's not a deployment or debug, abort!
      return false;
    }
  }

  this.state.entities.push(entity);

  if (type === 'ORE_REFINERY') {
    this.produceUnitAt(entity, 'HARVESTER', owner);
  } else if (type === 'ALLIED_ORE_REFINERY') {
    this.produceUnitAt(entity, 'CHRONO_MINER', owner);
  }
  
  return true;
}

