import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function getBuildTime(this: GameEngine, type: string): number {
switch (type) {
  case 'POWER_PLANT': return 3500;
  case 'BARRACKS': return 5000;
  case 'ORE_REFINERY': return 8000;
  case 'WAR_FACTORY': return 10000;
  case 'NAVAL_YARD': return 7500;
  case 'RADAR': return 8000;
  case 'SERVICE_DEPOT': return 7000;
  case 'BATTLE_LAB': return 15000;
  case 'ORE_PURIFIER': return 18000;
  case 'INDUSTRIAL_PLANT': return 15000;
  case 'NUCLEAR_REACTOR': return 12000;
  case 'PSYCHIC_SENSOR': return 8000;
  case 'CLONING_VATS': return 15000;
  case 'SOVIET_WALL': return 500;
  case 'BATTLE_BUNKER': return 3500;

  case 'SENTRY_GUN': return 4000;
  case 'FLAK_CANNON': return 6500;
  case 'TESLA_COIL': return 8000;
  case 'IRON_CURTAIN': return 25000;
  case 'NUCLEAR_SILO': return 35000;

  case 'SOLDIER': return 2000;
  case 'ENGINEER': return 5000;
  case 'ATTACK_DOG': return 2500;
  case 'FLAK_TROOPER': return 4000;
  case 'TESLA_TROOPER': return 4000;
  case 'CRAZY_IVAN': return 5000;
  case 'BORIS': return 10000;
  case 'DESOLATOR': return 5000;
  case 'TERRORIST': return 2500;
  case 'YURI': return 10000;
  case 'YURI_PRIME': return 15000;

  case 'TANK': return 6500;
  case 'RHINO_TANK': return 9000;
  case 'FLAK_TRACK': return 5500;
  case 'V3_LAUNCHER': return 12000;
  case 'TERROR_DRONE': return 6500;
  case 'APOCALYPSE_TANK': return 12000;
  case 'HARVESTER': return 8000;
  case 'MCV': return 20000;
  case 'ALLIED_MCV': return 20000;
  case 'KIROV_AIRSHIP': return 18000;
  case 'TESLA_TANK': return 9000;
  case 'SIEGE_CHOPPER': return 10000;
  case 'DEMOLITION_TRUCK': return 10000;

  case 'TYPHOON_SUB': return 8000;
  case 'SEA_SCORPION': return 7000;
  case 'GIANT_SQUID': return 10000;
  case 'DREADNOUGHT': return 18000;
  case 'HOVER_TRANSPORT': return 8000;

  // Allied Buildings
  case 'ALLIED_CONSTRUCTION_YARD': return 20000;
  case 'ALLIED_POWER_PLANT': return 3500;
  case 'ALLIED_BARRACKS': return 5000;
  case 'ALLIED_ORE_REFINERY': return 8000;
  case 'ALLIED_WAR_FACTORY': return 10000;
  case 'AIR_FORCE_COMMAND': return 8000;
  case 'ALLIED_BATTLE_LAB': return 15000;
  case 'ALLIED_ORE_PURIFIER': return 18000;
  case 'ALLIED_NAVAL_YARD': return 7500;
  case 'ALLIED_WALL': return 500;
  case 'PILLBOX': return 4000;
  case 'PATRIOT_MISSILE': return 6500;
  case 'PRISM_TOWER': return 8000;
  case 'GRAND_CANNON': return 12000;
  case 'GAP_GENERATOR': return 8000;
  case 'CHRONOSPHERE': return 25000;
  case 'WEATHER_DEVICE': return 35000;

  // Allied Infantry
  case 'GI': return 2000;
  case 'ROCKETEER': return 4000;
  case 'NAVY_SEAL': return 7000;
  case 'CHRONO_LEGIONNAIRE': return 10000;
  case 'TANYA': return 10000;
  case 'SNIPER': return 4000;
  case 'CHRONO_IVAN': return 7000;
  case 'CHRONO_COMMANDO': return 15000;
  case 'PSI_COMMANDO': return 7000;
  case 'SPY': return 7000;

  // Allied Vehicles
  case 'CHRONO_MINER': return 8000;
  case 'GRIZZLY_TANK': return 6500;
  case 'IFV': return 5500;
  case 'MIRAGE_TANK': return 8000;
  case 'PRISM_TANK': return 10000;
  case 'ROBOT_TANK': return 5500;
  case 'BATTLE_FORTRESS': return 15000;
  case 'TANK_DESTROYER': return 6500;

  // Allied Air/Naval
  case 'HARRIER': return 8000;
  case 'BLACK_EAGLE': return 8000;
  case 'NIGHT_HAWK_TRANSPORT': return 7000;
  case 'AMPHIBIOUS_TRANSPORT': return 7000;
  case 'DESTROYER': return 7000;
  case 'AEGIS_CRUISER': return 8000;
  case 'AIRCRAFT_CARRIER': return 15000;
  case 'DOLPHIN': return 4000;

  default: return 3500;
}
}
