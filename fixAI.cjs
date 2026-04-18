const fs = require('fs');
const f = 'src/game/systems/updateAI.ts';
let d = fs.readFileSync(f, 'utf8');
d = d.replace(/getCredits\(/g, 'getCreditsLocal(');
d = d.replace(/getQueue\(/g, 'getQueueLocal(');
d = d.replace(/getSpecial\(/g, 'getSpecialLocal(');
d = d.replace(/setCredits\(/g, 'addCredits(');
fs.writeFileSync(f, d);
console.log('done');
