
import { Vector2, BuildingType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function handleMouseDown(this: any, pos: Vector2, isRightClick: boolean, isCtrlKey: boolean = false) {
  const tileSize = this.state.map.tileSize;
  
  const isPointInEntity = (e: any, p: Vector2) => {
    if (e.type === 'BUILDING') {
      const dims = getBuildingDimensions(e.subType as BuildingType);
      const w = dims.w * tileSize;
      const h = dims.h * tileSize;
      return p.x >= e.position.x - w/2 && p.x <= e.position.x + w/2 &&
             p.y >= e.position.y - h/2 && p.y <= e.position.y + h/2;
    }
    return Math.hypot(e.position.x - p.x, e.position.y - p.y) < e.size / 1.5; // Slightly more generous than radius for units
  };

  // RMB: Cancel or Deselect
  if (isRightClick) {
    if (this.state.placingBuilding) {
      const cost = this.getCost(this.state.placingBuilding);
      this.state.credits += cost;
      this.state.placingBuilding = null;
    } else {
      // Deselect all
      this.state.entities.forEach((e: any) => e.selected = false);
    }
    this.state.interactionMode = 'DEFAULT';
    return;
  }

  // LMB Actions
  
  // 1. Building Placement
  if (this.state.placingBuilding) {
    const buildType = this.state.placingBuilding;
    const placePos = { ...pos }; // Position to place
    if (this.role === 'CLIENT') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'PLACE_BUILDING', pos: placePos, buildType: buildType, owner: this.localPlayerId }
        });
        this.startPlacing(null);
    } else {
        this.placeBuilding(pos);
    }
    return;
  }

  // 2. Special Interaction Modes (SELL, REPAIR, ABILITIES)
  if (this.state.interactionMode !== 'DEFAULT') {
    if (this.state.interactionMode === 'SELL') {
      const building = this.state.entities.find((e: any) => 
        e.owner === this.localPlayerId && e.type === 'BUILDING' && isPointInEntity(e, pos)
      );
      if (building) {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'SELL_BUILDING', entityId: building.id }});
        } else {
          this.sellBuilding(building);
        }
        this.state.interactionMode = 'DEFAULT';
        return;
      }
    }

    if (this.state.interactionMode === 'REPAIR') {
      const building = this.state.entities.find((e: any) => 
        e.owner === this.localPlayerId && e.type === 'BUILDING' && isPointInEntity(e, pos)
      );
      if (building) {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'REPAIR_BUILDING', entityId: building.id }});
        } else {
          if (this.repairBuilding(building)) {
            this.state.effects.push({
              id: `repair-${Date.now()}-${Math.random()}`,
              type: 'MUZZLE_FLASH',
              position: { ...building.position },
              startTime: performance.now(),
              duration: 500,
            });
          }
        }
        if (building.health >= building.maxHealth) {
          this.state.interactionMode = 'DEFAULT';
        }
        return;
      }
    }

    // Ability targeting
    const abilityModes = ['USE_IRON_CURTAIN', 'USE_NUCLEAR_STRIKE', 'USE_SPY_PLANE', 'USE_PARATROOPERS', 'USE_WEATHER_STORM'];
    if (abilityModes.includes(this.state.interactionMode)) {
      if (this.role === 'CLIENT') {
        this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: this.state.interactionMode, pos: { ...pos } }});
      } else {
        if (this.state.interactionMode === 'USE_IRON_CURTAIN') this.useIronCurtain(pos);
        if (this.state.interactionMode === 'USE_NUCLEAR_STRIKE') this.useNuclearStrike(pos);
        if (this.state.interactionMode === 'USE_SPY_PLANE') this.useSpyPlane(pos);
        if (this.state.interactionMode === 'USE_PARATROOPERS') this.useParatroopers(pos);
        if (this.state.interactionMode === 'USE_WEATHER_STORM') this.useWeatherStorm(pos);
      }
      this.state.interactionMode = 'DEFAULT';
      return;
    }

    if (this.state.interactionMode === 'USE_CHRONOSPHERE') {
      if ((this as any).chronosphereSelection) {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: 'USE_CHRONOSPHERE_EXECUTE', pos: { ...pos }, selectionObj: (this as any).chronosphereSelection }});
          (this as any).chronosphereSelection = null;
        } else {
          this.executeChronosphereTeleport(pos);
        }
      } else {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: 'USE_CHRONOSPHERE_SELECT', pos: { ...pos } }});
          // Optimistically set selection locally because the user expects visual feedback. But it might be overwritten.
          // Wait, chronosphere doesn't have visual feedback, it just selects. Let's just run it:
          this.useChronosphere(pos);
        } else {
          this.useChronosphere(pos);
        }
      }
      return;
    }
  }

  // 3. Selection or Orders
  const clickedEntity = this.state.entities.find((e: any) => isPointInEntity(e, pos));

  const selectedUnits = this.state.entities.filter((e: any) => e.selected && e.owner === this.localPlayerId && e.type === 'UNIT');
  const selectedBuildings = this.state.entities.filter((e: any) => e.selected && e.owner === this.localPlayerId && e.type === 'BUILDING');

  // If we have units selected and we click on ground or enemy -> Give Order
  if (selectedUnits.length > 0) {
    const isEnemy = clickedEntity && clickedEntity.owner !== this.localPlayerId;
    const isForceAttack = isCtrlKey;
    const isEngineerAction = clickedEntity && clickedEntity.type === 'BUILDING' && selectedUnits.some((u: any) => u.subType === 'ENGINEER');

    if (!clickedEntity || isEnemy || isForceAttack || isEngineerAction) {
      if (!clickedEntity) {
        this.state.moveMarkers.push({ position: { ...pos }, startTime: performance.now() });
      }

      selectedUnits.forEach((entity: any) => {
        const responses = clickedEntity && isEnemy ? ['Target acquired', 'Attacking', 'Destroy!'] : ['Moving', 'Affirmative', 'Yes, sir!'];
        entity.selectionResponse = responses[Math.floor(Math.random() * responses.length)];
        entity.selectionResponseTime = performance.now();
      });

      if (this.role === 'CLIENT') {
          this.socket.emit('client_command', {
              roomId: this.roomId,
              command: {
                  type: 'MOVE_OR_ATTACK',
                  unitIds: selectedUnits.map((u:any) => u.id),
                  targetPos: !clickedEntity ? pos : undefined,
                  targetId: clickedEntity ? clickedEntity.id : undefined
              }
          });
          return;
      }

      if (clickedEntity && (isEnemy || isForceAttack || isEngineerAction)) {
          selectedUnits.forEach((u: any) => {
              u.targetId = clickedEntity.id;
              u.explicitAttack = true;
              u.path = undefined;
              u.targetPosition = undefined;
          });
      } else {
          this.issueMoveOrder(selectedUnits, pos);
          selectedUnits.forEach((u: any) => { u.explicitAttack = false; u.targetId = undefined; });
      }

      return;
    }
  }

  // If we have buildings selected and click on ground -> Set Rally Point
  if (selectedBuildings.length > 0 && !clickedEntity) {
    const prodBuildings = selectedBuildings.filter((b: any) => 
      ['BARRACKS', 'ALLIED_BARRACKS', 'WAR_FACTORY', 'ALLIED_WAR_FACTORY', 'NAVAL_YARD', 'ALLIED_NAVAL_YARD', 'AIR_FORCE_COMMAND'].includes(b.subType || '')
    );
    if (prodBuildings.length > 0) {
      prodBuildings.forEach((b: any) => b.rallyPoint = { ...pos });
      this.state.moveMarkers.push({ position: { ...pos }, startTime: performance.now() });
      return;
    }
  }

  // 4. If we click on a friendly entity -> Select it
  if (clickedEntity && clickedEntity.owner === this.localPlayerId) {
    const now = performance.now();
    const isDoubleClick = clickedEntity.id === this.lastClickedEntityId && (now - this.lastClickTime) < 300;
    
    this.lastClickTime = now;
    this.lastClickedEntityId = clickedEntity.id;

    if (isDoubleClick) {
      if (clickedEntity.subType === 'MCV' || clickedEntity.subType === 'ALLIED_MCV') {
        this.deployMCV(clickedEntity.id);
        return;
      }
      if (clickedEntity.subType === 'CONSTRUCTION_YARD' || clickedEntity.subType === 'ALLIED_CONSTRUCTION_YARD') {
        this.undeployConstructionYard(clickedEntity.id);
        return;
      }
    }

    if (clickedEntity.type === 'UNIT') {
      if (!isCtrlKey) {
        this.state.entities.forEach((e: any) => e.selected = false);
      }
      clickedEntity.selected = true;
    }
    return;
  }

  // 5. Otherwise -> Start Selection Box
  this.state.selectionBox = { start: { ...pos }, end: { ...pos } };
}
