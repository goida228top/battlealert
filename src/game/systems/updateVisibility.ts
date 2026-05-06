import { GameEngine } from '../GameEngine';
import { getBuildingDimensions } from './getBuildingDimensions';

export function updateVisibility(this: GameEngine): void {
  this.state.visibilityGeneration = (this.state.visibilityGeneration || 0) + 1;
  // Reset visible to explored
  for (let y = 0; y < this.state.map.height; y++) {
    for (let x = 0; x < this.state.map.width; x++) {
      if (this.state.map.visibility[y][x] === 2) {
        this.state.map.visibility[y][x] = 1;
      }
    }
  }

  // Set visible based on player entities
  this.state.entities.forEach(entity => {
    if (entity.owner === this.localPlayerId) {
      const mapTileSize = this.state.map.tileSize;
      
      // Determine effective tile size based on terrain under the center of the entity
      const cx = Math.floor(entity.position.x / mapTileSize);
      const cy = Math.floor(entity.position.y / mapTileSize);
      const isOverMountain = this.state.map.tiles[cy]?.[cx] === 'MOUNTAIN_GRASS';
      const effectiveTileSize = isOverMountain ? mapTileSize * 1.2 : mapTileSize;

      let radius = entity.type === 'BUILDING' ? 6 : 4;
      if (entity.subType === 'PSYCHIC_SENSOR') radius = 15;
      if (entity.subType === 'RADAR' || entity.subType === 'AIR_FORCE_COMMAND') radius = 10;
      if (entity.subType === 'GAP_GENERATOR') radius = 10;

      if (entity.type === 'BUILDING') {
        const dims = getBuildingDimensions(entity.subType as any);
        // Find top-left tile coordinate in the scaled/unscaled grid
        const tx = Math.floor((entity.position.x - (dims.w * effectiveTileSize) / 2) / effectiveTileSize);
        const ty = Math.floor((entity.position.y - (dims.h * effectiveTileSize) / 2) / effectiveTileSize);

        // Visibility rectangle in raw grid coordinates
        const startX = Math.floor((tx * effectiveTileSize) / mapTileSize);
        const endX = Math.floor(((tx + dims.w) * effectiveTileSize - 1) / mapTileSize);
        const startY = Math.floor((ty * effectiveTileSize) / mapTileSize);
        const endY = Math.floor(((ty + dims.h) * effectiveTileSize - 1) / mapTileSize);

        // Reveal area around the entire building rectangle
        for (let ry = startY - radius; ry <= endY + radius; ry++) {
          for (let rx = startX - radius; rx <= endX + radius; rx++) {
            if (rx >= 0 && rx < this.state.map.width && ry >= 0 && ry < this.state.map.height) {
              // Check distance to the rectangle
              const dx = rx < startX ? startX - rx : (rx > endX ? rx - endX : 0);
              const dy = ry < startY ? startY - ry : (ry > endY ? ry - endY : 0);
              if (dx * dx + dy * dy <= radius * radius) {
                this.state.map.visibility[ry][rx] = 2;
              }
            }
          }
        }
      } else {
        // Units remain as points
        const tx = Math.floor(entity.position.x / mapTileSize);
        const ty = Math.floor(entity.position.y / mapTileSize);
        const radiusSq = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = tx + dx;
            const ny = ty + dy;
            if (nx >= 0 && nx < this.state.map.width && ny >= 0 && ny < this.state.map.height) {
              const distSq = dx * dx + dy * dy;
              if (distSq <= radiusSq) {
                this.state.map.visibility[ny][nx] = 2;
              }
            }
          }
        }
      }
    }
  });

  // Apply Gap Generator logic for enemy (hides player vision)
  this.state.entities.forEach(entity => {
    if (entity.owner !== this.localPlayerId && entity.subType === 'GAP_GENERATOR') {
      const mapTileSize = this.state.map.tileSize;
      const cx = Math.floor(entity.position.x / mapTileSize);
      const cy = Math.floor(entity.position.y / mapTileSize);
      const isOverMountain = this.state.map.tiles[cy]?.[cx] === 'MOUNTAIN_GRASS';
      const effectiveTileSize = isOverMountain ? mapTileSize * 1.2 : mapTileSize;

      const radius = 10;
      const dims = getBuildingDimensions('GAP_GENERATOR');
      const tx = Math.round((entity.position.x - (dims.w * effectiveTileSize) / 2) / effectiveTileSize);
      const ty = Math.round((entity.position.y - (dims.h * effectiveTileSize) / 2) / effectiveTileSize);

      const startX = Math.floor((tx * effectiveTileSize) / mapTileSize);
      const endX = Math.floor(((tx + dims.w) * effectiveTileSize - 1) / mapTileSize);
      const startY = Math.floor((ty * effectiveTileSize) / mapTileSize);
      const endY = Math.floor(((ty + dims.h) * effectiveTileSize - 1) / mapTileSize);

      for (let ry = startY - radius; ry <= endY + radius; ry++) {
        for (let rx = startX - radius; rx <= endX + radius; rx++) {
          if (rx >= 0 && rx < this.state.map.width && ry >= 0 && ry < this.state.map.height) {
            const dx = rx < startX ? startX - rx : (rx > endX ? rx - endX : 0);
            const dy = ry < startY ? startY - ry : (ry > endY ? ry - endY : 0);
            if (dx * dx + dy * dy <= radius * radius) {
              this.state.map.visibility[ry][rx] = 0; // Force hidden
            }
          }
        }
      }
    }
  });
}
