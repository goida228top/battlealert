
import { getBuildingDimensions } from './getBuildingDimensions';

export function deployMCV(this: any, mcvId: string, providedBaseId?: string) {
  const baseId = providedBaseId || `base-${Date.now()}-${Math.random()}`;
  
  if (this.role === 'CLIENT' || this.role === 'HOST') {
      this.socket.emit('client_command', {
          roomId: this.roomId,
          command: { type: 'DEPLOY_MCV', mcvId, baseId }
      });
      return; // Только отправляем команду
  }

  const mcvIndex = this.state.entities.findIndex((e: any) => e.id === mcvId);
  if (mcvIndex === -1) return;

  const mcv = this.state.entities[mcvIndex];
  if (mcv.subType !== 'MCV' && mcv.subType !== 'ALLIED_MCV') return;

  // Snap to grid (3x3 building)
  const tileSize = this.state.map.tileSize;

  // Determine effective tile size (the "step") based on terrain under cursor
  const baseTx = Math.floor(mcv.position.x / tileSize);
  const baseTy = Math.floor(mcv.position.y / tileSize);
  const isOverMountain = this.state.map.tiles[baseTy]?.[baseTx] === 'MOUNTAIN_GRASS';
  const effectiveTileSize = isOverMountain ? tileSize * 1.2 : tileSize;

  const tx = Math.floor(mcv.position.x / effectiveTileSize) - 1;
  const ty = Math.floor(mcv.position.y / effectiveTileSize) - 1;
  
  // Determine the bounding box in raw tile coordinates (3x3 area)
  const startTileX = Math.floor((tx * effectiveTileSize) / tileSize);
  const endTileX = Math.floor(((tx + 3) * effectiveTileSize - 1) / tileSize);
  const startTileY = Math.floor((ty * effectiveTileSize) / tileSize);
  const endTileY = Math.floor(((ty + 3) * effectiveTileSize - 1) / tileSize);

  const snappedX = (tx + 1.5) * effectiveTileSize;
  const snappedY = (ty + 1.5) * effectiveTileSize;

  // Check if area is clear (3x3 area)
  let baseElevation: 'GROUND' | 'PLATEAU' | 'MOUNTAIN_PLATEAU' | null = null;
  
  for (let ry = startTileY; ry <= endTileY; ry++) {
    for (let rx = startTileX; rx <= endTileX; rx++) {
      if (rx < 0 || rx >= this.state.map.width || ry < 0 || ry >= this.state.map.height) return;
      const tileType = this.state.map.tiles[ry][rx];
      const visibility = this.state.map.visibility[ry][rx];

      const isFoggy = !this.state.debugFlags?.disableFog && visibility === 0;
      
      // Allow deployment on GRASS and ELEVATED_GRASS, but disallow WATER, ORE, CLIFFS, RAMPS
      if (tileType === 'WATER' || tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER' || tileType === 'ORE' || tileType.startsWith('CLIFF') || tileType.startsWith('RAMP_') || tileType === 'MOUNTAIN_DECOR' || isFoggy) return; 

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
        return; // MCV must deploy on uniform terrain level
      }
    }
  }
  
  // Overlap Check (Trees, Buildings)
  const margin = 5;
  const bounds = {
    minX: snappedX - (3 * effectiveTileSize) / 2 + margin,
    maxX: snappedX + (3 * effectiveTileSize) / 2 - margin,
    minY: snappedY - (3 * effectiveTileSize) / 2 + margin,
    maxY: snappedY + (3 * effectiveTileSize) / 2 - margin
  };

  const hasOverlap = this.state.entities.some((e: any) => {
    if (e.id === mcvId) return false;
    if (e.type !== 'BUILDING') return false; // Ignore units, assuming they'll move or get squashed
    const eDims = getBuildingDimensions(e.subType);

    // Dynamic scale for existing buildings
    const ebTx = Math.floor(e.position.x / tileSize);
    const ebTy = Math.floor(e.position.y / tileSize);
    const eScale = this.state.map.tiles[ebTy]?.[ebTx] === 'MOUNTAIN_GRASS' ? 1.2 : 1.0;
    const eEffectiveTileSize = tileSize * eScale;

    const eBounds = {
      minX: e.position.x - (eDims.w * eEffectiveTileSize) / 2 + margin,
      maxX: e.position.x + (eDims.w * eEffectiveTileSize) / 2 - margin,
      minY: e.position.y - (eDims.h * eEffectiveTileSize) / 2 + margin,
      maxY: e.position.y + (eDims.h * eEffectiveTileSize) / 2 - margin
    };
    return !(bounds.maxX < eBounds.minX || bounds.minX > eBounds.maxX || bounds.maxY < eBounds.minY || bounds.minY > eBounds.maxY);
  });

  if (hasOverlap) return;

  // Replace MCV with Construction Yard
  this.state.entities.splice(mcvIndex, 1);
  this.state.entities.push({
    id: baseId,
    type: 'BUILDING',
    subType: mcv.subType === 'ALLIED_MCV' ? 'ALLIED_CONSTRUCTION_YARD' : 'CONSTRUCTION_YARD',
    position: { x: snappedX, y: snappedY },
    health: mcv.health,
    maxHealth: mcv.maxHealth,
    owner: mcv.owner,
    size: 120, // 3x3 tiles
    selected: true,
  });

  this.lastClickTime = 0;
  this.lastClickedEntityId = null;
}
