import fs from 'fs';

let content = fs.readFileSync('src/game/systems/updateAI.ts', 'utf8');

const botLoopWrapper = `import { GameEngine } from '../GameEngine';
import { Entity, Vector2, BuildingType, UnitType } from '../types';

export function updateAI(this: GameEngine, timestamp: number): void {
  const bots = Object.keys(this.state.playerMappings || {}).filter(k => this.state.playerMappings![k] === 'AI' || this.state.playerMappings![k] === 'BOT');
  // Fallback if mappings not ready
  if (bots.length === 0) bots.push('AI');
  
  // Create state objects if they don't exist
  if (!this.aiStates) this.aiStates = {};

  bots.forEach(botOwner => {
     let aiId = botOwner;
     if (!this.aiStates[aiId]) {
        this.aiStates[aiId] = {
           knownPlayerBase: null,
           nextBuildTime: 0,
           scoutTime: 0,
           attackTime: 0
        };
     }
     const botState = this.aiStates[aiId];

     // Use helper functions or directly map to the owner string
     // owner inside this function refers to botOwner
     const setCredits = (amount) => {
         if (botOwner === 'AI') this.state.aiCredits += amount;
         else if (botOwner === 'PLAYER_3') this.state.p3Credits = (this.state.p3Credits || 0) + amount;
         else if (botOwner === 'PLAYER_4') this.state.p4Credits = (this.state.p4Credits || 0) + amount;
     };
     const getCredits = () => {
         if (botOwner === 'AI') return this.state.aiCredits;
         if (botOwner === 'PLAYER_3') return this.state.p3Credits || 0;
         if (botOwner === 'PLAYER_4') return this.state.p4Credits || 0;
         return 0;
     };
     const getQueue = () => {
         if (botOwner === 'AI') return this.state.aiProductionQueue;
         if (botOwner === 'PLAYER_3') return this.state.p3ProductionQueue || [];
         if (botOwner === 'PLAYER_4') return this.state.p4ProductionQueue || [];
         return [];
     };
     const getSpecial = () => {
         if (botOwner === 'AI') return this.state.aiSpecialAbilities;
         if (botOwner === 'PLAYER_3') return this.state.p3SpecialAbilities;
         if (botOwner === 'PLAYER_4') return this.state.p4SpecialAbilities;
         return this.state.aiSpecialAbilities;
     };

     // The core logic starts here:
`;

content = content.replace(/import \{.*?\}.*?;\nimport \{.*?\}.*?;\n\nexport function updateAI.*?\{/, botLoopWrapper);

content = content.replace(/e\.owner === 'AI'/g, "e.owner === botOwner");
content = content.replace(/this\.aiKnownPlayerBase/g, "botState.knownPlayerBase");
content = content.replace(/this\.aiNextBuildTime/g, "botState.nextBuildTime");
content = content.replace(/this\.aiScoutTime/g, "botState.scoutTime");
content = content.replace(/this\.aiAttackTime/g, "botState.attackTime");
content = content.replace(/this\.state\.aiCredits \+= 5/g, "setCredits(5)");
content = content.replace(/this\.state\.aiCredits/g, "getCredits()");
content = content.replace(/this\.state\.aiProductionQueue/g, "getQueue()");
content = content.replace(/this\.state\.aiSpecialAbilities/g, "getSpecial()");
content = content.replace(/, 'AI'\)/g, ", botOwner)");

content += "\n  });\n}\n";

fs.writeFileSync('src/game/systems/updateAI.ts', content);
