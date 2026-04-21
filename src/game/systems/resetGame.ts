
import { Faction, Country } from '../types';

export function resetGame(this: any, faction: Faction, country: Country, mapId: string = 'RIVER_DIVIDE', botDifficulty: string = 'NORMAL') {
  this.role = 'OFFLINE';
  this.localPlayerId = 'PLAYER';
  this.roomId = undefined;
  this.playerFaction = faction;
  this.playerCountry = country;
  this.lastUpdate = 0;
  this.initGame(mapId);
  this.state.botSlots = ['PLAYER_2'];
  this.state.botDifficulties = { 'PLAYER_2': botDifficulty };
}
