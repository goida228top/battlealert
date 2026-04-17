
export function undeployConstructionYard(this: any, yardId: string) {
  const yardIndex = this.state.entities.findIndex((e: any) => e.id === yardId);
  if (yardIndex === -1) return;

  const yard = this.state.entities[yardIndex];
  if (yard.subType !== 'CONSTRUCTION_YARD' && yard.subType !== 'ALLIED_CONSTRUCTION_YARD') return;

  // Replace Construction Yard with MCV
  this.state.entities.splice(yardIndex, 1);
  this.state.entities.push({
    id: `mcv-${Date.now()}`,
    type: 'UNIT',
    subType: yard.subType === 'ALLIED_CONSTRUCTION_YARD' ? 'ALLIED_MCV' : 'MCV',
    position: { ...yard.position },
    health: yard.health,
    maxHealth: yard.maxHealth,
    owner: yard.owner,
    size: 40,
    speed: 1.5,
    rotation: 0,
    selected: true,
  });

  this.lastClickTime = 0;
  this.lastClickedEntityId = null;
}
