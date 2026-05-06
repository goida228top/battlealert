
import { Vector2 } from '../types';

export function screenToWorld(this: any, pos: Vector2): Vector2 {
  const rawX = (pos.x - (this.state?.camera?.x || 0)) / (this.state?.camera?.zoom || 1);
  const rawY = (pos.y - (this.state?.camera?.y || 0)) / (this.state?.camera?.zoom || 1);
  
  if (!this.state || !this.state.map || !this.state.map.tiles) {
     return { x: rawX, y: rawY };
  }

  const PLATEAU_H = 30;
  const tileSize = this.state.map.tileSize;
  
  const checkY = rawY + PLATEAU_H;
  const tx = Math.floor(rawX / tileSize);
  const ty = Math.floor(checkY / tileSize);

  if (ty >= 0 && ty < this.state.map.height && tx >= 0 && tx < this.state.map.width) {
     const tType = this.state.map.tiles[ty][tx];
     if (tType === 'ELEVATED_GRASS' || tType.startsWith('CLIFF_')) {
         return { x: rawX, y: rawY + PLATEAU_H };
     } else if (tType === 'RAMP_N') {
         const pct = (checkY % tileSize) / tileSize;
         return { x: rawX, y: rawY + PLATEAU_H * pct };
     } else if (tType === 'RAMP_S') {
         const pct = (checkY % tileSize) / tileSize;
         return { x: rawX, y: rawY + PLATEAU_H * (1 - pct) };
     } else if (tType === 'RAMP_E') {
         const pct = (rawX % tileSize) / tileSize;
         return { x: rawX, y: rawY + PLATEAU_H * (1 - pct) };
     } else if (tType === 'RAMP_W') {
         const pct = (rawX % tileSize) / tileSize;
         return { x: rawX, y: rawY + PLATEAU_H * pct };
     }
  }

  return { x: rawX, y: rawY };
}
