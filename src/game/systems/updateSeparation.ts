import { Entity } from '../types';
import { GameEngine } from '../GameEngine';

export function updateSeparation(this: GameEngine, entity: Entity, dt: number) {
    let sepX = 0;
    let sepY = 0;
    let overlapCount = 0;
    
    // Using frameCache populated in update.ts
    const units = (this as any).frameCache.allUnits;
    for (let i = 0; i < units.length; i++) {
        const other = units[i];
        if (other.id !== entity.id && other.health > 0 && !other.isDeployed) {
            const odx = entity.position.x - other.position.x;
            if (Math.abs(odx) > 35) continue;
            const ody = entity.position.y - other.position.y;
            if (Math.abs(ody) > 35) continue;

            const odistSq = odx * odx + ody * ody;
            const minSpace = (entity.size + other.size) / 2 * 0.95;
            if (odistSq < minSpace * minSpace && odistSq > 0.01) {
            const odist = Math.sqrt(odistSq);
            sepX += (odx / odist) * (minSpace - odist);
            sepY += (ody / odist) * (minSpace - odist);
            overlapCount++;
            }
        }
    }
    
    if (overlapCount > 0) {
        let nx = entity.position.x + (sepX / overlapCount) * 0.2 * dt * 2;
        let ny = entity.position.y + (sepY / overlapCount) * 0.2 * dt * 2;
        
        // Push out from buildings if stuck inside
        const obstacleGrid = this.state.dynamicObstacleGrid;
        const pfTileSize = 20;
        const pScale = this.state.map.tileSize / pfTileSize;
        const pfWidth = this.state.map.width * pScale;

        if (obstacleGrid) {
            const gX = Math.floor(entity.position.x / pfTileSize);
            const gY = Math.floor(entity.position.y / pfTileSize);
            if (gX >= 0 && gX < pfWidth && gY >= 0 && gY < this.state.map.height * pScale) {
                if (obstacleGrid[gY * pfWidth + gX] === 1) {
                    // We are inside a building! Aggressively push away from building logic might be complex, 
                    // but for now, the pathfinder re-pathing will eventually help. 
                    // Let's at least allow jitter.
                }
            }
        }

        // Basic terrain and obstacle check for separation push
        const ttx = Math.floor(nx / this.state.map.tileSize);
        const tty = Math.floor(ny / this.state.map.tileSize);
        let canPush = true;
        
        if (tty >= 0 && tty < this.state.map.height && ttx >= 0 && ttx < this.state.map.width) {
          const tType = this.state.map.tiles[tty][ttx];
          
          const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(entity.subType || '');
          const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(entity.subType || '');

          if (isNaval) {
             if (tType !== 'WATER') canPush = false;
          } else if (isAmphibious) {
             // can be pushed onto anything but mountains really, but let's say mostly true
          } else {
             // regular ground unit
             if (tType === 'WATER' || tType === 'WATER_TO_GRASS' || tType === 'GRASS_TO_WATER') canPush = false;
          }
          
          if (obstacleGrid) {
            const ogX = Math.floor(nx / pfTileSize);
            const ogY = Math.floor(ny / pfTileSize);
            if (ogX >= 0 && ogX < pfWidth && ogY >= 0 && ogY < this.state.map.height * pScale) {
              if (obstacleGrid[ogY * pfWidth + ogX] === 1) {
                // Check if we are already in an obstacle
                const curGX = Math.floor(entity.position.x / pfTileSize);
                const curGY = Math.floor(entity.position.y / pfTileSize);
                if (!(obstacleGrid[curGY * pfWidth + curGX] === 1)) {
                  canPush = false;
                }
              }
            }
          }
        }
        
        if (canPush) {
          entity.position.x = nx;
          entity.position.y = ny;
        }
    }
}
