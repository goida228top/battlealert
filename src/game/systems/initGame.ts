
import { Entity, GameState, TileType, Faction, Country, MapTheme, Bridge, Vector2 } from '../types';
import { generateRiverDivideMap, MAP_WIDTH, MAP_HEIGHT } from '../maps/riverDivide';

export function initGame(this: any, mapId: string = 'RIVER_DIVIDE') {
  let mapWidth = MAP_WIDTH;
  let mapHeight = MAP_HEIGHT;
  let tiles: TileType[][] = [];
  let theme: MapTheme = 'TEMPERATE';
  let bridges: Bridge[] = [];
  let patches: {x: number, y: number}[] = [];
  let playerStart = { x: 400, y: 400 };
  let aiStart = { x: (mapWidth - 10) * 40, y: (mapHeight - 10) * 40 };
  let extraEntities: Entity[] = [];
  
  if (mapId === 'RIVER_DIVIDE') {
      const mapData = generateRiverDivideMap();
    tiles = mapData.tiles;
    bridges = mapData.bridges;
    theme = mapData.theme as MapTheme;
    playerStart = mapData.playerStart;
    aiStart = mapData.aiStart;
    extraEntities = mapData.entities;
  }

  const visibility: number[][] = [];
  for (let y = 0; y < mapHeight; y++) {
    visibility.push(new Array(mapWidth).fill(0));
  }

  patches.forEach(p => {
    const tx = p.x;
    const ty = p.y;
    // Generate a chunky cluster (approx 5x5 to 7x7)
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        // Dist calculation for somewhat rounded edges and random noise at edges
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= 2.5 || (dist <= 4 && Math.random() > 0.4)) {
          const nx = tx + dx;
          const ny = ty + dy;
          const worldX = nx * 40 + 20;
          const worldY = ny * 40 + 20;
          
          // Safety distance from player starts (increased to ~9 cells)
          const p1Dist = Math.hypot(worldX - playerStart.x, worldY - playerStart.y);
          const p2Dist = Math.hypot(worldX - aiStart.x, worldY - aiStart.y);
          const p3Dist = Math.hypot(worldX - ((mapWidth - 10) * 40), worldY - (10 * 40));
          const p4Dist = Math.hypot(worldX - (10 * 40), worldY - ((mapHeight - 10) * 40));
          
          const onBridge = bridges.some(b => 
            nx >= b.x && nx < b.x + b.width && ny >= b.y && ny < b.y + b.height
          );
          
          if (tiles[ny] && tiles[ny][nx] === 'GRASS' && p1Dist > 360 && p2Dist > 360 && p3Dist > 360 && p4Dist > 360 && !onBridge) {
            tiles[ny][nx] = 'ORE';
          }
        }
      }
    }
  });

  const isPlayerAllied = this.playerFaction === 'COALITION';
  const isAiAllied = Math.random() > 0.5;

  this.state = {
    entities: [
      {
        id: 'initial-mcv',
        type: 'UNIT',
        subType: isPlayerAllied ? 'ALLIED_MCV' : 'MCV',
        position: { x: playerStart.x + 20, y: playerStart.y + 20 },
        health: 1000,
        maxHealth: 1000,
        owner: 'PLAYER',
        size: 30,
        speed: 1.2,
        rotation: 0,
      },
      {
        id: 'ai-mcv',
        type: 'UNIT',
        subType: isAiAllied ? 'ALLIED_MCV' : 'MCV',
        position: { x: aiStart.x + 20, y: aiStart.y + 20 },
        health: 1000,
        maxHealth: 1000,
        owner: 'PLAYER_2',
        size: 30,
        speed: 1.2,
        rotation: 0,
      }
    ],
    projectiles: [],
    credits: 10000,
    p2Credits: 10000,
    effects: [],
    moveMarkers: [],
    crates: [],
    power: 100,
    powerConsumption: 0,
    selectionBox: null,
    placingBuilding: null,
    sidebarTab: 'BUILDINGS',
    interactionMode: 'DEFAULT',
    productionQueue: [],
    p2ProductionQueue: [],
    camera: {
      x: -playerStart.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500),
      y: -playerStart.y + (typeof window !== 'undefined' ? window.innerHeight / 2 : 500),
      zoom: 1,
    },
    map: {
      tiles,
      tileSize: 40,
      width: mapWidth,
      height: mapHeight,
      bridges,
      visibility,
      theme,
    },
    specialAbilities: {
      IRON_CURTAIN: { ready: false, lastUsed: 0, cooldown: 180000 },
      NUCLEAR_SILO: { ready: false, lastUsed: 0, cooldown: 300000 },
      SPY_PLANE: { ready: false, lastUsed: 0, cooldown: 120000 },
      PARATROOPERS: { ready: false, lastUsed: 0, cooldown: 150000 },
      CHRONOSPHERE: { ready: false, lastUsed: 0, cooldown: 180000 },
      WEATHER_DEVICE: { ready: false, lastUsed: 0, cooldown: 300000 },
    },
    p2SpecialAbilities: {
      IRON_CURTAIN: { ready: false, lastUsed: 0, cooldown: 180000 },
      NUCLEAR_SILO: { ready: false, lastUsed: 0, cooldown: 300000 },
      SPY_PLANE: { ready: false, lastUsed: 0, cooldown: 120000 },
      PARATROOPERS: { ready: false, lastUsed: 0, cooldown: 150000 },
      CHRONOSPHERE: { ready: false, lastUsed: 0, cooldown: 180000 },
      WEATHER_DEVICE: { ready: false, lastUsed: 0, cooldown: 300000 },
    },
  };

  // Add extra entities if provided by map generator
  if (extraEntities.length > 0) {
    this.state.entities.push(...extraEntities);
  }

  if (mapId !== 'RIVER_DIVIDE') {
    // Generate a circular wall of mountains with a gap ("дырка")
    const cx = mapWidth / 2;
    const cy = mapHeight / 2;
    const ringRadius = 15; // 15 tiles
    const numMountains = 80;
    
    for (let i = 0; i < numMountains; i++) {
      const angle = (i / numMountains) * Math.PI * 2;
      
      // Normalize angle to -PI to PI
      let normAngle = angle;
      if (normAngle > Math.PI) normAngle -= 2 * Math.PI;
      
      // Leave a gap at the bottom (angle roughly PI/2)
      if (normAngle > (Math.PI / 2) - 0.4 && normAngle < (Math.PI / 2) + 0.4) {
          continue;
      }

      const tx = Math.floor(cx + Math.cos(angle) * ringRadius);
      const ty = Math.floor(cy + Math.sin(angle) * ringRadius);
      
      if (tx >= 0 && tx < mapWidth && ty >= 0 && ty < mapHeight) {
        // Don't place on water or bridges just in case
        const t = tiles[ty][tx];
        if (t !== 'WATER' && t !== 'WATER_TO_GRASS' && t !== 'GRASS_TO_WATER') {
          const isNearBridge = bridges.some(b => {
              return tx >= b.x - 2 && tx < b.x + b.width + 2 && ty >= b.y - 2 && ty < b.y + b.height + 2;
          });
          if (!isNearBridge) {
            // Jitter the positions slightly for natural look
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            this.state.entities.push({
              id: `mountain-ring-${i}`,
              type: 'BUILDING',
              subType: 'MOUNTAIN', // Impassable block
              position: { x: tx * 40 + 20 + offsetX, y: ty * 40 + 20 + offsetY },
              health: 999999,
              maxHealth: 999999,
              owner: 'NEUTRAL',
              size: 55
            });
          }
        }
      }
    }

    // Generate Forests (Tree clusters)
    const numForests = 25;
    for (let i = 0; i < numForests; i++) {
      const forestCenterX = Math.floor(Math.random() * mapWidth);
      const forestCenterY = Math.floor(Math.random() * mapHeight);
      const forestRadius = 4 + Math.floor(Math.random() * 6); // 4 to 9 tiles radius

      // Step by 2 to guarantee more distance between trees
      for (let dy = -forestRadius; dy <= forestRadius; dy += 2) {
        for (let dx = -forestRadius; dx <= forestRadius; dx += 2) {
          const x = forestCenterX + dx;
          const y = forestCenterY + dy;
          
          const distance = Math.sqrt(dx*dx + dy*dy);
          if (distance <= forestRadius && Math.random() < 0.7) {
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
              const tType = tiles[y][x];
              // Only spawn on regular or elevated grass to avoid blocking narrow ramps/cliffs/water
              if (tType === 'GRASS' || tType === 'ELEVATED_GRASS') {
                const distToPlayer = Math.hypot(x*40 + 20 - playerStart.x, y*40 + 20 - playerStart.y);
                const distToAI = Math.hypot(x*40 + 20 - aiStart.x, y*40 + 20 - aiStart.y);
                // Leave a generous clearing around start bases and bridges
                const isNearBridge = bridges.some(b => {
                  return x >= b.x - 3 && x < b.x + b.width + 3 && y >= b.y - 3 && y < b.y + b.height + 3;
                });

                if (!isNearBridge && distToPlayer > 250 && distToAI > 250) {
                  // Larger offset since we step by 2, adds organic scatter
                  const offsetX = (Math.random() - 0.5) * 25;
                  const offsetY = (Math.random() - 0.5) * 25;
                  this.state.entities.push({
                    id: `tree-${x}-${y}-${Math.random()}`,
                    type: 'BUILDING',
                    subType: 'TREE',
                    position: { x: x * 40 + 20 + offsetX, y: y * 40 + 20 + offsetY },
                    health: 999999,
                    maxHealth: 999999,
                    owner: 'NEUTRAL',
                    size: 10
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // Pre-calculate Terrain Grids for pathfinding optimization
  const pfTileSize = 20;
  const pScale = 40 / pfTileSize;
  const pfWidth = mapWidth * pScale;
  const pfHeight = mapHeight * pScale;
  const terrainGrid: boolean[][] = [];
  const bigUnitTerrainGrid: boolean[][] = [];
  const waterGrid: boolean[][] = [];
  const amphibiousGrid: boolean[][] = [];

  for (let y = 0; y < pfHeight; y++) {
    terrainGrid[y] = [];
    bigUnitTerrainGrid[y] = [];
    waterGrid[y] = [];
    amphibiousGrid[y] = [];
    for (let x = 0; x < pfWidth; x++) {
      const tx = Math.floor(x / pScale);
      const ty = Math.floor(y / pScale);
      const tileType = tiles[ty][tx];
      // Walkable: Grass, Elevated Grass, Ore, Ramps, and certain decorations (NOT mountains/cliffs)
      const isGroundWalkable = tileType === 'GRASS' || tileType === 'ELEVATED_GRASS' || tileType === 'MOUNTAIN_GRASS' || tileType === 'MOUNTAIN_DECOR' || tileType === 'ORE' || tileType.startsWith('RAMP_');
      const isWater = tileType === 'WATER';
      const isWaterTransition = tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER';

      terrainGrid[y][x] = isGroundWalkable;
      bigUnitTerrainGrid[y][x] = isGroundWalkable; // Default

      // Naval units can only go in deep water
      waterGrid[y][x] = isWater;

      // Amphibious units can go on both ground, water, and transitions
      amphibiousGrid[y][x] = isGroundWalkable || isWater || isWaterTransition;
    }
  }

  this.state.map.terrainGrid = terrainGrid;
  this.state.map.bigUnitTerrainGrid = bigUnitTerrainGrid;
  this.state.map.waterGrid = waterGrid;
  this.state.map.amphibiousGrid = amphibiousGrid;
  this.state.dynamicObstacleGrid = new Uint8Array(pfWidth * pfHeight);

  // Generate heightGrid (0 for ground, 1 for elevated)
  const heightGrid: number[][] = [];
  for (let y = 0; y < mapHeight; y++) {
    heightGrid[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      heightGrid[y][x] = 0;
    }
  }
  this.state.map.heightGrid = heightGrid;
  
  // Initialize oreTiles for optimized harvester search
  const oreTiles: Vector2[] = [];
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (tiles[y][x] === 'ORE') {
        oreTiles.push({ x: x * 40 + 20, y: y * 40 + 20 });
      }
    }
  }
  this.state.map.oreTiles = oreTiles;
}
