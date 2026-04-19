
import { Vector2, Entity } from '../types';

export function useParatroopers(this: any, targetPos: Vector2, owner: string = 'PLAYER') {
  const abilities = owner === 'PLAYER_2' ? this.state.p2SpecialAbilities : 
                     owner === 'PLAYER_3' ? this.state.p3SpecialAbilities : 
                     owner === 'PLAYER_4' ? this.state.p4SpecialAbilities : 
                     this.state.specialAbilities;
  const pt = abilities.PARATROOPERS;
  if (!pt || !pt.ready) return;

  const timestamp = performance.now();

  // Spawn paratroopers
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const entity: Entity = {
        id: `SOLDIER-${Date.now()}-${Math.random()}`,
        type: 'UNIT',
        subType: 'SOLDIER',
        position: { x: targetPos.x + (Math.random() - 0.5) * 100, y: targetPos.y + (Math.random() - 0.5) * 100 },
        health: 100,
        maxHealth: 100,
        owner: owner,
        size: 10,
        speed: 1.5,
        rotation: 0,
      };
      this.state.entities.push(entity);
    }, i * 500); // Staggered drop
  }

  pt.ready = false;
  pt.lastUsed = timestamp;
}
