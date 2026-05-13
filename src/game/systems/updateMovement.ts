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

        // Fast collision helper
        const pfTileSize = 20;
        const obstacleGrid = this.state.dynamicObstacleGrid;
        const pScale = this.state.map.tileSize / pfTileSize;
        const pfWidth = this.state.map.width * pScale;
        const pfHeight = this.state.map.height * pScale;
        
        // Slightly smaller hitbox to allow slipping between trees smoothly
        const collisionSize = (entity.size || 20) * 0.4;
        const halfSize = collisionSize / 2;

        const checkCollision = (nx: number, ny: number) => {
            let collisionBlocked = false;
            let terrainBlocked = false;
            let friendBlocked = false;

            const pts = [
                { x: nx, y: ny }, // Center
                { x: nx - halfSize, y: ny - halfSize }, // TL
                { x: nx + halfSize, y: ny - halfSize }, // TR
                { x: nx - halfSize, y: ny + halfSize }, // BL
                { x: nx + halfSize, y: ny + halfSize }  // BR
            ];
            
            const curPts = [
                { x: entity.position.x, y: entity.position.y },
                { x: entity.position.x - halfSize, y: entity.position.y - halfSize },
                { x: entity.position.x + halfSize, y: entity.position.y - halfSize },
                { x: entity.position.x - halfSize, y: entity.position.y + halfSize },
                { x: entity.position.x + halfSize, y: entity.position.y + halfSize }
            ];
            
            if (obstacleGrid) {
                for (let i = 0; i < pts.length; i++) {
                    const pt = pts[i];
                    const gX = Math.floor(pt.x / pfTileSize);
                    const gY = Math.floor(pt.y / pfTileSize);
                    if (gX >= 0 && gX < pfWidth && gY >= 0 && gY < pfHeight) {
                        if (obstacleGrid[gY * pfWidth + gX] === 1) {
                            const curPt = curPts[i];
                            const curPtGX = Math.floor(curPt.x / pfTileSize);
                            const curPtGY = Math.floor(curPt.y / pfTileSize);
                            
                            // Block only if the point is entering a NEW obstacle tile
                            if (curPtGX !== gX || curPtGY !== gY) {
                                collisionBlocked = true;
                                break;
                            }
                        }
                    }
                }
            }

            // Diagonal gap prevention
            if (!collisionBlocked && obstacleGrid) {
                const curGX = Math.floor(entity.position.x / pfTileSize);
                const curGY = Math.floor(entity.position.y / pfTileSize);
                const nextGX = Math.floor(nx / pfTileSize);
                const nextGY = Math.floor(ny / pfTileSize);
                
                if (curGX !== nextGX && curGY !== nextGY) {
                    const neighborA_Blocked = obstacleGrid[curGY * pfWidth + nextGX] === 1;
                    const neighborB_Blocked = obstacleGrid[nextGY * pfWidth + curGX] === 1;
                    if (neighborA_Blocked && neighborB_Blocked) {
                        collisionBlocked = true;
                    }
                }
            }

            // Unit-Unit hard prevention
            if (!collisionBlocked && entity.type === 'UNIT') {
               const units = (this as any).frameCache.allUnits;
               const isHarvester = entity.subType === 'HARVESTER' || entity.subType === 'CHRONO_MINER';
               
               for (let i = 0; i < units.length; i++) {
                 const other = units[i];
                 if (other.id === entity.id || other.health <= 0 || other.isDeployed) continue;
                 
                 const isOtherHarvester = other.subType === 'HARVESTER' || other.subType === 'CHRONO_MINER';
                 if (isHarvester && isOtherHarvester && entity.owner === other.owner) continue;

                 const odx = nx - other.position.x;
                 const ody = ny - other.position.y;
                 if (Math.abs(odx) > 40 || Math.abs(ody) > 40) continue;
                 
                 const minDist = (entity.size + other.size) / 2 * 0.7;
                 if (odx*odx + ody*ody < minDist*minDist) {
                    const curDx = entity.position.x - other.position.x;
                    const curDy = entity.position.y - other.position.y;
                    if (odx*odx + ody*ody < curDx*curDx + curDy*curDy) {
                       collisionBlocked = true;
                       friendBlocked = true;
                       break;
                    }
                 }
               }
            }

            // Terrain collision
            const ttx = Math.floor(nx / this.state.map.tileSize);
            const tty = Math.floor(ny / this.state.map.tileSize);
            
            if (tty >= 0 && tty < this.state.map.height && ttx >= 0 && ttx < this.state.map.width) {
              const tType = this.state.map.tiles[tty][ttx];
              const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(entity.subType || '');
              const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(entity.subType || '');

              if (isNaval) {
                 if (tType !== 'WATER') terrainBlocked = true;
              } else if (!isAmphibious) {
                 const isWaterTile = tType === 'WATER' || tType === 'WATER_TO_GRASS' || tType === 'GRASS_TO_WATER';
                 const isCliffTile = tType.startsWith('CLIFF_');
                 if (isWaterTile || isCliffTile) terrainBlocked = true;
              }

              let onBridge = false;
              let hitsRailing = false;
              this.state.map.bridges.forEach((b: any) => {
                const bx = b.x * this.state.map.tileSize;
                const by = b.y * this.state.map.tileSize;
                const bw = b.width * this.state.map.tileSize;
                const bh = b.height * this.state.map.tileSize;
                if (nx >= bx && nx <= bx + bw && ny >= by && ny <= by + bh) {
                  onBridge = true;
                  const isHorizontal = bw > bh;
                  if (isHorizontal) {
                    if (ny < by + bh / 2 - 20 || ny > by + bh / 2 + 20) hitsRailing = true;
                  } else {
                    if (nx < bx + bw / 2 - 20 || nx > bx + bw / 2 + 20) hitsRailing = true;
                  }
                }
              });
              
              if (onBridge && !isNaval) {
                if (hitsRailing) terrainBlocked = true;
                else terrainBlocked = false;
              }
            } else {
              terrainBlocked = true;
            }

            // Un-trap logic
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
                       const isWaterTile = curTType === 'WATER' || curTType === 'WATER_TO_GRASS' || curTType === 'GRASS_TO_WATER';
                       const isCliffTile = curTType.startsWith('CLIFF_');
                       if (isWaterTile || isCliffTile) {
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
                          if (!curOnBridge) currentlyBlocked = true;
                       }
                    }
                    
                    if (currentlyBlocked) terrainBlocked = false;
                }
            }

            return { collisionBlocked, terrainBlocked, friendBlocked };
        };

        let { collisionBlocked, terrainBlocked, friendBlocked } = checkCollision(nextX, nextY);

        // Sliding logic to slip between trees and around corners perfectly
        if (collisionBlocked || terrainBlocked) {
            let blockedX = checkCollision(nextX, entity.position.y);
            let blockedY = checkCollision(entity.position.x, nextY);
            
            if (!blockedX.collisionBlocked && !blockedX.terrainBlocked && (blockedY.collisionBlocked || blockedY.terrainBlocked)) {
                // Slide horizontally
                nextY = entity.position.y;
                collisionBlocked = false;
                terrainBlocked = false;
                friendBlocked = blockedX.friendBlocked;
            } else if (!blockedY.collisionBlocked && !blockedY.terrainBlocked && (blockedX.collisionBlocked || blockedX.terrainBlocked)) {
                // Slide vertically
                nextX = entity.position.x;
                collisionBlocked = false;
                terrainBlocked = false;
                friendBlocked = blockedY.friendBlocked;
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
          // If blocked, try to resolve it
          entity.stuckTime = (entity.stuckTime || 0) + 1;
          
          let finalDest = entity.targetPosition;
          if (entity.path && entity.path.length > 0) {
              finalDest = entity.path[entity.path.length - 1];
          }
          
          let distToFinal = 9999;
          if (finalDest) {
             const fdx = finalDest.x - entity.position.x;
             const fdy = finalDest.y - entity.position.y;
             distToFinal = Math.sqrt(fdx*fdx + fdy*fdy);
          }
          
          const isHarvester = entity.subType === 'HARVESTER' || entity.subType === 'CHRONO_MINER';
          
          // Fast formation stop: if close to destination and blocked by friends, just stop
          if (friendBlocked && !isHarvester && entity.stuckTime > 5 && distToFinal < 80) {
              entity.targetPosition = undefined;
              entity.path = undefined;
              entity.stuckTime = 0;
              entity.isAttackMoving = false;
          } else {
             if (entity.path && entity.path.length > 0) {
               const now = performance.now();
               const timeSinceLastRepath = now - (entity.lastRepath || 0);
               
               // Throttled repath: don't repath furiously every frame if blocked.
               // - If stuck and 1.5 seconds have passed
               // - Or normally every 4 seconds to adjust for dynamic obstacles
               if ((entity.stuckTime > 30 && timeSinceLastRepath > 1500) || timeSinceLastRepath > 4000) {
                 const finalPosition = entity.path[entity.path.length - 1];
                 entity.path = this.calculatePath(entity.position, finalPosition, entity);
                 if (entity.path && entity.path.length > 0) {
                     entity.targetPosition = entity.path[0];
                 }
                 entity.lastRepath = now;
                 entity.stuckTime = 0;
               }
             } else {
               if (entity.stuckTime > 30) {
                   entity.targetPosition = undefined;
                   entity.path = undefined;
                   entity.stuckTime = 0;
               }
             }
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
