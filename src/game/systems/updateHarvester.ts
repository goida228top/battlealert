import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function updateHarvester(this: GameEngine, harvester: Entity, dt: number): void {
if (harvester.harvestState === 'MOVING') {
  if (!harvester.path || harvester.path.length === 0) {
    if (!harvester.targetPosition) {
      // Reached explicitly assigned location
      harvester.harvestState = 'IDLE';
    }
  }
  return; // Don't process other states if explicitly moving
}

if (harvester.harvestState === 'IDLE' || !harvester.harvestState) {
  if (harvester.isRepairing) return; // Wait until repaired
  if ((harvester.harvestAmount || 0) >= 500) {
    harvester.harvestState = 'RETURNING';
  } else {
    harvester.harvestState = 'MOVING_TO_ORE';
  }
}

if (harvester.harvestState === 'MOVING_TO_ORE') {
  // Find nearest ORE tile - Throttle this search
  const now = performance.now();
  if (harvester.lastOreSearch && now - harvester.lastOreSearch < 2000) {
     // Wait, already searched recently
  } else {
    harvester.lastOreSearch = now;
    let nearestOre: Vector2 | null = null;
    let minDist = Infinity;
    
    // Use pre-calculated harvester targets from frameCache
    const otherHarvesterTargets = (this as any).frameCache?.harvesterTargets || [];
    
    // Optimized search using pre-calculated ore positions
    const oreTiles = this.state.map.oreTiles || [];
    
    for (const orePos of oreTiles) {
      const dx = harvester.position.x - orePos.x;
      const dy = harvester.position.y - orePos.y;
      let d2 = dx * dx + dy * dy;
      
      // Add penalty if another harvester is already heading to this exact spot
      for (const target of otherHarvesterTargets) {
          const tx = target.x - orePos.x;
          const ty = target.y - orePos.y;
          if (tx * tx + ty * ty < 1600) { // 40 squared = 1600
              d2 += 100000;
              break; 
          }
      }

      if (d2 < minDist) {
        minDist = d2;
        nearestOre = orePos;
      }
    }

    if (nearestOre) {
      minDist = Math.sqrt(minDist);
      // Only recalculate path if we don't have one or if it's empty
      if (!harvester.path || harvester.path.length === 0) {
        harvester.path = this.calculatePath(harvester.position, nearestOre, harvester);
        harvester.targetPosition = harvester.path[0];
      }
      
      if (minDist < 35) {
        harvester.harvestState = 'MINING';
        harvester.targetPosition = undefined;
        harvester.path = undefined;
      }
    } else {
      harvester.harvestState = 'IDLE';
    }
  }
}

  if (harvester.harvestState === 'MINING') {
    const tx = Math.floor(harvester.position.x / this.state.map.tileSize);
    const ty = Math.floor(harvester.position.y / this.state.map.tileSize);
    
    // Check current and neighbors for ORE
    let foundOre = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = tx + dx;
        const cy = ty + dy;
        if (this.state.map.tiles[cy] && this.state.map.tiles[cy][cx] === 'ORE') {
          // Verify distance to the ORE tile center
          const worldX = cx * this.state.map.tileSize + 20;
          const worldY = cy * this.state.map.tileSize + 20;
          const d = Math.hypot(harvester.position.x - worldX, harvester.position.y - worldY);
          if (d < 40) { // Same threshold as search radius
             foundOre = true;
             break;
          }
        }
      }
      if (foundOre) break;
    }

    if (!foundOre) {
       harvester.harvestState = 'MOVING_TO_ORE'; // Target is gone or too far, look for next
       return;
    }
  // Slower mining: normalized to dt
  harvester.harvestAmount = (harvester.harvestAmount || 0) + 0.4 * dt; // Increased from 0.2 to 0.4
  
  // Visual effect for mining
  if (Math.random() < 0.1) {
    this.state.effects.push({
      id: `mine-${Date.now()}-${Math.random()}`,
      type: 'EXPLOSION',
      position: { x: harvester.position.x + (Math.random() - 0.5) * 20, y: harvester.position.y + (Math.random() - 0.5) * 20 },
      startTime: performance.now(),
      duration: 300,
      color: '#fbbf24'
    });
  }

  if (harvester.harvestAmount >= 500) {
    // Deplete the nearest ORE tile
    const tx = Math.floor(harvester.position.x / this.state.map.tileSize);
    const ty = Math.floor(harvester.position.y / this.state.map.tileSize);
    let nearestTile: {x: number, y: number} | null = null;
    let minDist = Infinity;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = tx + dx;
        const cy = ty + dy;
        if (this.state.map.tiles[cy] && this.state.map.tiles[cy][cx] === 'ORE') {
          const worldX = cx * this.state.map.tileSize + 20;
          const worldY = cy * this.state.map.tileSize + 20;
          const d = Math.hypot(harvester.position.x - worldX, harvester.position.y - worldY);
          if (d < minDist) {
            minDist = d;
            nearestTile = { x: cx, y: cy };
          }
        }
      }
    }

    if (nearestTile) {
      this.state.map.tiles[nearestTile.y][nearestTile.x] = 'GRASS';
      this.state.map.generation = (this.state.map.generation || 0) + 1;
      
      // Update oreTiles optimization list
      if (this.state.map.oreTiles) {
        const worldX = nearestTile.x * this.state.map.tileSize + 20;
        const worldY = nearestTile.y * this.state.map.tileSize + 20;
        this.state.map.oreTiles = this.state.map.oreTiles.filter((p: Vector2) => 
          Math.abs(p.x - worldX) > 1 || Math.abs(p.y - worldY) > 1
        );
      }
    }
    harvester.harvestState = 'RETURNING';
  }
}

if (harvester.harvestState === 'RETURNING') {
  const refineries = this.state.entities.filter(e => (e.subType === 'ORE_REFINERY' || e.subType === 'ALLIED_ORE_REFINERY') && e.owner === harvester.owner && e.health > 0);
  let nearestRefinery: Entity | null = null;
  let minDist = Infinity;
  
  refineries.forEach(r => {
    const d = Math.hypot(r.position.x - harvester.position.x, r.position.y - harvester.position.y);
    if (d < minDist) {
      minDist = d;
      nearestRefinery = r;
    }
  });

  if (nearestRefinery) {
    if (harvester.subType === 'CHRONO_MINER') {
      // Teleport to refinery
      this.state.effects.push({
        id: `chrono-out-${Date.now()}-${Math.random()}`,
        type: 'MIND_CONTROL', // Reuse visual effect
        position: { ...harvester.position },
        startTime: performance.now(),
        duration: 500,
        color: '#a855f7',
      });
      harvester.position = { x: nearestRefinery.position.x, y: nearestRefinery.position.y + 40 };
      this.state.effects.push({
        id: `chrono-in-${Date.now()}-${Math.random()}`,
        type: 'MIND_CONTROL',
        position: { ...harvester.position },
        startTime: performance.now(),
        duration: 500,
        color: '#a855f7',
      });
      
      harvester.harvestState = 'WAITING_IN_QUEUE';
      harvester.targetId = nearestRefinery.id;
      harvester.targetPosition = undefined;
      harvester.path = undefined;
    } else {
      // Offset position for unloading target
      const targetUnloadPos = { x: nearestRefinery.position.x, y: nearestRefinery.position.y + 40 };
      // Only recalculate path if we don't have one
      if (!harvester.path || harvester.path.length === 0) {
        harvester.path = this.calculatePath(harvester.position, targetUnloadPos, harvester);
        harvester.targetPosition = harvester.path[0];
      }
      
      const dist = Math.hypot(harvester.position.x - targetUnloadPos.x, harvester.position.y - targetUnloadPos.y);
      if (dist < 40) { // Require them to get close enough
        harvester.harvestState = 'WAITING_IN_QUEUE';
        harvester.targetId = nearestRefinery.id;
        harvester.targetPosition = undefined;
        harvester.path = undefined;
      }
    }
  } else {
    harvester.harvestState = 'IDLE';
    harvester.targetPosition = undefined;
    harvester.path = undefined;
  }
}

if (harvester.harvestState === 'WAITING_IN_QUEUE') {
  const refinery = this.state.entityMap?.get(harvester.targetId);
  if (!refinery || refinery.health <= 0) {
    harvester.harvestState = 'RETURNING'; // Find another refinery
    harvester.targetId = undefined;
  } else {
    if (!refinery.occupiedBy || refinery.occupiedBy === harvester.id) {
      refinery.occupiedBy = harvester.id;
      harvester.harvestState = 'UNLOADING';
      harvester.unloadStartTime = performance.now();
      // Move to a visually appropriate unloading position outside the refinery center
      // harvester.position = { x: refinery.position.x, y: refinery.position.y + 35 };
    } else {
      // Just chilling near the refinery in the queue - handled by separation logic
    }
  }
}

if (harvester.harvestState === 'UNLOADING') {
  const refinery = this.state.entityMap?.get(harvester.targetId);
  if (!refinery || refinery.health <= 0) {
    harvester.harvestState = 'RETURNING';
    harvester.targetId = undefined;
  } else {
    // Show unloading text indicator occasionally
    if (Math.random() < 0.1) {
       this.state.effects.push({
         id: `unload-${Date.now()}-${Math.random()}`,
         type: 'MONEY_FLOAT',
         position: { x: harvester.position.x + (Math.random() - 0.5) * 10, y: harvester.position.y - 10 },
         startTime: performance.now(),
         duration: 600,
         text: `$`,
         color: '#fbbf24'
       });
    }

    // Unload takes 4 seconds
    if (performance.now() - (harvester.unloadStartTime || 0) > 4000) {
      const hasPurifier = this.state.entities.some(e => (e.subType === 'ORE_PURIFIER' || e.subType === 'ALLIED_ORE_PURIFIER') && e.owner === harvester.owner && e.health > 0);
      const income = 500 + (hasPurifier ? 125 : 0); // Fixed 500 per trip
      
      if (harvester.owner === 'PLAYER') {
        this.state.credits += income;
      } else if (harvester.owner === 'PLAYER_2') {
        this.state.p2Credits = (this.state.p2Credits || 0) + income;
      } else if (harvester.owner === 'PLAYER_3') {
        this.state.p3Credits = (this.state.p3Credits || 0) + income;
      } else if (harvester.owner === 'PLAYER_4') {
        this.state.p4Credits = (this.state.p4Credits || 0) + income;
      }
      
      if (harvester.owner === this.localPlayerId) {
        this.state.effects.push({
          id: `money-${Date.now()}-${Math.random()}`,
          type: 'MONEY_FLOAT',
          position: { x: refinery.position.x, y: refinery.position.y - 20 },
          startTime: performance.now(),
          duration: 1500,
          text: `+$${income}`
        });
      }
      harvester.harvestAmount = 0;
      harvester.harvestState = 'MOVING_TO_ORE';
      harvester.targetId = undefined;
      refinery.occupiedBy = null;
      
      // Move slightly out of the refinery to avoid being stuck in its collision box
      const dims = getBuildingDimensions(refinery.subType as any);
      const mapTileSize = this.state.map.tileSize;
      const cx = Math.floor(refinery.position.x / mapTileSize);
      const cy = Math.floor(refinery.position.y / mapTileSize);
      const isOverMountain = this.state.map.tiles[cy]?.[cx] === 'MOUNTAIN_GRASS';
      const effectiveTileSize = isOverMountain ? mapTileSize * 1.2 : mapTileSize;
      
      // Move to the bottom of the refinery + some offset to prevent getting stuck
      harvester.position.y = refinery.position.y + (dims.h * effectiveTileSize) / 2 + 35;
      harvester.position.x += (Math.random() - 0.5) * 60;
    }
  }
}
}
