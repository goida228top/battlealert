const fs = require('fs');
const path = require('path');

const dir = 'src/components/tabs';
const files = fs.readdirSync(dir).map(f => path.join(dir, f)).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // A better approach: search for onClick={() => engineRef.current.startProduction('X')}
  // and see if the next lines have onContextMenu. If not, add it.
  
  // We can just regex replace all occurrences of `onClick={() => engineRef.current.startProduction('X')}`
  // to include the onContextMenu as well.
  
  // Or even simpler, replace globally, but cleanly.
  const regex = /onClick=\{\(\) => engineRef\.current\.start(?:Production|Placing)\('([^']+)'\)\}/g;
  
  let newContent = content.replace(regex, (match, typeName, offset, fullString) => {
    // Check if onContextMenu is shortly after
    const lookAhead = fullString.substring(offset, offset + 150);
    if (lookAhead.includes('onContextMenu={')) {
      return match;
    }
    return `${match}\n                    onContextMenu={(e) => handleCancel('${typeName}', e)}`;
  });

  fs.writeFileSync(file, newContent, 'utf8');
  console.log(`Processed ${file}`);
}
