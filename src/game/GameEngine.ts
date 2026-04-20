
import { Entity, GameState, Vector2, UnitType, BuildingType, Faction, Country } from './types';
import { updateSpecialAbilities } from "./systems/updateSpecialAbilities";
import { useIronCurtainAI } from "./systems/useIronCurtainAI";
import { useSpyPlaneAI } from "./systems/useSpyPlaneAI";
import { useParatroopersAI } from "./systems/useParatroopersAI";
import { useNuclearStrikeAI } from "./systems/useNuclearStrikeAI";
import { updateProjectiles } from "./systems/updateProjectiles";
import { updateEffects } from "./systems/updateEffects";
import { updateProduction } from "./systems/updateProduction";
import { updateVisibility } from "./systems/updateVisibility";
import { updateHarvester } from "./systems/updateHarvester";
import { updateCombat } from "./systems/updateCombat";
import { updateAI } from "./systems/updateAI";
import { placeBuildingAt } from "./systems/placeBuildingAt";
import { produceUnitAt } from "./systems/produceUnitAt";
import { updateResources } from "./systems/updateResources";
import { updateCrates } from "./systems/updateCrates";
import { checkWinLoss } from "./systems/checkWinLoss";
import { sellBuilding } from "./systems/sellBuilding";
import { repairBuilding } from "./systems/repairBuilding";
import { placeBuilding } from "./systems/placeBuilding";
import { getCategory } from "./systems/getCategory";
import { getCost } from "./systems/getCost";
import { getBuildTime } from "./systems/getBuildTime";

import { getBuildingDimensions } from "./systems/getBuildingDimensions";
 
 // New system imports
import { initGame } from "./systems/initGame";
import { calculatePath } from "./systems/calculatePath";
import { update } from "./systems/update";
import { useIronCurtain } from "./systems/useIronCurtain";
import { useChronosphere } from "./systems/useChronosphere";
import { executeChronosphereTeleport } from "./systems/executeChronosphereTeleport";
import { useWeatherStorm } from "./systems/useWeatherStorm";
import { useSpyPlane } from "./systems/useSpyPlane";
import { useParatroopers } from "./systems/useParatroopers";
import { useNuclearStrike } from "./systems/useNuclearStrike";
import { getPrerequisites } from "./systems/getPrerequisites";
import { isUnlocked } from "./systems/isUnlocked";
import { startProduction } from "./systems/startProduction";
import { handleMouseDown } from "./systems/handleMouseDown";
import { handleMouseMove } from "./systems/handleMouseMove";
import { handleMouseUp } from "./systems/handleMouseUp";
import { startPlacing } from "./systems/startPlacing";
import { deployMCV } from "./systems/deployMCV";
import { undeployConstructionYard } from "./systems/undeployConstructionYard";
import { produceUnit } from "./systems/produceUnit";
import { screenToWorld } from "./systems/screenToWorld";
import { resetGame } from "./systems/resetGame";

export class GameEngine {
  state!: GameState;
  
  // Multiplayer properties
  public role: 'HOST' | 'CLIENT' | 'OFFLINE' | 'SERVER' = 'OFFLINE';
  public roomId: string | null = null;
  public socket: any = null;
  public localPlayerId: string = 'PLAYER';

  private lastUpdate: number = 0;
  private aiBuildOrder: BuildingType[] = [
    'POWER_PLANT', 'ORE_REFINERY', 'BARRACKS', 'SENTRY_GUN', 
    'WAR_FACTORY', 'NAVAL_YARD', 'RADAR', 'TESLA_COIL', 'SERVICE_DEPOT', 
    'BATTLE_LAB', 'ORE_PURIFIER', 'FLAK_CANNON', 'INDUSTRIAL_PLANT',
    'PSYCHIC_SENSOR', 'CLONING_VATS', 'NUCLEAR_REACTOR', 'IRON_CURTAIN', 'NUCLEAR_SILO',
    'SOVIET_WALL', 'BATTLE_BUNKER'
  ];
  public aiNextBuildTime: number = 0;
  public aiAttackTime: number = 0;
  public aiStates: any;

  public aiKnownPlayerBase: Vector2 | null = null;
  public aiScoutTime: number = 0;

  public lastClickTime: number = 0;
  public lastClickedEntityId: string | null = null;

  public playerFaction: Faction = 'FEDERATION';
  public playerCountry: Country = 'RUSSIA';

  constructor(faction: Faction = 'FEDERATION', country: Country = 'RUSSIA') {
    this.playerFaction = faction;
    this.playerCountry = country;
    this.initGame();
  }

  public resetGame(faction: Faction, country: Country, mapId: string = 'RIVER_DIVIDE') {
    return resetGame.call(this, faction, country, mapId);
  }

  public initGame(mapId: string = 'RIVER_DIVIDE') {
    return initGame.call(this, mapId);
  }

  public screenToWorld(pos: Vector2): Vector2 {
    return screenToWorld.call(this, pos);
  }

  public calculatePath(start: Vector2, end: Vector2): Vector2[] {
    return calculatePath.call(this, start, end);
  }

   public initMultiplayer(role: 'HOST' | 'CLIENT', roomId: string, socket: any, roomInfo: any) {
    console.log(`[GameEngine] Start Multiplayer: ${role}, Socket: ${socket?.id}`);
    this.role = 'CLIENT'; // FORCE NO ONE TO BE HOST ON FRONTEND
    this.roomId = roomId;
    this.socket = socket;
    
    if (roomInfo && roomInfo.players) {
       this.state.playerMappings = {};
       this.state.playerColors = {};
       
       const slots = ['PLAYER', 'PLAYER_2', 'PLAYER_3', 'PLAYER_4'];
       roomInfo.players.forEach((p: any, index: number) => {
           const slot = slots[index % slots.length];
           this.state.playerMappings![p.id] = slot;
           this.state.playerColors![slot] = p.color;
           if (p.isBot) {
               if (!this.state.botSlots) this.state.botSlots = [];
               this.state.botSlots.push(slot);
           }
           
           if (socket && p.id === socket.id) {
               this.localPlayerId = slot as any;
               this.playerFaction = p.faction;
               this.playerCountry = p.country;
               console.log(`[GameEngine] I am ${this.localPlayerId} (Slot ${slot}), Faction: ${this.playerFaction}`);
           }
       });

       // Final fallback
       if (!this.localPlayerId) {
           this.localPlayerId = role === 'HOST' ? 'PLAYER' : 'PLAYER_2';
       }

       const mapWidth = this.state.map.width;
       const mapHeight = this.state.map.height;
       const corners = [
           { x: 10 * 40, y: 10 * 40 }, // Top-Left
           { x: (mapWidth - 10) * 40, y: (mapHeight - 10) * 40 }, // Bottom-Right
           { x: (mapWidth - 10) * 40, y: 10 * 40 }, // Top-Right
           { x: 10 * 40, y: (mapHeight - 10) * 40 }, // Bottom-Left
       ];

       this.state.entities = this.state.entities.filter(e => e.type !== 'UNIT' || (e.subType !== 'MCV' && e.subType !== 'ALLIED_MCV'));

       roomInfo.players.forEach((p: any, index: number) => {
           const slot = this.state.playerMappings![p.id];
           const isAllied = p.faction === 'COALITION';
           const pos = corners[index % corners.length];
           
           console.log(`[GameEngine] Adding MCV for ${p.id} (${slot}) at ${pos.x},${pos.y}`);
           this.state.entities.push({
               id: `mcv-${p.id}`,
               type: 'UNIT',
               subType: isAllied ? 'ALLIED_MCV' : 'MCV',
               position: { ...pos },
               health: 3000,
               maxHealth: 3000,
               owner: slot,
               size: 40,
               speed: 1.5,
               rotation: 0,
           });

           if (slot === this.localPlayerId) {
               this.state.camera.x = -pos.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
               this.state.camera.y = -pos.y + (typeof window !== 'undefined' ? window.innerHeight / 2 : 500);
               console.log(`[GameEngine] Camera centered on ${pos.x},${pos.y}`);
           }
       });
    }

    if (this.role === 'CLIENT' || this.role === 'HOST') {
        this.socket.on('game_state_update', (newState: any) => {
            if (newState && this.state) {
                // Мягкая синхронизация сущностей: обновляем существующие, удаляем пропавшие, добавляем новые
                const serverEntitiesMap = new Map();
                newState.entities.forEach((se: any) => serverEntitiesMap.set(se.id, se));

                // 1. Обновляем существующие и удаляем лишние
                this.state.entities = this.state.entities.filter(le => {
                    const se = serverEntitiesMap.get(le.id);
                    if (!se) return false;

                    le.health = se.health;
                    le.maxHealth = se.maxHealth;
                    le.owner = se.owner;
                    le.subType = se.subType;
                    le.type = se.type;
                    le.size = se.size;
                    le.speed = se.speed;
                    le.isDeployed = se.isDeployed;
                    le.targetPosition = se.targetPosition;
                    le.targetId = se.targetId;
                    le.rank = se.rank;
                    le.isRepairing = se.isRepairing;
                    le.rotation = se.rotation;

                    // Сохраняем серверную позицию для интерполяции в update.ts
                    (le as any).serverPosition = se.position;

                    return true;
                });

                // 2. Добавляем новые
                newState.entities.forEach((se: any) => {
                    if (!this.state.entities.some(le => le.id === se.id)) {
                        this.state.entities.push({ ...se });
                    }
                });

                this.state.credits = newState.credits;
                this.state.p2Credits = newState.p2Credits;
                this.state.p3Credits = newState.p3Credits;
                this.state.p4Credits = newState.p4Credits;
                this.state.productionQueue = newState.productionQueue;
                this.state.p2ProductionQueue = newState.p2ProductionQueue;
                this.state.p3ProductionQueue = newState.p3ProductionQueue;
                this.state.p4ProductionQueue = newState.p4ProductionQueue;
                this.state.effects = newState.effects;
                this.state.projectiles = newState.projectiles;
                this.state.crates = newState.crates;
                this.state.ironCurtainActive = newState.ironCurtainActive;
                this.state.specialAbilities = newState.specialAbilities;
                this.state.p2SpecialAbilities = newState.p2SpecialAbilities;
                this.state.p3SpecialAbilities = newState.p3SpecialAbilities;
                this.state.p4SpecialAbilities = newState.p4SpecialAbilities;
                this.state.power = newState.power;
                this.state.powerConsumption = newState.powerConsumption;
                this.state.playerMappings = newState.playerMappings;
                this.state.playerColors = newState.playerColors;
                this.state.gameOver = newState.gameOver;
            }
        });
    }
  }

  public executeRemoteCommand(cmd: any) {
    const owner = cmd.owner || 'PLAYER';

    if (cmd.type === 'START_PRODUCTION') {
        this.startProduction(cmd.subType, owner, cmd.processId);
    } else if (cmd.type === 'REMOVE_FROM_QUEUE') {
        this.removeFromQueue(cmd.itemId, owner);
    } else if (cmd.type === 'PLACE_BUILDING') {
        this.placeBuildingAt(cmd.pos, cmd.buildType, owner, cmd.entityId);
    } else if (cmd.type === 'MOVE_OR_ATTACK') {
        const units = this.state.entities.filter(e => cmd.unitIds.includes(e.id) && e.owner === owner);
        if (cmd.targetId) {
            units.forEach(u => {
              u.targetId = cmd.targetId;
              u.explicitAttack = true;
              u.targetPosition = undefined;
              u.path = undefined;
            });
        } else if (cmd.targetPos) {
            this.issueMoveOrder(units, cmd.targetPos);
            units.forEach((u: any) => {
              u.explicitAttack = false;
              u.targetId = undefined;
            });
        }
    } else if (cmd.type === 'SELL_BUILDING') {
        const b = this.state.entities.find(e => e.id === cmd.entityId && e.owner === owner);
        if (b) this.sellBuilding(b);
    } else if (cmd.type === 'REPAIR_BUILDING') {
        const b = this.state.entities.find(e => e.id === cmd.entityId && e.owner === owner);
        if (b) this.repairBuilding(b);
    } else if (cmd.type === 'USE_ABILITY') {
        if (cmd.ability === 'USE_IRON_CURTAIN') this.useIronCurtain(cmd.pos, owner);
        if (cmd.ability === 'USE_NUCLEAR_STRIKE') this.useNuclearStrike(cmd.pos, owner);
        if (cmd.ability === 'USE_SPY_PLANE') this.useSpyPlane(cmd.pos, owner);
        if (cmd.ability === 'USE_PARATROOPERS') this.useParatroopers(cmd.pos, owner);
        if (cmd.ability === 'USE_WEATHER_STORM') this.useWeatherStorm(cmd.pos, owner);
        if (cmd.ability === 'USE_CHRONOSPHERE_SELECT') this.useChronosphere(cmd.pos, owner);
        if (cmd.ability === 'USE_CHRONOSPHERE_EXECUTE') {
          (this as any).chronosphereSelection = cmd.selectionObj;
          this.executeChronosphereTeleport(cmd.pos, owner);
        }
    } else if (cmd.type === 'DEPLOY_MCV') {
        const unit = this.state.entities.find(e => e.id === cmd.mcvId && e.owner === owner);
        if (unit) this.deployMCV(cmd.mcvId, cmd.baseId);
    } else if (cmd.type === 'UNDEPLOY_YARD') {
        const building = this.state.entities.find(e => e.id === cmd.yardId && e.owner === owner);
        if (building) this.undeployConstructionYard(cmd.yardId, cmd.mcvId);
    } else if (cmd.type === 'SET_RALLY_POINT') {
        const buildings = this.state.entities.filter(e => cmd.buildingIds.includes(e.id) && e.owner === owner);
        buildings.forEach(b => b.rallyPoint = cmd.pos);
    } else if (cmd.type === 'STOP_UNITS') {
        const units = this.state.entities.filter(e => cmd.unitIds.includes(e.id) && e.owner === owner);
        units.forEach(u => {
            u.targetPosition = undefined;
            u.targetId = undefined;
            u.path = undefined;
            u.explicitAttack = false;
        });
    } else if (cmd.type === 'TOGGLE_DEPLOY') {
        const unit = this.state.entities.find(e => e.id === cmd.unitId && e.owner === owner);
        if (unit) {
            unit.isDeployed = !unit.isDeployed;
            unit.targetPosition = undefined;
            unit.path = undefined;
        }
    } else if (cmd.type === 'SCATTER_UNITS') {
        cmd.scatteredInfos.forEach((info: any) => {
            const unit = this.state.entities.find(e => e.id === info.id && e.owner === owner);
            if (unit) {
                unit.targetPosition = info.targetPosition;
                unit.path = [info.targetPosition];
                unit.targetId = undefined;
            }
        });
    } else if (cmd.type === 'DEBUG_GIVE_CREDITS') {
        if (owner === 'PLAYER') this.state.credits += 100000;
        else if (owner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) + 100000;
        else if (owner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + 100000;
        else if (owner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + 100000;
    } else if (cmd.type === 'SPAWN_UNIT') {
        const entity = {
          id: `${cmd.subType}-debug-${Date.now()}`,
          type: 'UNIT',
          subType: cmd.subType,
          position: cmd.position,
          health: 1000,
          maxHealth: 1000,
          owner: cmd.owner,
          size: 40,
          speed: 2,
        };
        this.state.entities.push(entity as any);
    } else if (cmd.type === 'CLEAR_ENEMIES') {
        this.state.entities = this.state.entities.filter(e => e.owner === cmd.owner || e.owner === 'NEUTRAL');
    }
  }

  public issueMoveOrder(selectedUnits: Entity[], worldPos: Vector2) {
    const numUnits = selectedUnits.length;
    
    if (numUnits === 1) {
      const u = selectedUnits[0];
      u.path = this.calculatePath(u.position, worldPos);
      u.targetPosition = u.path[0];
      u.targetId = undefined;
      return;
    }

    const cols = Math.ceil(Math.sqrt(numUnits));
    const spacing = 40; 
    
    selectedUnits.forEach((u, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      
      const offsetX = (col - (cols - 1) / 2) * spacing;
      const offsetY = (row - (cols - 1) / 2) * spacing;
      
      const individualTargetPos = {
        x: worldPos.x + offsetX,
        y: worldPos.y + offsetY
      };
      
      u.path = this.calculatePath(u.position, individualTargetPos);
      u.targetPosition = u.path[0];
      u.targetId = undefined;
    });
  }

  public update(timestamp: number) {
    return update.call(this, timestamp);
  }

  public updateSpecialAbilities(timestamp: number) {
    return updateSpecialAbilities.call(this, timestamp);
  }

  public useIronCurtainAI(targetPos: Vector2) {
    return useIronCurtainAI.call(this, targetPos);
  }

  public useSpyPlaneAI(targetPos: Vector2) {
    return useSpyPlaneAI.call(this, targetPos);
  }

  public useParatroopersAI(targetPos: Vector2) {
    return useParatroopersAI.call(this, targetPos);
  }

  public useNuclearStrikeAI(targetPos: Vector2) {
    return useNuclearStrikeAI.call(this, targetPos);
  }

  public useIronCurtain(targetPos: Vector2, owner: string = 'PLAYER') {
    return useIronCurtain.call(this, targetPos, owner);
  }

  public useChronosphere(targetPos: Vector2, owner: string = 'PLAYER') {
    return useChronosphere.call(this, targetPos, owner);
  }

  public executeChronosphereTeleport(targetPos: Vector2, owner: string = 'PLAYER') {
    return executeChronosphereTeleport.call(this, targetPos, owner);
  }

  public useWeatherStorm(targetPos: Vector2, owner: string = 'PLAYER') {
    return useWeatherStorm.call(this, targetPos, owner);
  }

  public useSpyPlane(targetPos: Vector2, owner: string = 'PLAYER') {
    return useSpyPlane.call(this, targetPos, owner);
  }

  public useParatroopers(targetPos: Vector2, owner: string = 'PLAYER') {
    return useParatroopers.call(this, targetPos, owner);
  }

  public useNuclearStrike(targetPos: Vector2, owner: string = 'PLAYER') {
    return useNuclearStrike.call(this, targetPos, owner);
  }

  public getPrerequisites(type: string): string[] {
    return getPrerequisites.call(this, type);
  }

  public isUnlocked(type: string, owner: string): boolean {
    return isUnlocked.call(this, type, owner);
  }

  public startProduction(subType: UnitType | BuildingType, owner: string = 'PLAYER', processId?: string) {
    return startProduction.call(this, subType, owner, processId);
  }

  public getCost(type: string): number {
    return getCost.call(this, type);
  }

  public getBuildTime(type: string): number {
    return getBuildTime.call(this, type);
  }

  public updateVisibility() {
    return updateVisibility.call(this);
  }

  public updateHarvester(harvester: Entity, dt: number) {
    return updateHarvester.call(this, harvester, dt);
  }

  public updateCombat(entity: Entity, dt: number, timestamp: number) {
    return updateCombat.call(this, entity, dt, timestamp);
  }

  public updateAI(timestamp: number) {
    return updateAI.call(this, timestamp);
  }

  public placeBuildingAt(pos: Vector2, type: BuildingType, owner: string, providedEntityId?: string) {
    return placeBuildingAt.call(this, pos, type, owner, providedEntityId);
  }

  public produceUnitAt(producer: Entity, type: UnitType, owner: string) {
    return produceUnitAt.call(this, producer, type, owner);
  }

  public updateCrates(dt: number, timestamp: number) {
    return updateCrates.call(this, dt, timestamp);
  }

  public updateResources(dt: number) {
    return updateResources.call(this, dt);
  }

  public checkWinLoss() {
    return checkWinLoss.call(this);
  }

  public handleMouseDown(pos: Vector2, isRightClick: boolean, isCtrlKey: boolean = false) {
    return handleMouseDown.call(this, pos, isRightClick, isCtrlKey);
  }

  public sellBuilding(building: any) {
    return sellBuilding.call(this, building);
  }

  public repairBuilding(building: any): boolean {
    return repairBuilding.call(this, building);
  }

  public handleMouseMove(pos: Vector2) {
    return handleMouseMove.call(this, pos);
  }

  public handleMouseUp() {
    return handleMouseUp.call(this);
  }

  public startPlacing(type: BuildingType) {
    return startPlacing.call(this, type);
  }

  public deployMCV(mcvId: string, baseId?: string) {
    return deployMCV.call(this, mcvId, baseId);
  }

  public undeployConstructionYard(yardId: string, mcvId?: string) {
    return undeployConstructionYard.call(this, yardId, mcvId);
  }

  public produceUnit(type: UnitType) {
    return produceUnit.call(this, type);
  }

  public placeBuilding(pos: Vector2, serverEntityId?: string) {
    return placeBuilding.call(this, pos, serverEntityId);
  }

  public removeFromQueue(itemId: string, owner?: string) {
    const actualOwner = owner || this.localPlayerId || 'PLAYER';
    
    if (this.role === 'CLIENT' || this.role === 'HOST') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'REMOVE_FROM_QUEUE', itemId, owner: actualOwner }
        });
        return; // Only emit
    }

    if (actualOwner === 'PLAYER') {
        const item = this.state.productionQueue.find(q => q.id === itemId);
        if (item) this.state.credits += item.cost; // Refund
        this.state.productionQueue = this.state.productionQueue.filter(q => q.id !== itemId);
    } else if (actualOwner === 'PLAYER_2') {
        if (this.state.p2ProductionQueue) {
            const item = this.state.p2ProductionQueue.find(q => q.id === itemId);
            if (item) this.state.p2Credits = (this.state.p2Credits || 0) + item.cost;
            this.state.p2ProductionQueue = this.state.p2ProductionQueue.filter(q => q.id !== itemId);
        }
    } else if (actualOwner === 'PLAYER_3') {
        if (this.state.p3ProductionQueue) {
            const item = this.state.p3ProductionQueue.find(q => q.id === itemId);
            if (item) this.state.p3Credits = (this.state.p3Credits || 0) + item.cost;
            this.state.p3ProductionQueue = this.state.p3ProductionQueue.filter(q => q.id !== itemId);
        }
    } else if (actualOwner === 'PLAYER_4') {
        if (this.state.p4ProductionQueue) {
            const item = this.state.p4ProductionQueue.find(q => q.id === itemId);
            if (item) this.state.p4Credits = (this.state.p4Credits || 0) + item.cost;
            this.state.p4ProductionQueue = this.state.p4ProductionQueue.filter(q => q.id !== itemId);
        }
    }
  }

  // Helper methods for other systems
  public getCategory(type: string) {
    return getCategory.call(this, type);
  }

  public getBuildingDimensions(type: BuildingType) {
    return getBuildingDimensions(type);
  }

  public updateProjectiles(dt: number, timestamp: number) {
    return updateProjectiles.call(this, dt, timestamp);
  }

  public updateEffects(timestamp: number) {
    return updateEffects.call(this, timestamp);
  }

  public updateProduction(timestamp: number, dt: number) {
    return updateProduction.call(this, timestamp, dt);
  }

  // --- Debug / Cheat Methods ---
  public toggleDebugFog() {
    this.state.debugFlags = this.state.debugFlags || {};
    this.state.debugFlags.disableFog = !this.state.debugFlags.disableFog;
  }

  public toggleFreeZoom() {
    this.state.debugFlags = this.state.debugFlags || {};
    this.state.debugFlags.freeZoom = !this.state.debugFlags.freeZoom;
  }

  public debugGiveCredits() {
    if (this.role === 'CLIENT') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'DEBUG_GIVE_CREDITS', playerId: this.localPlayerId }
        });
        return;
    }
    
    if (this.localPlayerId === 'PLAYER') this.state.credits += 100000;
    else if (this.localPlayerId === 'PLAYER_2') this.state.p2Credits += 100000;
    else if (this.localPlayerId === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + 100000;
    else if (this.localPlayerId === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + 100000;
  }

  public debugSpawnEntity(subType: any, isBuilding = false) {
    const ww = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const wh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const x = -this.state.camera.x + ww / 2;
    const y = -this.state.camera.y + wh / 2;
    const pos = { x, y };

    if (isBuilding) {
      if (this.role === 'CLIENT') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'PLACE_BUILDING', buildingType: subType, position: pos, owner: this.localPlayerId }
        });
      } else {
        this.placeBuildingAt(pos, subType, this.localPlayerId);
      }
    } else {
      if (this.role === 'CLIENT') {
          this.socket.emit('client_command', {
              roomId: this.roomId,
              command: { type: 'SPAWN_UNIT', subType, position: pos, owner: this.localPlayerId }
          });
      } else {
          const entity = {
            id: `${subType}-debug-${Date.now()}`,
            type: 'UNIT',
            subType,
            position: pos,
            health: 1000,
            maxHealth: 1000,
            owner: this.localPlayerId,
            size: 40,
            speed: 2,
          };
          this.state.entities.push(entity as any);
      }
    }
  }

  public debugClearEnemies() {
    if (this.role === 'CLIENT') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'CLEAR_ENEMIES', owner: this.localPlayerId }
        });
        return;
    }
    // Destroy all entities except mine and neutral
    this.state.entities = this.state.entities.filter(e => e.owner === this.localPlayerId || e.owner === 'NEUTRAL');
    
    // Force win check immediately
    this.checkWinLoss();
  }
}
