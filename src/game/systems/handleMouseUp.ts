
import { getBuildingDimensions } from './getBuildingDimensions';

export function handleMouseUp(this: any) {
  if (this.state.selectionBox) {
    const { start, end } = this.state.selectionBox;
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const yMin = Math.min(start.y, end.y);
    const yMax = Math.max(start.y, end.y);

    const isSingleClick = Math.abs(start.x - end.x) < 5 && Math.abs(start.y - end.y) < 5;
    const timestamp = performance.now();

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

        if (newlySelected && !entity.selected && entity.type === 'UNIT') {
          // No response text
        }
        entity.selected = newlySelected;
      }
    });

    this.state.selectionBox = null;
  }
}
