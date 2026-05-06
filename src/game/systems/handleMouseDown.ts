
import { Vector2, BuildingType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function handleMouseDown(this: any, pos: Vector2, isRightClick: boolean, isCtrlKey: boolean = false) {
  const tileSize = this.state.map.tileSize;
  
  const isPointInEntity = (e: any, p: Vector2) => {
    const zOffset = this.getZOffset ? this.getZOffset(e.position) : 0;
    const renderedPos = { x: e.position.x, y: e.position.y + zOffset };

    if (e.type === 'BUILDING') {
      const dims = getBuildingDimensions(e.subType as BuildingType);
      const w = dims.w * tileSize;
      const h = dims.h * tileSize;
      return p.x >= renderedPos.x - w/2 && p.x <= renderedPos.x + w/2 &&
             p.y >= renderedPos.y - h/2 && p.y <= renderedPos.y + h/2;
    }
    return Math.hypot(renderedPos.x - p.x, renderedPos.y - p.y) < e.size / 1.5; 
  };

  // RMB: Strictly Deselect/Cancel
  if (isRightClick) {
    this.state.placingBuilding = null;
    this.state.interactionMode = 'DEFAULT';
    this.state.entities.forEach((e: any) => e.selected = false);
    return;
  }

  // LMB Actions
  
  // 1. Building Placement
  if (this.state.placingBuilding) {
    const buildType = this.state.placingBuilding;
    const placePos = { ...pos }; // Position to place
    const newBuildingId = `${buildType}-${Date.now()}-${Math.random()}`;
    if (this.role === 'CLIENT' || this.role === 'HOST') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'PLACE_BUILDING', pos: placePos, buildType: buildType, owner: this.localPlayerId, entityId: newBuildingId }
        });
        this.state.placingBuilding = null; // Clear UI state, wait for server
        return;
    } 
    
    // OFFLINE mode execution
    if (this.placeBuildingAt(placePos, buildType, this.localPlayerId, newBuildingId)) {
        this.state.placingBuilding = null;
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
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'SELL_BUILDING', entityId: building.id, owner: this.localPlayerId }});
          this.sellBuilding(building); // Оптимистичное выполнение
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
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'REPAIR_BUILDING', entityId: building.id, owner: this.localPlayerId }});
          if (this.repairBuilding(building)) { // Оптимистичное выполнение
            this.state.effects.push({
              id: `repair-${Date.now()}-${Math.random()}`,
              type: 'MUZZLE_FLASH',
              position: { ...building.position },
              startTime: performance.now(),
              duration: 500,
            });
          }
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
        this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: this.state.interactionMode, pos: { ...pos }, owner: this.localPlayerId }});
        // Оптимистичное выполнение
        if (this.state.interactionMode === 'USE_IRON_CURTAIN') this.useIronCurtain(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_NUCLEAR_STRIKE') this.useNuclearStrike(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_SPY_PLANE') this.useSpyPlane(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_PARATROOPERS') this.useParatroopers(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_WEATHER_STORM') this.useWeatherStorm(pos, this.localPlayerId);
      } else {
        if (this.state.interactionMode === 'USE_IRON_CURTAIN') this.useIronCurtain(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_NUCLEAR_STRIKE') this.useNuclearStrike(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_SPY_PLANE') this.useSpyPlane(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_PARATROOPERS') this.useParatroopers(pos, this.localPlayerId);
        if (this.state.interactionMode === 'USE_WEATHER_STORM') this.useWeatherStorm(pos, this.localPlayerId);
      }
      this.state.interactionMode = 'DEFAULT';
      return;
    }

    if (this.state.interactionMode === 'USE_CHRONOSPHERE') {
      if ((this as any).chronosphereSelection) {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: 'USE_CHRONOSPHERE_EXECUTE', pos: { ...pos }, selectionObj: (this as any).chronosphereSelection, owner: this.localPlayerId }});
          this.executeChronosphereTeleport(pos, this.localPlayerId); // Оптимистично
          (this as any).chronosphereSelection = null;
        } else {
          this.executeChronosphereTeleport(pos, this.localPlayerId);
        }
      } else {
        if (this.role === 'CLIENT') {
          this.socket.emit('client_command', { roomId: this.roomId, command: { type: 'USE_ABILITY', ability: 'USE_CHRONOSPHERE_SELECT', pos: { ...pos }, owner: this.localPlayerId }});
          // Optimistically set selection locally because the user expects visual feedback. But it might be overwritten.
          // Wait, chronosphere doesn't have visual feedback, it just selects. Let's just run it:
          this.useChronosphere(pos, this.localPlayerId);
        } else {
          this.useChronosphere(pos, this.localPlayerId);
        }
      }
      return;
    }
  }

  // 3. Selection or Orders
  const clickedEntity = this.state.entities.find((e: any) => 
    isPointInEntity(e, pos) && 
    e.subType !== 'TREE' && 
    e.subType !== 'MOUNTAIN'
  );

  const selectedUnits = this.state.entities.filter((e: any) => e.selected && e.owner === this.localPlayerId && e.type === 'UNIT');
  const selectedBuildings = this.state.entities.filter((e: any) => e.selected && e.owner === this.localPlayerId && e.type === 'BUILDING');

  // If we have units selected and we click on ground or enemy -> Give Order
  // Support both left click (if interaction mode is default) and potentially right click logic if we want, 
  // but for now let's ensure the existing logic works in OFFLINE mode.
  if (selectedUnits.length > 0) {
    const isEnemy = clickedEntity && clickedEntity.owner !== this.localPlayerId;
    const isForceAttack = isCtrlKey;
    const isEngineerAction = clickedEntity && clickedEntity.type === 'BUILDING' && selectedUnits.some((u: any) => u.subType === 'ENGINEER');
    const isServiceDepotAction = clickedEntity && clickedEntity.owner === this.localPlayerId && (clickedEntity.subType === 'SERVICE_DEPOT' || clickedEntity.subType === 'ALLIED_NAVAL_YARD' || clickedEntity.subType === 'NAVAL_YARD');

    // Check if the target position is walkable terrain
    const isWalkable = (p: Vector2) => {
      const tx = Math.floor(p.x / tileSize);
      const ty = Math.floor(p.y / tileSize);
      if (ty >= 0 && ty < this.state.map.height && tx >= 0 && tx < this.state.map.width) {
        const tType = this.state.map.tiles[ty][tx];
        if (tType === 'WATER' || tType === 'WATER_TO_GRASS' || tType === 'GRASS_TO_WATER' || tType.startsWith('CLIFF')) { // Water and cliffs are generally blocked
          // Check if on bridge
          let onBridge = false;
          let hitsRailing = false;
          this.state.map.bridges.forEach((b: any) => {
             const bx = b.x * tileSize;
             const by = b.y * tileSize;
             const bw = b.width * tileSize;
             const bh = b.height * tileSize;
             if (p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh) {
                onBridge = true;
                if (bw > bh) {
                  if (p.y < by + bh / 2 - 20 || p.y > by + bh / 2 + 20) hitsRailing = true;
                } else {
                  if (p.x < bx + bw / 2 - 20 || p.x > bx + bw / 2 + 20) hitsRailing = true;
                }
             }
          });
          return onBridge && !hitsRailing;
        }
      }
      return true;
    };

    if (!clickedEntity || isEnemy || isForceAttack || isEngineerAction || isServiceDepotAction) {
      if (!clickedEntity) {
        this.state.moveMarkers.push({ position: { ...pos }, startTime: performance.now() });
      }

      selectedUnits.forEach((entity: any) => {
        const responses = clickedEntity && isEnemy ? ['Target acquired', 'Attacking', 'Destroy!'] : ['Moving', 'Affirmative', 'Yes, sir!'];
        entity.selectionResponse = responses[Math.floor(Math.random() * responses.length)];
        entity.selectionResponseTime = performance.now();
      });

      if (this.role === 'CLIENT' || this.role === 'HOST') {
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

      // OFFLINE mode execution (or SERVER)
      if (clickedEntity && isEnemy) {
          selectedUnits.forEach((u: any) => {
              u.targetId = clickedEntity.id;
              u.explicitAttack = true;
              u.targetPosition = undefined;
              u.path = undefined;
          });
      } else if (clickedEntity && isEngineerAction) {
          selectedUnits.forEach((u: any) => {
              if (u.subType === 'ENGINEER') {
                u.targetId = clickedEntity.id;
                u.targetPosition = undefined;
              }
          });
      } else if (clickedEntity && isServiceDepotAction) {
          selectedUnits.forEach((u: any) => {
              this.issueMoveOrder([u], clickedEntity.position);
              u.targetId = clickedEntity.id; // set after so it's not cleared
              u.isRepairing = true; // unit knows it wants to repair
          });
      } else {
          this.issueMoveOrder(selectedUnits, pos);
          selectedUnits.forEach((u: any) => {
              u.explicitAttack = false;
              u.targetId = undefined;
          });
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
      if (this.role === 'CLIENT' || this.role === 'HOST') {
        this.socket.emit('client_command', {
            roomId: this.roomId,
            command: { type: 'SET_RALLY_POINT', buildingIds: prodBuildings.map((b:any) => b.id), pos: { ...pos }, owner: this.localPlayerId }
        });
        this.state.moveMarkers.push({ position: { ...pos }, startTime: performance.now() });
        return;
      }
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
