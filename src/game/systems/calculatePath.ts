
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
      else { x += x_inc; y += y_inc; error -= dy; error += dx; n--; }
    }
    return true;
}

export function calculatePath(this: any, start: Vector2, endRaw: Vector2, entity?: any): Vector2[] {
  const mapTileSize = this.state.map.tileSize;
  const tileSize = 20; // High resolution pathfinding (half tile size)
  const mapWidth = this.state.map.width * (mapTileSize / tileSize);
  const mapHeight = this.state.map.height * (mapTileSize / tileSize);

  const isBigUnit = entity && entity.type === 'UNIT' && !['SOLDIER', 'ENGINEER', 'ATTACK_DOG', 'FLAK_TROOPER', 'TESLA_TROOPER', 'CRAZY_IVAN', 'BORIS', 'DESOLATOR', 'TERRORIST', 'YURI', 'GI', 'ROCKETEER', 'NAVY_SEAL', 'CHRONO_LEGIONNAIRE', 'TANYA', 'SNIPER', 'CHRONO_IVAN', 'SPY', 'YURI_PRIME'].includes(entity.subType);

  // Convert world coordinates to high-res tile coordinates
  const startTile = {
    x: Math.floor(start.x / tileSize),
    y: Math.floor(start.y / tileSize)
  };

  // Clamp desired end position
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
  
  if (isAir) {
     return [ { ...end } ];
  }

  const isNaval = ['TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT', 'DESTROYER', 'AEGIS_CRUISER', 'AIRCRAFT_CARRIER', 'DOLPHIN'].includes(subType);
  const isAmphibious = ['AMPHIBIOUS_TRANSPORT', 'HOVER_TRANSPORT'].includes(subType);

  // Use pre-calculated terrain grid from state
  let baseGrid = isBigUnit ? this.state.map.bigUnitTerrainGrid : this.state.map.terrainGrid;
  
  if (isNaval && this.state.map.waterGrid) {
     baseGrid = this.state.map.waterGrid;
  } else if (isAmphibious && this.state.map.amphibiousGrid) {
     baseGrid = this.state.map.amphibiousGrid;
  }

  const obstacleGrid = this.state.dynamicObstacleGrid;

  // Pre-calculate bridge walkability once per engine update if needed (or just assume state has it)
  // For now, we'll use a fast lookup.
  const isWalkableBase = (tx: number, ty: number) => {
    if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) return false;
    
    // Check dynamic obstacles (buildings, trees)
    // Amphibious and Naval units might ignore some obstacles, but for now we'll just check it.
    if (obstacleGrid && obstacleGrid[ty * mapWidth + tx] === 1) {
       // Naval units shouldn't be blocked by bridges on water unless the bridge has a pillar, but here it's simple.
       // Actually buildings are added to obstacleGrid. Bridge walkability is separate.
       return false;
    }

    // Bridges should actually be part of the baked walkability if possible.
    // For now we still check but we'll optimize the logic.
    const scale = mapTileSize / tileSize;
    const bridges = this.state.map.bridges || [];
    let onBridge = false;
    let underBridge = false;
    for (let i = 0; i < bridges.length; i++) {
        const b = bridges[i];
        const bx = Math.floor(b.x * scale);
        const by = Math.floor(b.y * scale);
        const bw = Math.floor(b.width * scale);
        const bh = Math.floor(b.height * scale);
        if (tx >= bx && tx < bx + bw && ty >= by && ty < by + bh) {
            onBridge = true;
            underBridge = true;
            const isHorizontal = bw > bh;
            if (isHorizontal) {
                const mid = bh / 2;
                if (ty - by < mid - 1 || ty - by > mid) return false; // railing
            } else {
                const mid = bw / 2;
                if (tx - bx < mid - 1 || tx - bx > mid) return false; // railing
            }
            break;
        }
    }

    if (isNaval) {
       if (underBridge) {
          // ships can pass under bridges if the water grid allows it, ignoring 'onBridge' logic.
          // BUT obstacleGrid might block them if bridge railings are there? We return true if it's pure water underneath.
          // For simplicity, we just lookup baseGrid.
       } else if (onBridge) {
          // Naval units can't walk "on" bridges.
          return false;
       }
    } else if (onBridge) {
       return true;
    }

    if (!baseGrid) return false; // Safety: default to non-walkable if grid is missing
    return !!(baseGrid[ty] && baseGrid[ty][tx]);
  };

  const isWalkableForSearch = (tx: number, ty: number) => {
    // If unit is currently stuck in an obstacle, treat its current tile as walkable
    if (tx === startTile.x && ty === startTile.y) return true;
    return isWalkableBase(tx, ty);
  };

  // If end tile is blocked, find nearest walkable neighbor
  if (!isWalkableForSearch(endTile.x, endTile.y)) {
    let found = false;
    for (let r = 1; r < 20 && !found; r++) { 
      // Spiral/perimeter search
      for (let dy = -r; dy <= r && !found; dy++) {
         for (let dx = -r; dx <= r && !found; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = endTile.x + dx;
            const ny = endTile.y + dy;
            if (isWalkableForSearch(nx, ny)) {
               endTile.x = nx;
               endTile.y = ny;
               end.x = nx * tileSize + tileSize / 2;
               end.y = ny * tileSize + tileSize / 2;
               found = true;
            }
         }
      }
    }
  }

  if (!isWalkableForSearch(endTile.x, endTile.y)) return [];
  if (startTile.x === endTile.x && startTile.y === endTile.y) return [{ ...end }];

  // Efficient A* Binary Heap
  const openList = new BinaryHeap<Node>(n => n.f);
  const mapSize = mapWidth * mapHeight;
  
  if (!this.pfNodeStates || this.pfNodeStates.length < mapSize) {
    this.pfNodeStates = new Int8Array(mapSize);
    this.pfBestG = new Float32Array(mapSize);
  }
  
  const nodeStates = this.pfNodeStates;
  const bestG = this.pfBestG;
  
  nodeStates.fill(0);
  bestG.fill(Infinity);
  
  const startNode: Node = {
    x: startTile.x,
    y: startTile.y,
    g: 0,
    h: 0, // calculated below
    f: 0,
    parent: null
  };
  const sdx = Math.abs(startTile.x - endTile.x);
  const sdy = Math.abs(startTile.y - endTile.y);
  startNode.h = sdx + sdy + (1.414 - 2) * Math.min(sdx, sdy);
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);
  nodeStates[startTile.y * mapWidth + startTile.x] = 1;
  bestG[startTile.y * mapWidth + startTile.x] = 0;

  let iterations = 0;
  const maxIterations = 15000; // Balanced
  let bestNode: Node = startNode;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    const currentNode = openList.pop()!;
    const currentIdx = currentNode.y * mapWidth + currentNode.x;
    
    if (currentNode.h < bestNode.h) {
      bestNode = currentNode;
    }

    if (currentNode.x === endTile.x && currentNode.y === endTile.y) {
       bestNode = currentNode;
       break;
    }

    nodeStates[currentIdx] = 2; // closed

    const dirs = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
    ];

    for (let i = 0; i < dirs.length; i++) {
      const nx = currentNode.x + dirs[i].x;
      const ny = currentNode.y + dirs[i].y;
      const nIdx = ny * mapWidth + nx;

      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;
      if (!isWalkableForSearch(nx, ny)) continue;
      if (nodeStates[nIdx] === 2) continue;

      if (Math.abs(dirs[i].x) === 1 && Math.abs(dirs[i].y) === 1) {
        if (!isWalkableForSearch(currentNode.x, ny) || !isWalkableForSearch(nx, currentNode.y)) continue;
      }

      const gScore = currentNode.g + (Math.abs(dirs[i].x) === 1 && Math.abs(dirs[i].y) === 1 ? 1.4 : 1);
      
      if (nodeStates[nIdx] === 0 || gScore < bestG[nIdx]) {
        const dx = Math.abs(nx - endTile.x);
        const dy = Math.abs(ny - endTile.y);
        const h = dx + dy + (1.414 - 2) * Math.min(dx, dy);
        openList.push({
          x: nx,
          y: ny,
          g: gScore,
          h: h,
          f: gScore + h,
          parent: currentNode
        });
        nodeStates[nIdx] = 1;
        bestG[nIdx] = gScore;
      }
    }
  }

  // Reconstruction
  const path: Vector2[] = [];
  let curr: Node | null = bestNode;
  while (curr) {
    path.push({ x: curr.x * tileSize + tileSize / 2, y: curr.y * tileSize + tileSize / 2 });
    curr = curr.parent;
  }
  path.reverse();
  path[0] = { ...start };
  
  if (path.length > 1) {
    // Smoothing
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
    
    // Only use end if we actually reached it
    if (bestNode.x === endTile.x && bestNode.y === endTile.y) {
       smoothedPath[smoothedPath.length - 1] = { ...end };
    }
    return smoothedPath;
  }
  
  return path;
}

