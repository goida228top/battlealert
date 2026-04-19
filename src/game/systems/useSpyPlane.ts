
import { Vector2 } from '../types';

export function useSpyPlane(this: any, targetPos: Vector2, owner: string = 'PLAYER') {
  const abilities = owner === 'PLAYER_2' ? this.state.p2SpecialAbilities : 
                     owner === 'PLAYER_3' ? this.state.p3SpecialAbilities : 
                     owner === 'PLAYER_4' ? this.state.p4SpecialAbilities : 
                     this.state.specialAbilities;
  const sp = abilities.SPY_PLANE;
  if (!sp || !sp.ready) return;

  const timestamp = performance.now();
  
  this.state.effects.push({
    id: `spy-plane-${Date.now()}`,
    type: 'EXPLOSION', // Reusing explosion effect for visual feedback
    position: { ...targetPos },
    startTime: timestamp,
    duration: 3000,
  });

  sp.ready = false;
  sp.lastUsed = timestamp;
}
