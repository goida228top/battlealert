
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

export function calculatePath(this: any, start: Vector2, end: Vector2): Vector2[] {
  const tileSize = this.state.map.tileSize;
  const mapWidth = this.state.map.width;
  const mapHeight = this.state.map.height;

  // Convert world coordinates to tile coordinates
  const startTile = {
    x: Math.floor(start.x / tileSize),
    y: Math.floor(start.y / tileSize)
  };
  const endTile = {
    x: Math.floor(end.x / tileSize),
    y: Math.floor(end.y / tileSize)
  };

  // Clamp to map bounds
  startTile.x = Math.max(0, Math.min(mapWidth - 1, startTile.x));
  startTile.y = Math.max(0, Math.min(mapHeight - 1, startTile.y));
  endTile.x = Math.max(0, Math.min(mapWidth - 1, endTile.x));
  endTile.y = Math.max(0, Math.min(mapHeight - 1, endTile.y));

  // If start and end are the same tile, just return the end position
  if (startTile.x === endTile.x && startTile.y === endTile.y) {
    return [{ ...end }];
  }

  // Create a grid of obstacles
  const grid: boolean[][] = [];
  for (let y = 0; y < mapHeight; y++) {
    grid[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      const tileType = this.state.map.tiles[y][x];
      // Basic terrain check
      let isWalkable = tileType === 'GRASS' || tileType === 'ORE' || tileType === 'GRASS_TO_WATER' || tileType === 'WATER_TO_GRASS';
      grid[y][x] = isWalkable;
    }
  }

  // Mark bridges as walkable
  this.state.map.bridges.forEach((bridge: any) => {
    for (let dy = 0; dy < bridge.height; dy++) {
      for (let dx = 0; dx < bridge.width; dx++) {
        const bx = bridge.x + dx;
        const by = bridge.y + dy;
        if (bx >= 0 && bx < mapWidth && by >= 0 && by < mapHeight) {
          grid[by][bx] = true;
        }
      }
    }
  });

  // Mark buildings as obstacles
  this.state.entities.forEach((entity: any) => {
    if (entity.type === 'BUILDING' && entity.health > 0) {
      const dims = getBuildingDimensions(entity.subType as BuildingType);
      const tx = Math.floor((entity.position.x - (dims.w * tileSize) / 2) / tileSize);
      const ty = Math.floor((entity.position.y - (dims.h * tileSize) / 2) / tileSize);
      
      for (let dy = 0; dy < dims.h; dy++) {
        for (let dx = 0; dx < dims.w; dx++) {
          const curX = tx + dx;
          const curY = ty + dy;
          if (curX >= 0 && curX < mapWidth && curY >= 0 && curY < mapHeight) {
            grid[curY][curX] = false;
          }
        }
      }
    }
  });

  // Ensure start and end tiles are walkable for the algorithm to work
  // (In case a unit is somehow stuck inside a building)
  grid[startTile.y][startTile.x] = true;
  grid[endTile.y][endTile.x] = true;

  // A* Implementation
  const openList: Node[] = [];
  const closedList = new Set<string>();

  const startNode: Node = {
    x: startTile.x,
    y: startTile.y,
    g: 0,
    h: Math.abs(startTile.x - endTile.x) + Math.abs(startTile.y - endTile.y),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  let iterations = 0;
  const maxIterations = 2000; // Increased for 100x60 map

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort by f value
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;
    
    if (currentNode.x === endTile.x && currentNode.y === endTile.y) {
      // Path found!
      const path: Vector2[] = [];
      let curr: Node | null = currentNode;
      while (curr) {
        path.push({ x: curr.x * tileSize + tileSize / 2, y: curr.y * tileSize + tileSize / 2 });
        curr = curr.parent;
      }
      path.reverse();
      
      // Replace the first point with the exact start position to prevent initial jerk
      if (path.length > 0) {
        path[0] = { ...start };
      }
      
      // Path Smoothing (String Pulling)
      const hasLineOfSight = (p1: Vector2, p2: Vector2): boolean => {
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
          if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight || !grid[y][x]) {
            return false;
          }
          if (error > 0) {
            x += x_inc;
            error -= dy;
          } else if (error < 0) {
            y += y_inc;
            error += dx;
          } else {
            // error == 0, move diagonally
            x += x_inc;
            y += y_inc;
            error -= dy;
            error += dx;
            n--;
          }
        }
        return true;
      };

      const smoothedPath: Vector2[] = [path[0]];
      let currentIdx = 0;
      while (currentIdx < path.length - 1) {
        let furthest = currentIdx + 1;
        for (let i = currentIdx + 2; i < path.length; i++) {
          if (hasLineOfSight(path[currentIdx], path[i])) {
            furthest = i;
          }
        }
        smoothedPath.push(path[furthest]);
        currentIdx = furthest;
      }

      // Replace the last point with the exact target position
      if (smoothedPath.length > 0) {
        smoothedPath[smoothedPath.length - 1] = { ...end };
      }
      return smoothedPath;
    }

    closedList.add(`${currentNode.x},${currentNode.y}`);

    // Neighbors (8 directions)
    const neighbors = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
    ];

    for (const neighbor of neighbors) {
      const nx = currentNode.x + neighbor.x;
      const ny = currentNode.y + neighbor.y;

      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;
      if (!grid[ny][nx]) continue;
      if (closedList.has(`${nx},${ny}`)) continue;

      // Diagonal movement check (prevent cutting corners of obstacles)
      if (Math.abs(neighbor.x) === 1 && Math.abs(neighbor.y) === 1) {
        if (!grid[currentNode.y][nx] || !grid[ny][currentNode.x]) continue;
      }

      const gScore = currentNode.g + (Math.abs(neighbor.x) === 1 && Math.abs(neighbor.y) === 1 ? 1.4 : 1);
      const existingOpen = openList.find(n => n.x === nx && n.y === ny);

      if (!existingOpen) {
        const h = Math.abs(nx - endTile.x) + Math.abs(ny - endTile.y);
        openList.push({
          x: nx,
          y: ny,
          g: gScore,
          h: h,
          f: gScore + h,
          parent: currentNode
        });
      } else if (gScore < existingOpen.g) {
        existingOpen.g = gScore;
        existingOpen.f = gScore + existingOpen.h;
        existingOpen.parent = currentNode;
      }
    }
  }

  // If no path found, just return the end point (fallback)
  return [{ ...end }];
}
