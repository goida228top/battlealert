import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function placeBuildingAt(this: GameEngine, pos: Vector2, type: BuildingType, owner: string, providedEntityId?: string): boolean {
  const tileSize = this.state.map.tileSize;
  const dims = getBuildingDimensions(type);

  // Determine effective tile size (the "step") based on terrain at target position
  const baseTx = Math.floor(pos.x / tileSize);
  const baseTy = Math.floor(pos.y / tileSize);
  const isOverMountain = this.state.map.tiles[baseTy]?.[baseTx] === 'MOUNTAIN_GRASS';
  const effectiveTileSize = isOverMountain ? tileSize * 1.2 : tileSize;

  // Calculate top-left tile based on provided position using the scaled step
  const tx = Math.floor((pos.x - (dims.w * effectiveTileSize) / 2) / effectiveTileSize);
  const ty = Math.floor((pos.y - (dims.h * effectiveTileSize) / 2) / effectiveTileSize);

  // Determine the bounding box in raw tile coordinates
  const startTileX = Math.floor((tx * effectiveTileSize) / tileSize);
  const endTileX = Math.floor(((tx + dims.w) * effectiveTileSize - 1) / tileSize);
  const startTileY = Math.floor((ty * effectiveTileSize) / tileSize);
  const endTileY = Math.floor(((ty + dims.h) * effectiveTileSize - 1) / tileSize);

  // 1. Bounds and Terrain Check
  let baseElevation: 'GROUND' | 'PLATEAU' | 'MOUNTAIN_PLATEAU' | null = null;
  
  for (let ry = startTileY; ry <= endTileY; ry++) {
    for (let rx = startTileX; rx <= endTileX; rx++) {
      if (rx < 0 || rx >= this.state.map.width || ry < 0 || ry >= this.state.map.height) {
        return false; // Out of bounds
      }

      const tileType = this.state.map.tiles[ry][rx];
      const visibility = this.state.map.visibility[ry][rx];
      
      const isFoggy = !this.state.debugFlags?.disableFog && visibility === 0;
      const isNavalYard = type === 'NAVAL_YARD' || type === 'ALLIED_NAVAL_YARD';
      
      // Block impossible terrain
      let isInvalidTerrain = false;
      
      if (isNavalYard) {
          if (tileType !== 'WATER' && tileType !== 'WATER_TO_GRASS' && tileType !== 'GRASS_TO_WATER') {
              isInvalidTerrain = true;
          }
      } else {
          if (tileType === 'WATER' || tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER' || tileType === 'ORE' || tileType.startsWith('CLIFF') || tileType.startsWith('RAMP_') || tileType === 'DEBUG_RED' || tileType === 'MOUNTAIN_DECOR') {
              isInvalidTerrain = true;
          }
      }

      if (isInvalidTerrain || isFoggy) {
        return false; 
      }

      // Block bridges
      const onBridge = this.state.map.bridges.some((b: any) => {
        return rx >= b.x && rx < b.x + b.width && ry >= b.y && ry < b.y + b.height;
      });
      if (onBridge) return false;

      // Check elevation consistency
      const curElevation = (tileType === 'MOUNTAIN_GRASS') ? 'MOUNTAIN_PLATEAU' : ((tileType === 'ELEVATED_GRASS') ? 'PLATEAU' : 'GROUND');
      if (baseElevation === null) {
        baseElevation = curElevation;
      } else if (baseElevation !== curElevation) {
        return false; // Building must be on uniform terrain level
      }
    }
  }

  // Calculate snapped center position using the scaled step
  const snappedX = (tx + dims.w / 2) * effectiveTileSize;
  const snappedY = (ty + dims.h / 2) * effectiveTileSize;
  const snappedPos = { x: snappedX, y: snappedY };

  // 2. Overlap Check
  const margin = 5;
  const bounds = {
    minX: snappedX - (dims.w * effectiveTileSize) / 2 + margin,
    maxX: snappedX + (dims.w * effectiveTileSize) / 2 - margin,
    minY: snappedY - (dims.h * effectiveTileSize) / 2 + margin,
    maxY: snappedY + (dims.h * effectiveTileSize) / 2 - margin
  };

  const hasOverlap = this.state.entities.some((e: any) => {
    if (e.type !== 'BUILDING') return false;
    const eDims = getBuildingDimensions(e.subType as BuildingType);
    
    // We need to know the effective tile size of the EXISTING building to check overlap correctly
    const eBaseTx = Math.floor(e.position.x / tileSize);
    const eBaseTy = Math.floor(e.position.y / tileSize);
    const eIsOverMountain = this.state.map.tiles[eBaseTy]?.[eBaseTx] === 'MOUNTAIN_GRASS';
    const eEffectiveTileSize = eIsOverMountain ? tileSize * 1.2 : tileSize;

    const eBounds = {
      minX: e.position.x - (eDims.w * eEffectiveTileSize) / 2 + margin,
      maxX: e.position.x + (eDims.w * eEffectiveTileSize) / 2 - margin,
      minY: e.position.y - (eDims.h * eEffectiveTileSize) / 2 + margin,
      maxY: e.position.y + (eDims.h * eEffectiveTileSize) / 2 - margin
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

