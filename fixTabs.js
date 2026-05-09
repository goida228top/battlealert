import fs from 'fs';
import path from 'path';

const tabsPath = './src/components/tabs';
const files = fs.readdirSync(tabsPath).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(tabsPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to find <BuildButton ... /> tags.
  // Then we find the `subType` or use the one from `onClick={() => engineRef.current.startProduction('TYPE')}`
  // But wait, in BuildingsTab it's:
  // onClick={() => { ... engineRef.current.startProduction('RADAR'); ... }}
  // Or cost={engineRef.current.getCost('TYPE')}
  // We can extract TYPE from `cost={engineRef.current.getCost('TYPE')}`
  
  // A regex to match BuildButton blocks:
  const regex = /<BuildButton\s+(?:[^>]*cost=\{engineRef\.current\.getCost\('([A-Z_]+)'\)\}[^>]*)>/g;
  
  content = content.replace(/<BuildButton([^>]*)>/g, (match, inner) => {
     // match like: <BuildButton label="Radar" ... />
     // find the TYPE from getCost('TYPE')
     const typeMatch = inner.match(/getCost\('([A-Z0-9_]+)'\)/);
     if (!typeMatch) return match;
     const type = typeMatch[1];
     
     // check if onContextMenu already exists
     if (inner.includes('onContextMenu')) {
       return match;
     }
     
     // append onContextMenu just before the closing > or before title=
     let newInner = inner;
     if (newInner.endsWith('/')) {
       newInner = newInner.slice(0, -1) + ` onContextMenu={(e) => handleCancel('${type}', e)} /`;
     } else {
       newInner = newInner + ` onContextMenu={(e) => handleCancel('${type}', e)}`;
     }
     
     return `<BuildButton${newInner}>`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed onContextMenu in BuildButtons');
