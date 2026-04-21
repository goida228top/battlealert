import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function sellBuilding(this: GameEngine, building: any): void {
const cost = this.getCost(building.subType);
const refund = Math.floor(cost * 0.5);

if (building.owner === 'PLAYER') this.state.credits += refund;
else if (building.owner === 'PLAYER_2') this.state.p2Credits = (this.state.p2Credits || 0) + refund;
else if (building.owner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + refund;
else if (building.owner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + refund;

building.health = 0; // Destroy it
}
