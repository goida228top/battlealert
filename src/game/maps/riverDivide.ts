export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 60;

// Deterministic simple PRNG
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function generateRiverDivideMap() {
    const random = mulberry32(12345); // Fixed seed
    const tiles: string[][] = [];
    let bridges: any[] = [];
    let patches: {x: number, y: number}[] = [];
    const playerStart = { x: 400, y: 400 }; // Cell: 10, 10
    const aiStart = { x: (MAP_WIDTH - 10) * 40, y: (MAP_HEIGHT - 10) * 40 };
    
    // Generate base terrain
    const riverOffsets: number[] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        if (y < MAP_HEIGHT / 2) {
            riverOffsets[y] = Math.sin(y / 8 + 2) * 3 + Math.cos(y / 4) * 2;
        } else {
            const mirroredY = MAP_HEIGHT - 1 - y;
            riverOffsets[y] = -riverOffsets[mirroredY];
        }
    }

    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row: string[] = [];
        const riverX = Math.floor(MAP_WIDTH / 2) + Math.floor(riverOffsets[y]);
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Meandering river
            if (x === riverX - 1) {
                row.push('GRASS_TO_WATER');
            } else if (x === riverX || x === riverX + 1 || x === riverX + 2) {
                row.push('WATER');
            } else if (x === riverX + 3) {
                row.push('WATER_TO_GRASS');
            } else {
                row.push('GRASS');
            }
        }
        tiles.push(row);
    }

    // Bridges over the river
    bridges = [];
    const bridgePositionsY: number[] = [];
    bridgePositionsY.forEach(y => {
        const riverOffset = Math.sin(y / 8 + 2) * 3 + Math.cos(y / 4) * 2;
        const riverX = Math.floor(MAP_WIDTH / 2) + Math.floor(riverOffset);
        bridges.push({ x: riverX - 2, y: y, width: 8, height: 4 });
    });

    const entities: any[] = [];

    // --- Mountain Enclosures & Bridges --- //
    const mountainTiles = new Set<string>();
    const mountainDecorTiles = new Set<string>();

    function addThinCircle(cx: number, cy: number, radius: number, isPlayer1: boolean) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 128) {
            const tx = Math.round(cx + Math.cos(angle) * radius);
            const ty = Math.round(cy + Math.sin(angle) * radius);
            
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                const dx = tx - cx;
                const dy = ty - cy;
                let inGap = false;
                if (isPlayer1) {
                    // Wider South-East gap
                    if (dx >= -4 && dy >= -4) inGap = true;
                } else {
                    // Wider North-West gap
                    if (dx <= 4 && dy <= 4) inGap = true;
                }
                
                if (inGap) {
                    mountainDecorTiles.add(`${tx},${ty}`);
                } else {
                    mountainTiles.add(`${tx},${ty}`);
                }
            }
        }
    }

    // 1. Player Base (Top-Left)
    addThinCircle(10, 10, 15, true);

    // 2. AI Base (Bottom-Right)
    addThinCircle(MAP_WIDTH - 10, MAP_HEIGHT - 10, 15, false);

    // 3. Top and Bottom Land Bridges (with inner walls only)
    const bridgeRadiusX = 16;
    const bridgeRadiusY = 7;

    // Top bridge
    const topBridgeCenterY = 8;
    for (let dx = -bridgeRadiusX - 1; dx <= bridgeRadiusX + 1; dx++) {
        let maxYInside = -1;
        if (Math.abs(dx) <= bridgeRadiusX) {
            maxYInside = Math.round(bridgeRadiusY * Math.sqrt(1 - Math.pow(dx / bridgeRadiusX, 2)));
        }
        
        if (maxYInside >= 0) {
            const tx = Math.floor(MAP_WIDTH / 2) + dx;
            const tyBot = topBridgeCenterY + maxYInside;
            
            // Fill grass from map top edge down to tyBot
            for (let y = 0; y <= tyBot; y++) {
                if (tx >= 0 && tx < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    tiles[y][tx] = 'GRASS';
                }
            }
            
            // Add mountain wall on the bottom edge (leaving gaps at ends)
            const wallY = tyBot + 1;
            if (tx >= 0 && tx < MAP_WIDTH && wallY >= 0 && wallY < MAP_HEIGHT) {
                if (Math.abs(dx) <= bridgeRadiusX - 5) {
                    mountainTiles.add(`${tx},${wallY}`);
                } else if (Math.abs(dx) === bridgeRadiusX - 4) {
                    const side = Math.sign(dx);
                    let prevCurX = tx;
                    for (let y = wallY; y >= 0; y--) {
                            const dy = wallY - y;
                            const curveOffset = Math.floor(0.025 * dy * dy + 0.1 * dy);
                            const curX = tx + side * curveOffset;
                        
                        // Fill horizontal gaps
                        const minX = Math.min(prevCurX, curX);
                        const maxX = Math.max(prevCurX, curX);
                        for (let fx = minX; fx <= maxX; fx++) {
                            if (fx >= 0 && fx < MAP_WIDTH) {
                                mountainDecorTiles.add(`${fx},${y}`);
                            }
                        }
                        prevCurX = curX;
                    }
                }
            }
        }
    }

    // Bottom bridge
    const bottomBridgeCenterY = MAP_HEIGHT - 8;
    for (let dx = -bridgeRadiusX - 1; dx <= bridgeRadiusX + 1; dx++) {
        let maxYInside = -1;
        if (Math.abs(dx) <= bridgeRadiusX) {
            maxYInside = Math.round(bridgeRadiusY * Math.sqrt(1 - Math.pow(dx / bridgeRadiusX, 2)));
        }
        
        if (maxYInside >= 0) {
            const tx = Math.floor(MAP_WIDTH / 2) + dx;
            const tyTop = bottomBridgeCenterY - maxYInside;
            
            // Fill grass from tyTop down to map bottom edge
            for (let y = tyTop; y < MAP_HEIGHT; y++) {
                if (tx >= 0 && tx < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    tiles[y][tx] = 'GRASS';
                }
            }
            
            // Add mountain wall on the top edge (leaving gaps at ends)
            const wallY = tyTop - 1;
            if (tx >= 0 && tx < MAP_WIDTH && wallY >= 0 && wallY < MAP_HEIGHT) {
                if (Math.abs(dx) <= bridgeRadiusX - 5) {
                    mountainTiles.add(`${tx},${wallY}`);
                } else if (Math.abs(dx) === bridgeRadiusX - 4) {
                    const side = Math.sign(dx);
                    let prevCurX = tx;
                    for (let y = wallY; y < MAP_HEIGHT; y++) {
                            const dy = y - wallY;
                            const curveOffset = Math.floor(0.025 * dy * dy + 0.1 * dy);
                            const curX = tx + side * curveOffset;

                        // Fill horizontal gaps
                        const minX = Math.min(prevCurX, curX);
                        const maxX = Math.max(prevCurX, curX);
                        for (let fx = minX; fx <= maxX; fx++) {
                            if (fx >= 0 && fx < MAP_WIDTH) {
                                mountainDecorTiles.add(`${fx},${y}`);
                            }
                        }
                        prevCurX = curX;
                    }
                }
            }
        }
    }

    // Cleanup isolated mountain blocks (user asked: if a grey block has no neighbors / small cluster)
    const tilesToRemove = new Set<string>();
    const visited = new Set<string>();
    
    mountainTiles.forEach(key => {
        if (visited.has(key)) return;
        
        // Find contiguous cluster (including diagonals)
        const queue = [key];
        const cluster = new Set<string>();
        cluster.add(key);
        visited.add(key);
        
        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];
            const [x, y] = current.split(',').map(Number);
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nKey = `${x + dx},${y + dy}`;
                    if (mountainTiles.has(nKey) && !visited.has(nKey)) {
                        visited.add(nKey);
                        cluster.add(nKey);
                        queue.push(nKey);
                    }
                }
            }
        }
        
        // Delete clusters of size <= 5 (handles stray isolated blocks or very small groups)
        if (cluster.size <= 5) {
            cluster.forEach(k => tilesToRemove.add(k));
        }
    });

    tilesToRemove.forEach(key => mountainTiles.delete(key));

    // Generate Mountain Entities
    mountainTiles.forEach(key => {
        const [tx, ty] = key.split(',').map(Number);
        
        // Avoid overriding the very edge of the map if unnecessary, or let it be.
        const t = tiles[ty][tx];
        // Ensure standard ground under mountains (no water under stone)
        tiles[ty][tx] = 'GRASS';
        
        entities.push({
            id: `mountain-${tx}-${ty}`,
            type: 'BUILDING',
            subType: 'MOUNTAIN',
            position: { x: tx * 40 + 20, y: ty * 40 + 20 },
            health: 999999,
            maxHealth: 999999,
            owner: 'NEUTRAL',
            size: 40 // 1 tile square size
        });
        
        // Add minimal trees explicitly only near mountains if desired, but user just wants basic outlines.
    });

    mountainDecorTiles.forEach(key => {
        const [tx, ty] = key.split(',').map(Number);
        tiles[ty][tx] = 'MOUNTAIN_DECOR';
    });

    // --- Paint Closed Zones with MOUNTAIN_GRASS via Flood Fill --- //
    const redVisited = new Set<string>();
    
    function floodFillRed(startX: number, startY: number) {
        if (startX < 0 || startX >= MAP_WIDTH || startY < 0 || startY >= MAP_HEIGHT) return;
        
        const queue = [{ x: startX, y: startY }];
        redVisited.add(`${startX},${startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift()!;
            
            if (tiles[y][x] === 'GRASS') {
                tiles[y][x] = 'MOUNTAIN_GRASS';
            }
            
            const neighbors = [
                {x: x+1, y: y}, {x: x-1, y: y}, {x: x, y: y+1}, {x: x, y: y-1}
            ];
            
            for (const n of neighbors) {
                if (n.x >= 0 && n.x < MAP_WIDTH && n.y >= 0 && n.y < MAP_HEIGHT) {
                    const key = `${n.x},${n.y}`;
                    if (!redVisited.has(key)) {
                        const t = tiles[n.y][n.x];
                        // Stop if we hit any mountain, wall, or water boundary
                        if (t !== 'MOUNTAIN_DECOR' && !mountainTiles.has(key) && t !== 'WATER' && t !== 'WATER_TO_GRASS' && t !== 'GRASS_TO_WATER') {
                            redVisited.add(key);
                            queue.push(n);
                        }
                    }
                }
            }
        }
    }

    // Zone 1: Top-Left Player Base
    floodFillRed(0, 0);
    // Zone 2: Bottom-Right AI Base
    floodFillRed(MAP_WIDTH - 1, MAP_HEIGHT - 1);
    // Zone 3: Top Bridge Enclosure
    floodFillRed(Math.floor(MAP_WIDTH / 2), 0);
    // Zone 4: Bottom Bridge Enclosure
    floodFillRed(Math.floor(MAP_WIDTH / 2), MAP_HEIGHT - 1);

    // --- Ore Patches --- //
    // Strategic locations: Top-Middle, Bottom-Middle, Bottom-Left, Top-Right
    patches = [
        { x: 50, y: 10 }, 
        { x: 50, y: 50 },
        { x: 10, y: 50 },
        { x: 90, y: 10 },
        // Two additional large patches center-top and center-bottom near mountains
        { x: 35, y: 25 },
        { x: 65, y: 35 }
    ];

    patches.forEach(p => {
        const tx = p.x;
        const ty = p.y;
        for (let dy = -6; dy <= 6; dy++) {
            for (let dx = -6; dx <= 6; dx++) {
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 3.5 || (dist <= 6.0 && random() > 0.3)) {
                    const nx = tx + dx;
                    const ny = ty + dy;
                    
                    if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && tiles[ny][nx] === 'GRASS') {
                        // Keep out of mountains and bridges
                        if (!mountainTiles.has(`${nx},${ny}`)) {
                            const onBridge = bridges.some(b => nx >= b.x && nx < b.x + b.width && ny >= b.y && ny < b.y + b.height);
                            if (!onBridge) {
                                tiles[ny][nx] = 'ORE';
                            }
                        }
                    }
                }
            }
        }
    });

    // --- Beautiful Symmetrical Forest Landscape --- //
    // We use point symmetry around the map center
    const numForests = 20; // Fewer loops because each successful placement adds 2 trees
    for (let i = 0; i < numForests; i++) {
        const forestCenterX = Math.floor(random() * MAP_WIDTH);
        const forestCenterY = Math.floor(random() * MAP_HEIGHT);
        const forestRadius = 3 + Math.floor(random() * 5);

        for (let dy = -forestRadius; dy <= forestRadius; dy += 2) {
            for (let dx = -forestRadius; dx <= forestRadius; dx += 2) {
                const x1 = forestCenterX + dx;
                const y1 = forestCenterY + dy;
                
                // Point symmetry: (x2, y2) is mirrored from (x1, y1)
                const x2 = MAP_WIDTH - 1 - x1;
                const y2 = MAP_HEIGHT - 1 - y1;
                
                if (x1 >= 0 && x1 < MAP_WIDTH && y1 >= 0 && y1 < MAP_HEIGHT &&
                    x2 >= 0 && x2 < MAP_WIDTH && y2 >= 0 && y2 < MAP_HEIGHT) {
                    
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance <= forestRadius && random() < 0.6) {
                        const tType1 = tiles[y1][x1];
                        const tType2 = tiles[y2][x2];
                        
                        // Both locations must be grass and not mountain
                        if (tType1 === 'GRASS' && tType2 === 'GRASS' && 
                            !mountainTiles.has(`${x1},${y1}`) && !mountainTiles.has(`${x2},${y2}`)) {
                            
                            const isNearBridge1 = bridges.some(b => x1 >= b.x - 4 && x1 < b.x + b.width + 4 && y1 >= b.y - 4 && y1 < b.y + b.height + 4);
                            const isNearBridge2 = bridges.some(b => x2 >= b.x - 4 && x2 < b.x + b.width + 4 && y2 >= b.y - 4 && y2 < b.y + b.height + 4);
                            
                            const distToPlayer1 = Math.hypot(x1 - 10, y1 - 10);
                            const distToAI1 = Math.hypot(x1 - (MAP_WIDTH - 10), y1 - (MAP_HEIGHT - 10));
                            const distToPlayer2 = Math.hypot(x2 - 10, y2 - 10);
                            const distToAI2 = Math.hypot(x2 - (MAP_WIDTH - 10), y2 - (MAP_HEIGHT - 10));

                            if (!isNearBridge1 && !isNearBridge2 && 
                                distToPlayer1 > 18 && distToAI1 > 18 &&
                                distToPlayer2 > 18 && distToAI2 > 18) {
                                
                                const offsetX = (random() - 0.5) * 20;
                                const offsetY = (random() - 0.5) * 20;
                                const idBase = Math.floor(random()*100000);

                                entities.push({
                                    id: `tree-${x1}-${y1}-${idBase}-1`,
                                    type: 'BUILDING',
                                    subType: 'TREE',
                                    position: { x: x1 * 40 + 20 + offsetX, y: y1 * 40 + 20 + offsetY },
                                    health: 999999,
                                    maxHealth: 999999,
                                    owner: 'NEUTRAL',
                                    size: 15
                                });

                                entities.push({
                                    id: `tree-${x2}-${y2}-${idBase}-2`,
                                    type: 'BUILDING',
                                    subType: 'TREE',
                                    position: { x: x2 * 40 + 20 - offsetX, y: y2 * 40 + 20 - offsetY },
                                    health: 999999,
                                    maxHealth: 999999,
                                    owner: 'NEUTRAL',
                                    size: 15
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        tiles: tiles as any,
        bridges,
        playerStart,
        aiStart,
        entities,
        theme: 'TEMPERATE'
    };
}
