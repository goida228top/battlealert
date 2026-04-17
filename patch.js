import fs from 'fs';

const tabs = ['DefenseTab.tsx', 'VehiclesTab.tsx', 'InfantryTab.tsx', 'BuildingsTab.tsx'];
tabs.forEach(tab => {
  const file = 'src/components/tabs/' + tab;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'PLAYER'/g, 'engineRef.current.localPlayerId');
  fs.writeFileSync(file, content);
});
