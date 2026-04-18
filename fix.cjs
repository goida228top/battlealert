const fs = require('fs');
const files = [
  'src/components/tabs/BuildingsTab.tsx',
  'src/components/tabs/DefenseTab.tsx',
  'src/components/tabs/InfantryTab.tsx',
  'src/components/tabs/VehiclesTab.tsx'
];

files.forEach(f => {
  let d = fs.readFileSync(f, 'utf8');
  d = d.replace(/engineRef\.current\.state\.productionQueue = engineRef\.current\.state\.productionQueue\.filter\(q => q\.id !== item\.id\);/g, 'engineRef.current.removeFromQueue(item.id);');
  fs.writeFileSync(f, d);
});
console.log('done');
