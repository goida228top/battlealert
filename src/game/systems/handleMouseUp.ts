
import { getBuildingDimensions } from './getBuildingDimensions';

export function handleMouseUp(this: any, isAdditive: boolean = false) {
  if (this.state.selectionBox) {
    const { start, end } = this.state.selectionBox;
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const yMin = Math.min(start.y, end.y);
    const yMax = Math.max(start.y, end.y);

    const isSingleClick = Math.abs(start.x - end.x) < 5 && Math.abs(start.y - end.y) < 5;
    const timestamp = performance.now();

    if (isSingleClick && this.pendingOrder) {
      const { pos, clickedEntity, isEnemy, isForceAttack, isEngineerAction, isServiceDepotAction, selectedUnits } = this.pendingOrder;

      if (!clickedEntity) {
        this.state.moveMarkers.push({ position: { ...pos }, startTime: timestamp });
      }

      selectedUnits.forEach((entity: any) => {
        const responses = clickedEntity && isEnemy ? ['Target acquired', 'Attacking', 'Destroy!'] : ['Moving', 'Affirmative', 'Yes, sir!'];
        entity.selectionResponse = responses[Math.floor(Math.random() * responses.length)];
        entity.selectionResponseTime = timestamp;
      });

      if (this.role === 'CLIENT' || this.role === 'HOST') {
          this.socket.emit('client_command', {
              roomId: this.roomId,
              command: {
                  type: 'MOVE_OR_ATTACK',
                  unitIds: selectedUnits.map((u:any) => u.id),
                  targetPos: !clickedEntity ? pos : undefined,
                  targetId: clickedEntity ? clickedEntity.id : undefined
              }
          });
      } else {
          // OFFLINE mode execution
          if (clickedEntity && isEnemy) {
              selectedUnits.forEach((u: any) => {
                  u.targetId = clickedEntity.id;
                  u.explicitAttack = true;
                  u.targetPosition = undefined;
                  u.path = undefined;
              });
          } else if (clickedEntity && isEngineerAction) {
              selectedUnits.forEach((u: any) => {
                  if (u.subType === 'ENGINEER') {
                    u.targetId = clickedEntity.id;
                    u.targetPosition = undefined;
                  }
              });
          } else if (clickedEntity && isServiceDepotAction) {
              selectedUnits.forEach((u: any) => {
                  this.issueMoveOrder([u], clickedEntity.position);
                  u.targetId = clickedEntity.id; 
                  u.isRepairing = true; 
              });
          } else {
              this.issueMoveOrder(selectedUnits, pos);
              selectedUnits.forEach((u: any) => {
                  u.explicitAttack = false;
                  u.targetId = undefined;
              });
          }
      }
      
      this.pendingOrder = null;
      this.state.selectionBox = null;
      return;
    }

    this.pendingOrder = null;

    this.state.entities.forEach((entity: any) => {
      if (entity.owner === this.localPlayerId) {
        let newlySelected = false;
        if (isSingleClick) {
          if (entity.type === 'BUILDING') {
            const dims = getBuildingDimensions(entity.subType);
            const w = dims.w * this.state.map.tileSize;
            const h = dims.h * this.state.map.tileSize;
            newlySelected = start.x >= entity.position.x - w/2 && start.x <= entity.position.x + w/2 &&
                           start.y >= entity.position.y - h/2 && start.y <= entity.position.y + h/2;
          } else {
            const dx = entity.position.x - start.x;
            const dy = entity.position.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            newlySelected = dist < entity.size / 1.5;
          }
        } else if (entity.type === 'UNIT') {
          newlySelected = 
            entity.position.x >= xMin && 
            entity.position.x <= xMax && 
            entity.position.y >= yMin && 
            entity.position.y <= yMax;
        }

        if (isAdditive) {
           if (newlySelected) entity.selected = true;
        } else {
           entity.selected = newlySelected;
        }
      }
    });

    this.state.selectionBox = null;
  }
}
