
import { Vector2 } from '../types';

export function useWeatherStorm(this: any, targetPos: Vector2, owner: string = 'PLAYER') {
  const abilities = owner === 'PLAYER_2' ? this.state.p2SpecialAbilities : 
                     owner === 'PLAYER_3' ? this.state.p3SpecialAbilities : 
                     owner === 'PLAYER_4' ? this.state.p4SpecialAbilities : 
                     this.state.specialAbilities;
  const wd = abilities.WEATHER_DEVICE;
  if (!wd.ready) return;

  const timestamp = performance.now();
  
  // Visual warning
  this.state.effects.push({
    id: `weather-warning-${Date.now()}`,
    type: 'SUPERWEAPON_STRIKE',
    position: { ...targetPos },
    targetPosition: { ...targetPos },
    startTime: timestamp,
    duration: 3000,
    color: '#38bdf8',
  });

  // Execute strikes over time
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const strikePos = {
        x: targetPos.x + (Math.random() - 0.5) * 300,
        y: targetPos.y + (Math.random() - 0.5) * 300
      };
      
      this.state.effects.push({
        id: `lightning-${Date.now()}-${i}`,
        type: 'EXPLOSION',
        position: { ...strikePos },
        startTime: performance.now(),
        duration: 500,
      });

      // Damage in small radius
      this.state.entities.forEach((e: any) => {
        const dist = Math.hypot(e.position.x - strikePos.x, e.position.y - strikePos.y);
        if (dist < 80) {
          e.health -= 500;
        }
      });
    }, 3000 + i * 500);
  }

  wd.ready = false;
  wd.lastUsed = timestamp;
  this.state.interactionMode = 'DEFAULT';
}
