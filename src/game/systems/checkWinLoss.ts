import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function checkWinLoss(this: GameEngine, ): void {
  // Only process if not already over
  if (this.state.gameOver) return;

  const owners = ['PLAYER', 'PLAYER_2', 'PLAYER_3', 'PLAYER_4'];
  const aliveOwners = owners.filter(owner => 
    this.state.entities.some(e => e.owner === owner && (e.type === 'BUILDING' || e.subType === 'MCV' || e.subType === 'ALLIED_MCV'))
  );

  // If we are not in the list of alive owners, we lost
  if (!aliveOwners.includes(this.localPlayerId)) {
    this.state.gameOver = 'LOSS';
  } else if (aliveOwners.length === 1 && aliveOwners[0] === this.localPlayerId) {
    // If we are the ONLY ones left, we win
    this.state.gameOver = 'WIN';
  }
}
