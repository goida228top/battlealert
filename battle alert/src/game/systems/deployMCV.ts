
export function deployMCV(this: any, mcvId: string) {
  const mcvIndex = this.state.entities.findIndex((e: any) => e.id === mcvId);
  if (mcvIndex === -1) return;

  const mcv = this.state.entities[mcvIndex];
  if (mcv.subType !== 'MCV' && mcv.subType !== 'ALLIED_MCV') return;

  // Snap to grid (3x3 building)
  const tileSize = this.state.map.tileSize;
  const tx = Math.floor(mcv.position.x / tileSize) - 1;
  const ty = Math.floor(mcv.position.y / tileSize) - 1;
  
  const snappedX = (tx + 1.5) * tileSize;
  const snappedY = (ty + 1.5) * tileSize;

  // Check if area is clear (3x3 area)
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const curX = tx + dx;
      const curY = ty + dy;
      if (curX < 0 || curX >= this.state.map.width || curY < 0 || curY >= this.state.map.height) return;
      const tileType = this.state.map.tiles[curY][curX];
      const visibility = this.state.map.visibility[curY][curX];
      
      if (tileType !== 'GRASS' || visibility === 0) return; // Must be on clean grass and visible/explored
    }
  }

  // Replace MCV with Construction Yard
  this.state.entities.splice(mcvIndex, 1);
  this.state.entities.push({
    id: `base-${Date.now()}`,
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
