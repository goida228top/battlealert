
import { Entity, BuildingType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function update(this: any, timestamp: number) {
  if (this.lastUpdate === 0) {
      this.lastUpdate = timestamp;
      return;
  }
  const dt = (timestamp - this.lastUpdate) / 16.67; // normalize to ~60fps
  this.lastUpdate = timestamp;

  if (dt > 100) return; // Prevent massive jumps, but allow server-side 10-20Hz loops

  if (this.role === 'CLIENT') {
      // Плавная интерполяция серверных позиций на клиенте
      this.state.entities.forEach((entity: Entity) => {
          const sePos = (entity as any).serverPosition;
          if (sePos) {
              const dx = sePos.x - entity.position.x;
              const dy = sePos.y - entity.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 200) {
                  // Телепорт, если разрыв слишком большой (например, после создания)
                  entity.position.x = sePos.x;
                  entity.position.y = sePos.y;
              } else if (dist > 0.1) {
                  // Мягкое подтягивание к реальной позиции сервера
                  entity.position.x += dx * 0.2 * dt;
                  entity.position.y += dy * 0.2 * dt;
              }
          }

          // Локальное движение для мгновенного отклика при управлении своими юнитами
          if (entity.type === 'UNIT' && entity.targetPosition && entity.speed && !entity.isDeployed) {
              const dx = entity.targetPosition.x - entity.position.x;
              const dy = entity.targetPosition.y - entity.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance > 1) {
                  entity.position.x += (dx / distance) * entity.speed * dt;
                  entity.position.y += (dy / distance) * entity.speed * dt;
              }
          }
      });

      this.updateEffects(dt);
      this.updateVisibility();
      return;
  }

  this.updateProduction(timestamp, dt);

  this.state.entities.forEach((entity: Entity) => {
    // Soft Separation for all units to prevent stacking
    if (entity.type === 'UNIT' && !entity.isDeployed && entity.health > 0) {
      let sepX = 0;
      let sepY = 0;
      let overlapCount = 0;
      
      this.state.entities.forEach((other: Entity) => {
        if (other.id !== entity.id && other.type === 'UNIT' && other.health > 0 && !other.isDeployed) {
          const odx = entity.position.x - other.position.x;
          const ody = entity.position.y - other.position.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          const minSpace = (entity.size + other.size) / 2 * 0.9;
          if (odist < minSpace && odist > 0.1) {
            sepX += (odx / odist) * (minSpace - odist);
            sepY += (ody / odist) * (minSpace - odist);
            overlapCount++;
          }
        }
      });
      
      if (overlapCount > 0) {
        entity.position.x += (sepX / overlapCount) * 0.15 * dt;
        entity.position.y += (sepY / overlapCount) * 0.15 * dt;
      }
    }

    // Movement
    if (entity.type === 'UNIT' && entity.targetPosition && entity.speed && !entity.isDeployed) {
      const dx = entity.targetPosition.x - entity.position.x;
      const dy = entity.targetPosition.y - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > entity.speed * dt) {
        const nextX = entity.position.x + (dx / distance) * entity.speed * dt;
        const nextY = entity.position.y + (dy / distance) * entity.speed * dt;
        
        // Simple collision check for the next step
        const collision = this.state.entities.find((e: Entity) => {
          if (e.type !== 'BUILDING' || e.health <= 0) return false;
          const dims = getBuildingDimensions(e.subType as BuildingType);
          const w = dims.w * 40;
          const h = dims.h * 40;
          
          const isInside = (px: number, py: number) => 
            px >= e.position.x - w/2 && px <= e.position.x + w/2 &&
            py >= e.position.y - h/2 && py <= e.position.y + h/2;

          // If already inside this building, don't block (allow escape)
          if (isInside(entity.position.x, entity.position.y)) return false;
          
          return isInside(nextX, nextY);
        });

        if (!collision) {
          entity.position.x = nextX;
          entity.position.y = nextY;
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
          // If blocked by a new building, try to recalculate path to the final destination
          if (entity.path && entity.path.length > 0) {
            const now = performance.now();
            if (!entity.lastRepath || now - entity.lastRepath > 1000) {
              const finalDest = entity.path[entity.path.length - 1];
              entity.path = this.calculatePath(entity.position, finalDest);
              entity.targetPosition = entity.path[0];
              entity.lastRepath = now;
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

    // Harvester Logic
    if (entity.subType === 'HARVESTER' || entity.subType === 'CHRONO_MINER') {
      this.updateHarvester(entity, dt);
    }

    // Combat
    const nonCombatTypes = ['CONSTRUCTION_YARD', 'ALLIED_CONSTRUCTION_YARD', 'POWER_PLANT', 'ALLIED_POWER_PLANT', 'NUCLEAR_REACTOR', 'ORE_REFINERY', 'ALLIED_ORE_REFINERY', 'BARRACKS', 'ALLIED_BARRACKS', 'WAR_FACTORY', 'ALLIED_WAR_FACTORY', 'RADAR', 'AIR_FORCE_COMMAND', 'SERVICE_DEPOT', 'BATTLE_LAB', 'ALLIED_BATTLE_LAB', 'ORE_PURIFIER', 'ALLIED_ORE_PURIFIER', 'INDUSTRIAL_PLANT', 'PSYCHIC_SENSOR', 'CLONING_VATS', 'NAVAL_YARD', 'ALLIED_NAVAL_YARD', 'SOVIET_WALL', 'ALLIED_WALL', 'IRON_CURTAIN', 'NUCLEAR_SILO', 'CHRONOSPHERE', 'WEATHER_DEVICE', 'GAP_GENERATOR', 'MCV', 'ALLIED_MCV', 'HARVESTER', 'CHRONO_MINER', 'OIL_DERRICK'];
    if (!nonCombatTypes.includes(entity.subType || '')) {
      this.updateCombat(entity, dt, timestamp);
    }

    // Repair Logic
    if (entity.type === 'BUILDING' && entity.isRepairing) {
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
      this.state.entities.forEach(e => {
        if (e.id !== dead.id && e.health > 0) {
          const dist = Math.hypot(e.position.x - dead.position.x, e.position.y - dead.position.y);
          if (dist < 200) {
            const damage = (1 - dist / 200) * 800;
            e.health -= damage;
          }
        }
      });
    }
  });
  
  this.state.entities = this.state.entities.filter((e: Entity) => e.health > 0);

  if (this.role === 'OFFLINE' || (this.role === 'SERVER' && this.state.botSlots?.length > 0)) {
      this.updateAI(timestamp);
  }
  
  this.updateCrates(dt, timestamp);
  this.updateResources(dt);
  if (this.role !== 'SERVER') {
    this.updateVisibility();
  }
  this.updateProjectiles(dt, timestamp);
  this.updateEffects(timestamp);
  this.updateSpecialAbilities(timestamp);
  this.state.moveMarkers = this.state.moveMarkers.filter((m: any) => timestamp - m.startTime < 500);
  this.checkWinLoss();
}
