const fs = require('fs');

function processBuildings(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const handleCancel = [\s\S]*?};\n/, `const handleCancel = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    const item = activeQueue.find(q => q.subType === type);
    if (item) {
      if (!item.paused && item.progress < 100) {
        item.paused = true;
      } else {
        engineRef.current.removeFromQueue(item.id);
        if (gameState.placingBuilding === type) {
          engineRef.current.state.placingBuilding = null;
        }
      }
      setGameState({ ...engineRef.current.state });
    }
  };

  const handleClick = (type: string) => {
    const item = activeQueue.find(q => q.subType === type);
    if (item && item.paused) {
      item.paused = false;
    } else if (item && item.progress >= 100) {
      if (gameState.placingBuilding === type) {
        engineRef.current.state.placingBuilding = null;
      } else {
        engineRef.current.startPlacing(type as any);
      }
    } else if (!item) {
      engineRef.current.startProduction(type as any);
    }
    setGameState({ ...engineRef.current.state });
  };\n`);
  
  // Replace onClicks
  content = content.replace(/onClick=\{\(\) => \{[\s\S]*?setGameState\(\{ \.\.\.engineRef\.current\.state \}\);\s*\}\}/g, (match) => {
    const typeMatch = match.match(/subType === '([^']+)'/);
    if (typeMatch) {
      return `onClick={() => handleClick('${typeMatch[1]}')}`;
    }
    return match;
  });

  // Add paused prop to BuildButton
  content = content.replace(/progress=\{activeQueue\.find\(q => q\.subType === '([^']+)'\)\?\.progress\}/g, (match, p1) => {
    return `${match} paused={activeQueue.find(q => q.subType === '${p1}')?.paused}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

function processUnits(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const handleCancel = [\s\S]*?};\n/, `const handleCancel = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    const items = activeQueue.filter(q => q.subType === type);
    if (items.length > 0) {
      const activeItem = items.find(q => q.progress > 0 && q.progress < 100) || items[0];
      if (activeItem && !activeItem.paused && activeItem.progress < 100) {
        activeItem.paused = true;
      } else {
        const lastItem = items[items.length - 1];
        engineRef.current.removeFromQueue(lastItem.id);
      }
      setGameState({ ...engineRef.current.state });
    }
  };

  const handleClick = (type: string) => {
    const items = activeQueue.filter(q => q.subType === type);
    const activeItem = items.find(q => q.paused);
    if (activeItem) {
       activeItem.paused = false;
    } else {
       engineRef.current.startProduction(type as any);
    }
    setGameState({ ...engineRef.current.state });
  };\n`);

  // Replace onClicks
  content = content.replace(/onClick=\{\(\) => \{[\s\S]*?setGameState\(\{ \.\.\.engineRef\.current\.state \}\);\s*\}\}/g, (match) => {
    const typeMatch = match.match(/subType === '([^']+)'/);
    if (!typeMatch) {
        const typeMatch2 = match.match(/startProduction\('([^']+)'/);
        if (typeMatch2) return `onClick={() => handleClick('${typeMatch2[1]}')}`;
    }
    if (typeMatch) {
      return `onClick={() => handleClick('${typeMatch[1]}')}`;
    }
    return match;
  });

  // Add paused prop to BuildButton
  content = content.replace(/progress=\{activeQueue\.find\(q => q\.subType === '([^']+)'\)\?\.progress\}/g, (match, p1) => {
    return `${match} paused={activeQueue.find(q => q.subType === '${p1}')?.paused}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

processBuildings('src/components/tabs/BuildingsTab.tsx');
processBuildings('src/components/tabs/DefenseTab.tsx');
processUnits('src/components/tabs/InfantryTab.tsx');
processUnits('src/components/tabs/VehiclesTab.tsx');
