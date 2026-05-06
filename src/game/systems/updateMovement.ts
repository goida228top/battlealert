import { Entity } from '../types';
import { GameEngine } from '../GameEngine';

export function updateMovement(this: GameEngine, entity: Entity, dt: number) {
    if (entity.type === 'UNIT' && entity.targetPosition && entity.speed && !entity.isDeployed) {
      const dx = entity.targetPosition.x - entity.position.x;
      const dy = entity.targetPosition.y - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > entity.speed! * dt) {
        let nextX = entity.position.x + (dx / distance) * entity.speed! * dt;
        let nextY = entity.position.y + (dy / distance) * entity.speed! * dt;
        
        // Map edges boundaries constraint
        const mapW = this.state.map.width * this.state.map.tileSize;
        const mapH = this.state.map.height * this.state.map.tileSize;
        nextX = Math.max(0, Math.min(nextX, mapW));
        nextY = Math.max(0, Math.min(nextY, mapH));

        // Fast collision check using resolution grid
        const pfTileSize = 20;
        const obstacleGrid = this.state.dynamicObstacleGrid;
        const pScale = this.state.map.tileSize / pfTileSize;
        const pfWidth = this.state.map.width * pScale;
        const pfHeight = this.state.map.height * pScale;

        const gX = Math.floor(nextX / pfTileSize);
        const gY = Math.floor(nextY / pfTileSize);
        
        let collisionBlocked = false;
        if (obstacleGrid && gX >= 0 && gX < pfWidth && gY >= 0 && gY < pfHeight) {
          if (obstacleGrid[gY * pfWidth + gX] === 1) {
             const curGX = Math.floor(entity.position.x / pfTileSize);
             const curGY = Math.floor(entity.position.y / pfTileSize);
             if (!(obstacleGrid[curGY * pfWidth + curGX] === 1)) {
               collisionBlocked = true;
             }
          }
        }

        // Unit-Unit hard prevention (Look ahead)
        if (!collisionBlocked && entity.type === 'UNIT') {
           const units = (this as any).frameCache.allUnits;
           const isHarvester = entity.subType === 'HARVESTER' || entity.subType === 'CHRONO_MINER';
           
           for (let i = 0; i < units.length; i++) {
             const other = units[i];
             if (other.id === entity.id || other.health <= 0 || other.isDeployed) continue;
             
             // Soften block for harvesters of the same owner, so they can slide past each other 
             // via updateSeparation instead of deadlocking.
             const isOtherHarvester = other.subType === 'HARVESTER' || other.subType === 'CHRONO_MINER';
             if (isHarvester && isOtherHarvester && entity.owner === other.owner) continue;

             const odx = nextX - other.position.x;
             const ody = nextY - other.position.y;
             if (Math.abs(odx) > 30 || Math.abs(ody) > 30) continue;
             
             const minDist = (entity.size + other.size) / 2 * 0.82;
             if (odx*odx + ody*ody < minDist*minDist) {
                const curDx = entity.position.x - other.position.x;
                const curDy = entity.position.y - other.position.y;
                // Only block if we are moving CLOSER to the target
                if (odx*odx + ody*ody < curDx*curDx + curDy*curDy) {
                   collisionBlocked = true;
                   break;
                }
             }
           }
        }

        // Terrain collision check
        const ttx = Math.floor(nextX / this.state.map.tileSize);
        const tty = Math.floor(nextY / this.state.map.tileSize);
        let terrainBlocked = false;
        
        if (tty >= 0 && tty < this.state.map.height && ttx >= 0 && ttx < this.state.map.width) {
          const tType = this.state.map.tiles[tty][ttx];
          
          const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(entity.subType || '');
          const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(entity.subType || '');

          if (isNaval) {
             if (tType !== 'WATER') terrainBlocked = true;
          } else if (isAmphibious) {
             // can drive on grass, water
          } else {
             // Block water and cliffs. ORE is walkable for units.
             if (tType === 'WATER' || tType === 'WATER_TO_GRASS' || tType === 'GRASS_TO_WATER') {
                terrainBlocked = true;
             }
          }

          // Check if we are on a bridge. Bridge rules override underlying terrain!
          let onBridge = false;
          let hitsRailing = false;
          
          this.state.map.bridges.forEach((b: any) => {
            const bx = b.x * this.state.map.tileSize;
            const by = b.y * this.state.map.tileSize;
            const bw = b.width * this.state.map.tileSize;
            const bh = b.height * this.state.map.tileSize;
            
            // If the unit's proposed position is inside the bridge rect
            if (nextX >= bx && nextX <= bx + bw && nextY >= by && nextY <= by + bh) {
              onBridge = true;
              const isHorizontal = bw > bh;
              if (isHorizontal) {
                if (nextY < by + bh / 2 - 20 || nextY > by + bh / 2 + 20) hitsRailing = true;
              } else {
                if (nextX < bx + bw / 2 - 20 || nextX > bx + bw / 2 + 20) hitsRailing = true;
              }
            }
          });
          
          // Naval units cannot go ON bridges
          if (onBridge && !isNaval) {
            if (hitsRailing) {
              terrainBlocked = true;
            } else {
              terrainBlocked = false; // Path safe!
            }
          }
        } else {
          terrainBlocked = true; // Stay inside map
        }

        // Fix jitter trapping: if we are ALREADY in an invalid tile, allow movement if it gets us closer to our path node 
        // (to escape being pushed into the river)
        if (terrainBlocked) {
            const curTTX = Math.floor(entity.position.x / this.state.map.tileSize);
            const curTTY = Math.floor(entity.position.y / this.state.map.tileSize);
            if (curTTY >= 0 && curTTY < this.state.map.height && curTTX >= 0 && curTTX < this.state.map.width) {
                const curTType = this.state.map.tiles[curTTY][curTTX];
                
                const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(entity.subType || '');
                const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(entity.subType || '');
      
                let currentlyBlocked = false;
                if (isNaval) {
                   if (curTType !== 'WATER') currentlyBlocked = true;
                } else if (!isAmphibious) {
                   if (curTType === 'WATER' || curTType === 'WATER_TO_GRASS' || curTType === 'GRASS_TO_WATER') {
                      let curOnBridge = false;
                      const mapTileSize = this.state.map.tileSize;
                      this.state.map.bridges.forEach((b: any) => {
                         const bx = b.x * mapTileSize;
                         const by = b.y * mapTileSize;
                         const bw = b.width * mapTileSize;
                         const bh = b.height * mapTileSize;
                         if (entity.position.x >= bx && entity.position.x <= bx + bw && entity.position.y >= by && entity.position.y <= by + bh) {
                            curOnBridge = true;
                         }
                      });
                      if (!curOnBridge) {
                          currentlyBlocked = true;
                      }
                   }
                }
                
                // If they are already in an unwalkable tile, bypass terrain blocking so they can walk OUT of it towards the target
                if (currentlyBlocked) {
                    terrainBlocked = false;
                }
            }
        }

        if (!collisionBlocked && !terrainBlocked) {
          entity.position.x = nextX;
          entity.position.y = nextY;
          entity.stuckTime = 0; // Reset stuck timer on successful move
          if (distance > 2) {
            const targetRotation = Math.atan2(dy, dx);
            let diff = targetRotation - (entity.rotation || 0);
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const rotSpeed = 0.15 * dt;
            if (Math.abs(diff) < rotSpeed) {
              entity.rotation = targetRotation;
            } else {
              entity.rotation = (entity.rotation || 0) + Math.sign(diff) * rotSpeed;
            }
          }
        } else {
          // If blocked, try to "jitter" out
          entity.stuckTime = (entity.stuckTime || 0) + 1;
          
          if (entity.stuckTime > 10) {
            entity.position.x += (Math.random() - 0.5) * 2;
            entity.position.y += (Math.random() - 0.5) * 2;
          }

          if (entity.path && entity.path.length > 0) {
            const now = performance.now();
            if ((entity.stuckTime > 30) || !entity.lastRepath || now - entity.lastRepath > 2000) {
              const finalDest = entity.path[entity.path.length - 1];
              entity.path = this.calculatePath(entity.position, finalDest, entity);
              entity.targetPosition = entity.path[0];
              entity.lastRepath = now;
              entity.stuckTime = 0;
            }
          } else {
            entity.targetPosition = undefined;
            entity.path = undefined;
          }
        }
      } else {
        entity.position.x = entity.targetPosition.x;
        entity.position.y = entity.targetPosition.y;
        
        if (entity.path && entity.path.length > 1) {
          entity.path.shift();
          entity.targetPosition = entity.path[0];
        } else {
          entity.targetPosition = undefined;
          entity.path = undefined;
        }
      }
    }
}
