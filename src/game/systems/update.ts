
import { Entity, BuildingType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';
import { updateOreRegen } from './updateOreRegen';

export function update(this: any, timestamp: number) {
  if (this.lastUpdate === 0) {
      this.lastUpdate = timestamp;
      return;
  }
  let dt = (timestamp - this.lastUpdate) / 16.67; // normalize to ~60fps
  this.lastUpdate = timestamp;

  dt = Math.min(dt, 20.0); // Increased cap to allow better catch-up during lag
  this.frameCounter++;

  if (this.role === 'CLIENT' && !this.state.botSlots?.length) {
      // Плавная интерполяция серверных позиций на клиенте
      this.state.entities.forEach((entity: Entity) => {
          const sePos = (entity as any).serverPosition;
          if (sePos) {
              const dx = sePos.x - entity.position.x;
              const dy = sePos.y - entity.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 150) {
                  entity.position.x = sePos.x;
                  entity.position.y = sePos.y;
              } else if (dist > 0.1) {
                  // Плавное дотягивание
                  entity.position.x += dx * 0.15 * dt;
                  entity.position.y += dy * 0.15 * dt;
              }
          }

          // Локальное движение для мгновенного отклика
          if (entity.type === 'UNIT' && entity.targetPosition && entity.speed && !entity.isDeployed && entity.owner === this.localPlayerId) {
              const dx = entity.targetPosition.x - entity.position.x;
              const dy = entity.targetPosition.y - entity.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 1) {
                  let nx = entity.position.x + (dx / distance) * entity.speed * dt;
                  let ny = entity.position.y + (dy / distance) * entity.speed * dt;
                  
                  // Проверка сетки препятствий И террейна на клиенте
                  const pfTileSize = 20;
                  const obstacleGrid = this.state.dynamicObstacleGrid;
                  let clientBlocked = false;
                  
                  if (obstacleGrid) {
                    const pScale = this.state.map.tileSize / pfTileSize;
                    const pfWidth = this.state.map.width * pScale;
                    const gX = Math.floor(nx / pfTileSize);
                    const gY = Math.floor(ny / pfTileSize);
                    if (obstacleGrid[gY * pfWidth + gX] === 1) {
                        clientBlocked = true;
                    }
                  }

                  if (!clientBlocked) {
                    const ttx = Math.floor(nx / this.state.map.tileSize);
                    const tty = Math.floor(ny / this.state.map.tileSize);
                    if (tty >= 0 && tty < this.state.map.height && ttx >= 0 && ttx < this.state.map.width) {
                      const tType = this.state.map.tiles[tty][ttx];
                      if (tType === 'WATER' || tType === 'WATER_TO_GRASS' || tType === 'GRASS_TO_WATER') {
                        clientBlocked = true;
                      }
                    }
                  }

          if (!clientBlocked) {
                    entity.position.x = nx;
                    entity.position.y = ny;
                  }
              }
          }

          // CRITICAL: Ensure rendering data is updated for CLIENT too
          const zOffset = this.getZOffset(entity.position);
          (entity as any).zOffset = zOffset;
          (entity as any).renderY = entity.position.y + zOffset;
      });

      this.updateEffects(dt);
      this.updateProjectiles(dt, timestamp);
      
      // Categorize entities for rendering to speed up App.tsx on client
      this.updateClientRenderingGroups();

      return;
  }

  // Regen Ore occasionally
  updateOreRegen.call(this, timestamp);

  // Create entity map and group entities for fast lookups
  this.state.entityMap = new Map();
  const unitsByOwner: Record<string, Entity[]> = {};
  const buildingsByOwner: Record<string, Entity[]> = {};
  const allUnits: Entity[] = [];
  const allBuildings: Entity[] = [];
  const activeEntities: Entity[] = [];
  
  const enemiesByOwner: Record<string, Entity[]> = {};

  // First pass: collect all unique owners
  const allOwners = new Set<string>();
  this.state.entities.forEach((e: Entity) => {
    if (e.health > 0 && e.owner !== 'NEUTRAL') {
      allOwners.add(e.owner);
    }
  });

  // Initialize enemiesByOwner for each owner
  allOwners.forEach(owner => {
    enemiesByOwner[owner] = [];
  });

  this.state.entities.forEach((e: Entity) => {
    if (e.health <= 0) return;
    activeEntities.push(e);
    this.state.entityMap.set(e.id, e);
    
    if (e.type === 'UNIT') {
      allUnits.push(e);
      if (!unitsByOwner[e.owner]) unitsByOwner[e.owner] = [];
      unitsByOwner[e.owner].push(e);
    } else if (e.type === 'BUILDING' && e.subType !== 'TREE' && e.subType !== 'MOUNTAIN') {
      allBuildings.push(e);
      if (!buildingsByOwner[e.owner]) buildingsByOwner[e.owner] = [];
      buildingsByOwner[e.owner].push(e);
    }

    if (e.owner !== 'NEUTRAL') {
      allOwners.forEach(owner => {
        if (e.owner !== owner) {
          enemiesByOwner[owner].push(e);
        }
      });
    }
  });

  // Pre-calculate harvester targets once per frame for updateHarvester optimization
  const harvesterTargets: import('../types').Vector2[] = [];
  this.state.entities.forEach((e: Entity) => {
    if (e.health > 0 && (e.subType === 'HARVESTER' || e.subType === 'CHRONO_MINER')) {
      if (e.harvestState === 'MOVING_TO_ORE' && e.targetPosition) {
        harvesterTargets.push(e.targetPosition);
      } else if (e.harvestState === 'MINING') {
        harvesterTargets.push(e.position);
      }
    }
  });

  this.frameCache = { unitsByOwner, buildingsByOwner, allUnits, allBuildings, enemiesByOwner, harvesterTargets };
  this.state.entities = activeEntities; // Fix: Actually prune dead entities from state

  this.updateProduction(timestamp, dt);

  // Throttling for performance-heavy systems
  const shouldUpdateAI = this.frameCounter % 5 === 0;
  const shouldUpdateVisibility = this.frameCounter % 10 === 0;
  const shouldUpdateSeparation = this.frameCounter % 2 === 0;

  activeEntities.forEach((entity: Entity) => {
    // Pre-calculate for sorting in renderer to avoid heavy calls in sort functions
    const zOffset = this.getZOffset(entity.position);
    (entity as any).zOffset = zOffset;
    (entity as any).renderY = entity.position.y + zOffset;

    // Soft Separation for all units to prevent stacking - Balanced for smoothness
    if (shouldUpdateSeparation && entity.type === 'UNIT' && !entity.isDeployed && entity.health > 0 && entity.harvestState !== 'MINING' && entity.harvestState !== 'UNLOADING') {
      this.updateSeparation(entity, dt);
    }

    // Movement
    if (entity.type === 'UNIT' && entity.targetPosition && entity.speed && !entity.isDeployed) {
      this.updateMovement(entity, dt);
    }

    // Harvester Logic
    if (entity.subType === 'HARVESTER' || entity.subType === 'CHRONO_MINER') {
      this.updateHarvester(entity, dt);
    }

    // Combat
    const nonCombatTypes = ['CONSTRUCTION_YARD', 'ALLIED_CONSTRUCTION_YARD', 'POWER_PLANT', 'ALLIED_POWER_PLANT', 'NUCLEAR_REACTOR', 'ORE_REFINERY', 'ALLIED_ORE_REFINERY', 'BARRACKS', 'ALLIED_BARRACKS', 'WAR_FACTORY', 'ALLIED_WAR_FACTORY', 'RADAR', 'AIR_FORCE_COMMAND', 'SERVICE_DEPOT', 'BATTLE_LAB', 'ALLIED_BATTLE_LAB', 'ORE_PURIFIER', 'ALLIED_ORE_PURIFIER', 'INDUSTRIAL_PLANT', 'PSYCHIC_SENSOR', 'CLONING_VATS', 'NAVAL_YARD', 'ALLIED_NAVAL_YARD', 'SOVIET_WALL', 'ALLIED_WALL', 'IRON_CURTAIN', 'NUCLEAR_SILO', 'CHRONOSPHERE', 'WEATHER_DEVICE', 'GAP_GENERATOR', 'MCV', 'ALLIED_MCV', 'HARVESTER', 'CHRONO_MINER', 'OIL_DERRICK', 'TREE'];
    if (!nonCombatTypes.includes(entity.subType || '') && entity.owner !== 'NEUTRAL') {
      this.updateCombat(entity, dt, timestamp);
    }

    // Repair Logic
    if (entity.isRepairing) {
      if (entity.type === 'BUILDING') {
        const now = performance.now();
        const repairInterval = 500; // Repair every 0.5s
        const lastRepair = entity.lastRepairTime || 0;
        
        if (now - lastRepair > repairInterval) {
          const repairAmount = 50;
          const repairCost = 10;
          
          const owner = entity.owner;
          const credits = owner === 'PLAYER' ? this.state.credits : 
                          owner === 'PLAYER_2' ? (this.state.p2Credits || 0) :
                          owner === 'PLAYER_3' ? (this.state.p3Credits || 0) :
                          (this.state.p4Credits || 0);

          if (credits >= repairCost && entity.health < entity.maxHealth) {
            entity.health = Math.min(entity.maxHealth, entity.health + repairAmount);
            if (owner === 'PLAYER') this.state.credits -= repairCost;
            else if (owner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) - repairCost;
            else if (owner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) - repairCost;
            else if (owner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) - repairCost;
            
            entity.lastRepairTime = now;
            
            // Visual effect
            this.state.effects.push({
              id: `repair-fx-${entity.id}-${now}`,
              type: 'MUZZLE_FLASH',
              position: { 
                x: entity.position.x + (Math.random() - 0.5) * entity.size, 
                y: entity.position.y + (Math.random() - 0.5) * entity.size 
              },
              startTime: now,
              duration: 300,
              color: '#22c55e'
            });
          }
          
          if (entity.health >= entity.maxHealth || (credits || 0) < repairCost) {
            entity.isRepairing = false;
          }
        }
      } else if (entity.type === 'UNIT' && entity.targetId) {
        // Unit repairing at a specific building (Service Depot)
        const targetBuilding = this.state.entityMap?.get(entity.targetId);
        if (targetBuilding && targetBuilding.health > 0 && Math.hypot(entity.position.x - targetBuilding.position.x, entity.position.y - targetBuilding.position.y) < 100) {
          const now = performance.now();
          const repairInterval = 500;
          const lastRepair = entity.lastRepairTime || 0;
          if (now - lastRepair > repairInterval) {
            const repairAmount = 50;
            const repairCost = 10;
            const owner = entity.owner;
            const credits = owner === 'PLAYER' ? this.state.credits : 
                            owner === 'PLAYER_2' ? (this.state.p2Credits || 0) :
                            owner === 'PLAYER_3' ? (this.state.p3Credits || 0) :
                            (this.state.p4Credits || 0);

            if (credits >= repairCost && entity.health < entity.maxHealth) {
              entity.health = Math.min(entity.maxHealth, entity.health + repairAmount);
              if (owner === 'PLAYER') this.state.credits -= repairCost;
              else if (owner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) - repairCost;
              else if (owner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) - repairCost;
              else if (owner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) - repairCost;

              entity.lastRepairTime = now;

              this.state.effects.push({
                id: `repair-fx-${entity.id}-${now}`,
                type: 'MUZZLE_FLASH',
                position: { 
                  x: entity.position.x + (Math.random() - 0.5) * entity.size, 
                  y: entity.position.y + (Math.random() - 0.5) * entity.size 
                },
                startTime: now,
                duration: 300,
                color: '#22c55e'
              });
            }
            if (entity.health >= entity.maxHealth || (credits || 0) < repairCost) {
              entity.isRepairing = false;
              entity.targetId = undefined;
            }
          }
        } else if (!targetBuilding || targetBuilding.health <= 0) {
          entity.isRepairing = false;
          entity.targetId = undefined;
        }
      }
    }
  });

  // Remove dead
  const deadEntities = this.state.entities.filter((e: Entity) => e.health <= 0);
  deadEntities.forEach((dead: Entity) => {
    if (dead.subType === 'HARVESTER' || dead.subType === 'CHRONO_MINER') {
      // Free up any refinery it was occupying
      const refinery = this.state.entities.find((e: Entity) => e.occupiedBy === dead.id);
      if (refinery) {
        refinery.occupiedBy = null;
      }
    }

    if (dead.subType === 'DEMOLITION_TRUCK') {
      // Big explosion!
      this.state.effects.push({
        id: `demo-exp-${dead.id}-${timestamp}`,
        type: 'EXPLOSION',
        position: { ...dead.position },
        startTime: timestamp,
        duration: 1000,
      });
      // Area damage
      const areaTargets = (this as any).frameCache.enemiesByOwner[dead.owner] || [];
      areaTargets.forEach((e: Entity) => {
        if (e.id !== dead.id && e.health > 0) {
          const dx = e.position.x - dead.position.x;
          const dy = e.position.y - dead.position.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 40000) { // 200^2
            const dist = Math.sqrt(d2);
            const damage = (1 - dist / 200) * 800;
            e.health -= damage;
          }
        }
      });
    }
  });
  
  this.state.entities = this.state.entities.filter((e: Entity) => e.health > 0);

  if (this.role === 'OFFLINE' || (this.role === 'SERVER' && this.state.botSlots?.length > 0)) {
      if (shouldUpdateAI) {
        this.updateAI(timestamp);
      }
  }
  
  if (this.frameCounter % 5 === 0) {
    this.updateCrates(dt, timestamp);
  }
  this.updateResources(dt);
  if (this.role !== 'SERVER' && shouldUpdateVisibility) {
    this.updateVisibility();
    this.updateClientRenderingGroups();
    
    // Update dynamic obstacle grid for pathfinding
    const mapTileSize = this.state.map.tileSize;
    const pfTileSize = 20;
    const pScale = mapTileSize / pfTileSize;
    const pfWidth = this.state.map.width * pScale;
    const pfHeight = this.state.map.height * pScale;
    
    if (!this.state.dynamicObstacleGrid) {
      this.state.dynamicObstacleGrid = new Uint8Array(pfWidth * pfHeight);
    }
    const obstacleGrid = this.state.dynamicObstacleGrid;
    obstacleGrid.fill(0);

    this.state.entities.forEach((e: Entity) => {
      if (e.health <= 0) return;
      if (e.type === 'BUILDING' && e.subType !== 'TREE') {
        const dims = getBuildingDimensions(e.subType as any);
        const cx = Math.floor(e.position.x / mapTileSize);
        const cy = Math.floor(e.position.y / mapTileSize);
        const isOverMountain = this.state.map.tiles[cy]?.[cx] === 'MOUNTAIN_GRASS';
        const effectiveTileSize = isOverMountain ? mapTileSize * 1.2 : mapTileSize;

        let w = dims.w * effectiveTileSize;
        let h = dims.h * effectiveTileSize;
        let oy = 0;
        
        const minX = Math.floor((e.position.x - w / 2 + 1) / pfTileSize);
        const maxX = Math.floor((e.position.x + w / 2 - 1) / pfTileSize);
        const minY = Math.floor((e.position.y - h / 2 + oy + 1) / pfTileSize);
        const maxY = Math.floor((e.position.y + h / 2 + oy - 1) / pfTileSize);
        
        for (let gy = minY; gy <= maxY; gy++) {
          for (let gx = minX; gx <= maxX; gx++) {
            if (gx >= 0 && gx < pfWidth && gy >= 0 && gy < pfHeight) {
              obstacleGrid[gy * pfWidth + gx] = 1;
            }
          }
        }
      }
    });
  }
  this.updateProjectiles(dt, timestamp);
  this.updateEffects(timestamp);
  this.updateSpecialAbilities(timestamp);
  this.state.moveMarkers = this.state.moveMarkers.filter((m: any) => timestamp - m.startTime < 500);
  this.checkWinLoss();
}
