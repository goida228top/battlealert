import fs from 'fs';
import path from 'path';

const tabsPath = './src/components/tabs';
const files = fs.readdirSync(tabsPath).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(tabsPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const types = [
    'POWER_PLANT', 'ORE_REFINERY', 'BARRACKS', 'WAR_FACTORY', 'NAVAL_YARD', 'RADAR', 'SERVICE_DEPOT', 'BATTLE_LAB', 'NUCLEAR_REACTOR', 'CLONING_VATS',
    'ALLIED_POWER_PLANT', 'ALLIED_ORE_REFINERY', 'ALLIED_BARRACKS', 'ALLIED_WAR_FACTORY', 'AIR_FORCE_COMMAND', 'ALLIED_BATTLE_LAB', 'ALLIED_ORE_PURIFIER', 'ROBOT_CONTROL_CENTER', 'ALLIED_NAVAL_YARD',
    
    'SOLDIER', 'ENGINEER', 'ATTACK_DOG', 'FLAK_TROOPER', 'TESLA_TROOPER', 'CRAZY_IVAN', 'YURI', 'BORIS',
    'ALLIED_SOLDIER', 'ALLIED_ENGINEER', 'ALLIED_DOG', 'ROCKET_SOLDIER', 'NAVY_SEAL', 'SPY', 'CHRONO_LEGIONNAIRE', 'TANYA',
    
    'RHINO_TANK', 'FLAK_TRACK', 'V3_LAUNCHER', 'TERROR_DRONE', 'APOCALYPSE_TANK', 'TESLA_TANK', 'SIEGE_CHOPPER', 'TYPHOON_SUB', 'SEA_SCORPION', 'GIANT_SQUID', 'DREADNOUGHT',
    'GRIZZLY_TANK', 'IFV', 'PRISM_TANK', 'MIRAGE_TANK', 'ROBOT_TANK', 'DESTROYER', 'AEGIS_CRUISER', 'DOLPHIN', 'AIRCRAFT_CARRIER',
    
    'SOVIET_WALL', 'SENTRY_GUN', 'FLAK_CANNON', 'TESLA_COIL', 'BUNKER', 'IRON_CURTAIN', 'NUCLEAR_MISSILE_SILO',
    'ALLIED_WALL', 'PILLBOX', 'PATRIOT_MISSILE', 'PRISM_TOWER', 'CHRONOSPHERE', 'WEATHER_STORM'
  ];

  for (const type of types) {
    // Look for `startProduction('${type}')` or `startPlacing('${type}')`
    // Then find the bounding <BuildButton ... /> around it.
    // Instead of complex AST, let's just do a text search.
    
    // Pattern: `onClick={() => engineRef.current.startProduction('${type}')}`
    // or `onClick={() => { ... startProduction('${type}') ... }}` 
    // And we need to insert `onContextMenu={(e) => handleCancel('${type}', e)}`
    
    // Easier: find `title="..."` occurring AFTER we see `getCost('${type}')`
    // within a reasonable chunk of text (e.g., 500 chars).
    
    const costRegex = new RegExp(`cost=\\{engineRef\\.current\\.getCost\\('${type}'\\)\\}`);
    const parts = content.split(costRegex);
    if (parts.length > 1) {
       for (let i = 1; i < parts.length; i++) {
          const indexTitle = parts[i].indexOf('title="');
          const indexCancel = parts[i].indexOf('onContextMenu=');
          
          if (indexTitle !== -1) {
             if (indexCancel === -1 || indexCancel > indexTitle) {
               // insert before title
               parts[i] = parts[i].slice(0, indexTitle) + `\n                    onContextMenu={(e) => handleCancel('${type}', e)}\n                    ` + parts[i].slice(indexTitle);
             }
          }
       }
       content = parts.join(`cost={engineRef.current.getCost('${type}')}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed onContextMenu efficiently');
