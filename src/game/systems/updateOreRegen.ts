import { GameEngine } from '../GameEngine';

export function updateOreRegen(this: GameEngine, timestamp: number) {
  if (!this.state.lastOreRegen || timestamp - this.state.lastOreRegen > 60000) {
    this.state.lastOreRegen = timestamp;
    
    // Find all 'ORE' tiles
    const oreTiles = [];
    const map = this.state.map;
    
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y][x] === 'ORE') {
          oreTiles.push({ x, y });
        }
      }
    }

    if (oreTiles.length === 0) return; // No ore left at all? Unlucky.

    // Grow ~5-10 tiles
    let regenerated = 0;
    const toRegen = (Math.random() * 5 + 5) | 0;

    for (let i = 0; i < toRegen; i++) {
        const source = oreTiles[Math.floor(Math.random() * oreTiles.length)];
        const dx = (Math.random() * 3 - 1) | 0;
        const dy = (Math.random() * 3 - 1) | 0;
        const nx = source.x + dx;
        const ny = source.y + dy;
        
        if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
            // Only convert basic grass to ORE
            const tType = map.tiles[ny][nx];
            if (tType === 'GRASS' || tType === 'ELEVATED_GRASS') {
                map.tiles[ny][nx] = 'ORE';
                if (map.oreTiles) {
                    map.oreTiles.push({ x: nx * 40 + 20, y: ny * 40 + 20 });
                }
                regenerated++;
            }
        }
    }
    
    if (regenerated > 0) {
        map.generation = (map.generation || 0) + 1; // trigger map rerender
    }
  }
}
