
import { Vector2, BuildingType } from '../types';
import { getBuildingDimensions } from './getBuildingDimensions';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

class BinaryHeap<T> {
  private heap: T[] = [];
  constructor(private scoreFn: (val: T) => number) {}

  push(element: T) {
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return result;
  }

  get length() {
    return this.heap.length;
  }

  private bubbleUp(n: number) {
    const element = this.heap[n];
    const score = this.scoreFn(element);
    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.heap[parentN];
      if (score >= this.scoreFn(parent)) break;
      this.heap[parentN] = element;
      this.heap[n] = parent;
      n = parentN;
    }
  }

  private sinkDown(n: number) {
    const length = this.heap.length;
    const element = this.heap[n];
    const elemScore = this.scoreFn(element);

    while (true) {
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      let swap: number | null = null;
      let child1Score = 0;

      if (child1N < length) {
        const child1 = this.heap[child1N];
        child1Score = this.scoreFn(child1);
        if (child1Score < elemScore) swap = child1N;
      }
      if (child2N < length) {
        const child2 = this.heap[child2N];
        const child2Score = this.scoreFn(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) swap = child2N;
      }

      if (swap === null) break;
      this.heap[n] = this.heap[swap];
      this.heap[swap] = element;
      n = swap;
    }
  }
}

function hasLineOfSight(p1: Vector2, p2: Vector2, walkableFn: any): boolean {
    const tileSize = 20;
    let x0 = Math.floor(p1.x / tileSize);
    let y0 = Math.floor(p1.y / tileSize);
    const x1 = Math.floor(p2.x / tileSize);
    const y1 = Math.floor(p2.y / tileSize);

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let x = x0;
    let y = y0;
    let n = 1 + dx + dy;
    let x_inc = (x1 > x0) ? 1 : -1;
    let y_inc = (y1 > y0) ? 1 : -1;
    let error = dx - dy;
    dx *= 2;
    dy *= 2;

    for (; n > 0; --n) {
      if (!walkableFn(x, y)) return false;
      if (error > 0) { x += x_inc; error -= dy; } 
      else if (error < 0) { y += y_inc; error += dx; } 
      else { 
        if (!walkableFn(x + x_inc, y) || !walkableFn(x, y + y_inc)) return false;
        x += x_inc; 
        y += y_inc; 
        error -= dy; 
        error += dx; 
        n--; 
      }
    }
    return true;
}

export function calculatePath(this: any, start: Vector2, endRaw: Vector2, entity?: any): Vector2[] {
  const mapTileSize = this.state.map.tileSize;
  const tileSize = 20; // High resolution pathfinding (half tile size)
  const mapWidth = this.state.map.width * (mapTileSize / tileSize);
  const mapHeight = this.state.map.height * (mapTileSize / tileSize);

  const isBigUnit = entity && entity.type === 'UNIT' && !['SOLDIER', 'ENGINEER', 'ATTACK_DOG', 'FLAK_TROOPER', 'TESLA_TROOPER', 'CRAZY_IVAN', 'BORIS', 'DESOLATOR', 'TERRORIST', 'YURI', 'GI', 'ROCKETEER', 'NAVY_SEAL', 'CHRONO_LEGIONNAIRE', 'TANYA', 'SNIPER', 'CHRONO_IVAN', 'SPY', 'YURI_PRIME'].includes(entity.subType);

  const startTile = {
    x: Math.floor(start.x / tileSize),
    y: Math.floor(start.y / tileSize)
  };

  const end = {
    x: Math.max(0, Math.min(this.state.map.width * mapTileSize - 1, endRaw.x)),
    y: Math.max(0, Math.min(this.state.map.height * mapTileSize - 1, endRaw.y))
  };

  const endTile = {
    x: Math.floor(end.x / tileSize),
    y: Math.floor(end.y / tileSize)
  };

  const subType = entity ? entity.subType : null;
  const isAir = entity?.isAir || ['KIROV_AIRSHIP', 'ROCKETEER', 'HARRIER', 'BLACK_EAGLE', 'NIGHT_HAWK_TRANSPORT', 'SIEGE_CHOPPER', 'SPY_PLANE'].includes(subType);
  if (isAir) { return [ { ...end } ]; }

  const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(subType);
  const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(subType);

  let baseGrid = isBigUnit ? this.state.map.bigUnitTerrainGrid : this.state.map.terrainGrid;
  if (isNaval && this.state.map.waterGrid) { baseGrid = this.state.map.waterGrid; } 
  else if (isAmphibious && this.state.map.amphibiousGrid) { baseGrid = this.state.map.amphibiousGrid; }

  const obstacleGrid = this.state.dynamicObstacleGrid;

  const isWalkableBase = (tx: number, ty: number) => {
    if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) return false;
    if (obstacleGrid && obstacleGrid[ty * mapWidth + tx] === 1) return false;
    if (!baseGrid) return false;
    return !!(baseGrid[ty] && baseGrid[ty][tx]);
  };

  const isWalkableForSearch = (tx: number, ty: number) => {
    if (tx === startTile.x && ty === startTile.y) return true;
    return isWalkableBase(tx, ty);
  };

  if (!isWalkableForSearch(endTile.x, endTile.y)) {
    let found = false;
    for (let r = 1; r < 20 && !found; r++) { 
      for (let dy = -r; dy <= r && !found; dy++) {
         for (let dx = -r; dx <= r && !found; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = endTile.x + dx;
            const ny = endTile.y + dy;
            if (isWalkableForSearch(nx, ny)) {
               endTile.x = nx; endTile.y = ny;
               end.x = nx * tileSize + tileSize / 2; end.y = ny * tileSize + tileSize / 2;
               found = true;
            }
         }
      }
    }
  }

  if (!isWalkableForSearch(endTile.x, endTile.y)) return [];
  if (startTile.x === endTile.x && startTile.y === endTile.y) return [{ ...end }];

  const mapSize = mapWidth * mapHeight;
  if (!this.pfNodeStates || this.pfNodeStates.length < mapSize) {
    this.pfNodeStates = new Int8Array(mapSize);
    this.pfBestG = new Float32Array(mapSize);
    this.pfBestH = new Float32Array(mapSize);
    this.pfParents = new Int32Array(mapSize);
  }
  
  const nodeStates = this.pfNodeStates;
  const bestG = this.pfBestG;
  const bestH = this.pfBestH;
  const parents = this.pfParents;
  
  nodeStates.fill(0);
  bestG.fill(Infinity);
  bestH.fill(Infinity);
  parents.fill(-1);

  const startIdx = startTile.y * mapWidth + startTile.x;
  nodeStates[startIdx] = 1;
  bestG[startIdx] = 0;
  
  const sdx = Math.abs(startTile.x - endTile.x);
  const sdy = Math.abs(startTile.y - endTile.y);
  const hWeight = 1.2;
  const startH = (sdx + sdy + (1.414 - 2) * Math.min(sdx, sdy)) * hWeight;
  bestH[startIdx] = startH;

  const openList = new BinaryHeap<number>(idx => bestG[idx] + bestH[idx]);
  openList.push(startIdx);

  let iterations = 0;
  const maxIterations = 25000;
  let bestNodeIdx = startIdx;
  let bestNodeH = startH;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    const currentIdx = openList.pop()!;
    
    if (nodeStates[currentIdx] === 2) continue;
    nodeStates[currentIdx] = 2; // close
    
    const currH = bestH[currentIdx];
    if (currH < bestNodeH) {
      bestNodeH = currH;
      bestNodeIdx = currentIdx;
    }

    const cx = currentIdx % mapWidth;
    const cy = Math.floor(currentIdx / mapWidth);

    if (cx === endTile.x && cy === endTile.y) {
       bestNodeIdx = currentIdx;
       break;
    }

    const dirs = [
      0, 1,   0, -1,   1, 0,  -1, 0,
      1, 1,   1, -1,  -1, 1,  -1, -1
    ];

    for (let i = 0; i < 16; i += 2) {
      const nx = cx + dirs[i];
      const ny = cy + dirs[i+1];
      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;
      
      const nIdx = ny * mapWidth + nx;
      if (nodeStates[nIdx] === 2) continue;
      if (!isWalkableForSearch(nx, ny)) continue;

      if (Math.abs(dirs[i]) === 1 && Math.abs(dirs[i+1]) === 1) {
        if (!isWalkableForSearch(cx, ny) || !isWalkableForSearch(nx, cy)) continue;
      }

      const gScore = bestG[currentIdx] + (Math.abs(dirs[i]) === 1 && Math.abs(dirs[i+1]) === 1 ? 1.4 : 1);
      
      if (nodeStates[nIdx] === 0 || gScore < bestG[nIdx]) {
        const dx = Math.abs(nx - endTile.x);
        const dy = Math.abs(ny - endTile.y);
        const h = (dx + dy + (1.414 - 2) * Math.min(dx, dy)) * hWeight;
        
        parents[nIdx] = currentIdx;
        bestG[nIdx] = gScore;
        bestH[nIdx] = h;
        nodeStates[nIdx] = 1;
        
        openList.push(nIdx);
      }
    }
  }

  const path: Vector2[] = [];
  let currIdx = bestNodeIdx;
  while (currIdx !== -1) {
    const cx = currIdx % mapWidth;
    const cy = Math.floor(currIdx / mapWidth);
    path.push({ x: cx * tileSize + tileSize / 2, y: cy * tileSize + tileSize / 2 });
    currIdx = parents[currIdx];
  }
  path.reverse();
  path[0] = { ...start };
  
  if (path.length > 1) {
    const smoothedPath: Vector2[] = [path[0]];
    let cursorIdx = 0;
    while (cursorIdx < path.length - 1) {
      let furthest = cursorIdx + 1;
      const maxCheck = Math.min(path.length, cursorIdx + 30);
      for (let i = cursorIdx + 2; i < maxCheck; i++) {
        if (hasLineOfSight(path[cursorIdx], path[i], isWalkableForSearch)) {
          furthest = i;
        }
      }
      smoothedPath.push(path[furthest]);
      cursorIdx = furthest;
    }
    
    const lx = bestNodeIdx % mapWidth;
    const ly = Math.floor(bestNodeIdx / mapWidth);
    if (lx === endTile.x && ly === endTile.y) {
       smoothedPath[smoothedPath.length - 1] = { ...end };
    }
    return smoothedPath;
  }
  
  return path;
}

