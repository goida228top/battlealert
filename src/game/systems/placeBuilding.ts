import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

export function placeBuilding(this: GameEngine, pos: Vector2, serverEntityId?: string): void {
  if (!this.state.placingBuilding) return;

  const type = this.state.placingBuilding;
  const tileSize = this.state.map.tileSize;
  const dims = getBuildingDimensions(type);

  // Determine effective tile size (the "step") based on terrain at target position
  const baseTx = Math.floor(pos.x / tileSize);
  const baseTy = Math.floor(pos.y / tileSize);
  const isOverMountain = this.state.map.tiles[baseTy]?.[baseTx] === 'MOUNTAIN_GRASS';
  const effectiveTileSize = isOverMountain ? tileSize * 1.2 : tileSize;

  // Calculate top-left tile based on mouse position using the scaled step
  const tx = Math.floor((pos.x - (dims.w * effectiveTileSize) / 2) / effectiveTileSize);
  const ty = Math.floor((pos.y - (dims.h * effectiveTileSize) / 2) / effectiveTileSize);

  // Determine the bounding box in raw tile coordinates
  const startTileX = Math.floor((tx * effectiveTileSize) / tileSize);
  const endTileX = Math.floor(((tx + dims.w) * effectiveTileSize - 1) / tileSize);
  const startTileY = Math.floor((ty * effectiveTileSize) / tileSize);
  const endTileY = Math.floor(((ty + dims.h) * effectiveTileSize - 1) / tileSize);

  // 1. Bounds and Terrain Check for ALL tiles
  let baseElevation: 'GROUND' | 'PLATEAU' | 'MOUNTAIN_PLATEAU' | null = null;
  for (let ry = startTileY; ry <= endTileY; ry++) {
    for (let rx = startTileX; rx <= endTileX; rx++) {
      if (rx < 0 || rx >= this.state.map.width || ry < 0 || ry >= this.state.map.height) {
        return; // Out of bounds
      }

      const tileType = this.state.map.tiles[ry][rx];
      const visibility = this.state.map.visibility[ry][rx];
      
      const isFoggy = !this.state.debugFlags?.disableFog && visibility === 0;
      if (tileType === 'WATER' || tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER' || tileType === 'ORE' || tileType.startsWith('CLIFF') || tileType.startsWith('RAMP_') || isFoggy || tileType === 'MOUNTAIN_DECOR') {
        return; // Cannot build on blocked terrain or fog
      }

      // Block bridges
      const onBridge = this.state.map.bridges.some((b: any) => {
        return rx >= b.x && rx < b.x + b.width && ry >= b.y && ry < b.y + b.height;
      });
      if (onBridge) return;

      // Check elevation consistency
      const curElevation = (tileType === 'MOUNTAIN_GRASS') ? 'MOUNTAIN_PLATEAU' : ((tileType === 'ELEVATED_GRASS') ? 'PLATEAU' : 'GROUND');
      if (baseElevation === null) {
        baseElevation = curElevation;
      } else if (baseElevation !== curElevation) {
        return; // Building must be on uniform terrain level
      }
    }
  }

  // Calculate snapped center position using the scaled step
  const snappedX = (tx + dims.w / 2) * effectiveTileSize;
  const snappedY = (ty + dims.h / 2) * effectiveTileSize;
  const snappedPos = { x: snappedX, y: snappedY };

  // 2. Collision Check with other buildings
  const collision = this.state.entities.find(e => {
    if (e.type !== 'BUILDING') return false;
    const eDims = getBuildingDimensions(e.subType as BuildingType);
    
    // Check for overlap using effective sizes
    const rect1 = {
      left: snappedX - (dims.w * effectiveTileSize) / 2,
      top: snappedY - (dims.h * effectiveTileSize) / 2,
      right: snappedX + (dims.w * effectiveTileSize) / 2,
      bottom: snappedY + (dims.h * effectiveTileSize) / 2
    };
    
    // Existing building effective size
    const ebTx = Math.floor(e.position.x / tileSize);
    const ebTy = Math.floor(e.position.y / tileSize);
    const eScale = this.state.map.tiles[ebTy]?.[ebTx] === 'MOUNTAIN_GRASS' ? 1.2 : 1.0;
    const eEffectiveTileSize = tileSize * eScale;

    const rect2 = {
      left: e.position.x - (eDims.w * eEffectiveTileSize) / 2,
      top: e.position.y - (eDims.h * eEffectiveTileSize) / 2,
      right: e.position.x + (eDims.w * eEffectiveTileSize) / 2,
      bottom: e.position.y + (eDims.h * eEffectiveTileSize) / 2
    };

    return !(rect1.right <= rect2.left || 
             rect1.left >= rect2.right || 
             rect1.bottom <= rect2.top || 
             rect1.top >= rect2.bottom);
  });
  
  if (collision) return;

  // 3. Proximity Check (Build range)
  const friendlyBuildings = this.state.entities.filter(e => e.type === 'BUILDING' && e.owner === this.localPlayerId);
  if (friendlyBuildings.length > 0) {
    const nearBuilding = friendlyBuildings.find(b => {
      const dist = Math.hypot(b.position.x - snappedPos.x, b.position.y - snappedPos.y);
      return dist < 400; // Increased build range for larger maps
    });
    if (!nearBuilding) return;
  }

  // No cost check here, it was already paid in startProduction

  let health = 2000;
  let size = dims.w * tileSize; // Use visual size based on tiles
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

  const finalEntityId = serverEntityId || `${type}-${Date.now()}-${Math.random()}`;
  
  const entity: Entity = {
    id: finalEntityId,
    type: 'BUILDING',
    subType: type,
    position: snappedPos,
    health,
    maxHealth: health,
    owner: this.localPlayerId,
    size,
    constructionStartTime: performance.now(),
  };

  // 4. Find the item in the queue and remove it WITHOUT refunding
  // (We use this.localPlayerId here since placeBuilding was originally designed for client, 
  // but in server-auth we know the owner is passed correctly or managed correctly).
  // Actually, wait, `this.localPlayerId` in placeBuilding.ts might be 'PLAYER' or whatever was set.
  // When called via `executeRemoteCommand`, `this.localPlayerId` is NOT set to the command owner!
  // Wait, `executeRemoteCommand` calls `placeBuildingAt(cmd.pos, cmd.buildType, cmd.owner, cmd.entityId)`
  // But `placeBuilding` is called from handling placing locally.
  // In `GameEngine.ts` `executeRemoteCommand`: 
  // `else if (cmd.type === 'PLACE_BUILDING') { this.placeBuildingAt(cmd.pos, cmd.buildType, cmd.owner, cmd.entityId); }`
  
  // So `placeBuilding.ts` is ONLY used locally on the CLIENT for optimistic UI? No, we removed optimistic UI.
  // Wait! If optimistic UI is removed, `placeBuilding.ts` is NEVER CALLED ANYMORE!
  // Let's check `handleMouseDown.ts`:
  // it used to call `this.placeBuilding(pos)` but I removed it!
  // Wait, did I remove it? 
  // Yes:
  // ```
  // if (this.role === 'CLIENT' || this.role === 'HOST') {
  //   this.socket.emit('client_command', { ... type: 'PLACE_BUILDING' })
  //   this.state.placingBuilding = null;
  //   return;
  // }
  // ```
  // Since `this.role === 'SERVER'` on the server, what happens when it receives `PLACE_BUILDING`?
  // `executeRemoteCommand` calls `placeBuildingAt` !!
  // So `placeBuilding.ts` is literally DEAD CODE now!
  // Let's verify `placeBuildingAt.ts` !!!
}
