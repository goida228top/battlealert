
export function undeployConstructionYard(this: any, yardId: string, providedMcvId?: string) {
  const mcvId = providedMcvId || `mcv-${Date.now()}-${Math.random()}`;
  
  if (this.role === 'CLIENT' || this.role === 'HOST') {
      this.socket.emit('client_command', {
          roomId: this.roomId,
          command: { type: 'UNDEPLOY_YARD', yardId, mcvId }
      });
      return; // Только отправляем команду
  }

  const yardIndex = this.state.entities.findIndex((e: any) => e.id === yardId);
  if (yardIndex === -1) return;

  const yard = this.state.entities[yardIndex];
  if (yard.subType !== 'CONSTRUCTION_YARD' && yard.subType !== 'ALLIED_CONSTRUCTION_YARD') return;

  // Replace Construction Yard with MCV
  this.state.entities.splice(yardIndex, 1);
  this.state.entities.push({
    id: mcvId,
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
