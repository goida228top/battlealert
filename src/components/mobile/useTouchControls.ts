import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../../game/GameEngine';

export function useTouchControls(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  engineRef: React.MutableRefObject<GameEngine | null>,
  isCommandMode: boolean = false,
  appState: string = 'MAIN_MENU',
  mousePosRef?: React.MutableRefObject<any>
) {
  const touchState = useRef({
    initialPinchDistance: 0,
    initialZoom: 1,
    lastPanX: 0,
    lastPanY: 0,
    isPinching: false,
    
    // Single touch logic
    startX: 0,
    startY: 0,
    startTime: 0,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    isLongPressTriggered: false,
    hasMoved: false,
    isLeftDragStarted: false,
    lastTapTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Don't preventDefault here to allow clicks on UI elements if any overlay canvas, but we mostly have full canvas.
      // Wait, we need e.preventDefault to stop scroll, but only for canvas.
      if (e.target === canvas) e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();

      if (e.touches.length === 2) {
        // Cancel single touch logic
        if (touchState.current.longPressTimer) clearTimeout(touchState.current.longPressTimer);
        
        touchState.current.isPinching = true;
        touchState.current.initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        const center = getCenter(e.touches[0], e.touches[1]);
        touchState.current.lastPanX = center.x;
        touchState.current.lastPanY = center.y;
        if (engineRef.current) {
          touchState.current.initialZoom = engineRef.current.state.camera.zoom;
        }
      } else if (e.touches.length === 1 && !touchState.current.isPinching) {
        const touch = e.touches[0];
        
        touchState.current.startX = touch.clientX;
        touchState.current.startY = touch.clientY;
        touchState.current.lastPanX = touch.clientX;
        touchState.current.lastPanY = touch.clientY;
        touchState.current.startTime = performance.now();
        touchState.current.hasMoved = false;
        touchState.current.isLongPressTriggered = false;
        touchState.current.isLeftDragStarted = false;

        if (touchState.current.longPressTimer) clearTimeout(touchState.current.longPressTimer);

        touchState.current.longPressTimer = setTimeout(() => {
          if (!touchState.current.hasMoved && engineRef.current) {
             touchState.current.isLongPressTriggered = true;
             const screenPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
             const worldPos = engineRef.current.screenToWorld(screenPos);
             // ПКМ (Right Click)
             engineRef.current.handleMouseDown(worldPos, true, false);
          }
        }, 400); // 400ms for long press
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === canvas) e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const engine = engineRef.current;
      if (!engine) return;

      if (e.touches.length === 2) {
        // Handle Pan
        const center = getCenter(e.touches[0], e.touches[1]);
        
        const { camera } = engine.state;

        const panX = center.x - touchState.current.lastPanX;
        const panY = center.y - touchState.current.lastPanY;
        
        // Pan
        camera.x += panX;
        camera.y += panY;

        touchState.current.lastPanX = center.x;
        touchState.current.lastPanY = center.y;
      } else if (e.touches.length === 1 && !touchState.current.isPinching) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchState.current.startX;
        const dy = touch.clientY - touchState.current.startY;
        
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
           touchState.current.hasMoved = true;
           
           if (isCommandMode && !touchState.current.isLongPressTriggered) {
              // Rapid drag -> ЛКМ (Left Click Drag) for selection box
              if (touchState.current.longPressTimer) clearTimeout(touchState.current.longPressTimer);
              
              if (!touchState.current.isLeftDragStarted) {
                 touchState.current.isLeftDragStarted = true;
                 const startScreenPos = { x: touchState.current.startX - rect.left, y: touchState.current.startY - rect.top };
                 const startWorldPos = engine.screenToWorld(startScreenPos);
                 engine.handleMouseDown(startWorldPos, false, false);
              }
              
              const screenPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
              const worldPos = engine.screenToWorld(screenPos);
              engine.handleMouseMove(worldPos);
           } else {
              // Drag -> Camera Pan (middle mouse equivalent)
              if (touchState.current.longPressTimer) clearTimeout(touchState.current.longPressTimer);
              const panX = touch.clientX - touchState.current.lastPanX;
              const panY = touch.clientY - touchState.current.lastPanY;
              engine.state.camera.x += panX;
              engine.state.camera.y += panY;
           }
        }
        
        touchState.current.lastPanX = touch.clientX;
        touchState.current.lastPanY = touch.clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.target === canvas) e.preventDefault();
      if (touchState.current.longPressTimer) clearTimeout(touchState.current.longPressTimer);

      if (e.touches.length < 2) {
        touchState.current.isPinching = false;
      }
      
      if (e.touches.length === 0) {
        const engine = engineRef.current;
        if (engine) {
          if (!touchState.current.hasMoved && !touchState.current.isLongPressTriggered) {
             // Quick Tap -> ЛКМ (Left Click)
             const rect = canvas!.getBoundingClientRect();
             const screenPos = { x: touchState.current.startX - rect.left, y: touchState.current.startY - rect.top };
             const worldPos = engine.screenToWorld(screenPos);
             
             if (engine.state.placingBuilding && mousePosRef) {
                 mousePosRef.current = screenPos;
             } else {
                 // Check for double click logic handled automatically by GameEngine 
                 // but we must send Mousedown then Mouseup quickly
                 engine.handleMouseDown(worldPos, false, false);
                 engine.handleMouseUp(false); // isAdditive = false
             }
             
          } else if (touchState.current.isLeftDragStarted) {
             // Finish Left Drag
             engine.handleMouseUp(false);
          } else if (touchState.current.isLongPressTriggered) {
             // Finish Right Click / Right Drag
             engine.handleMouseUp(false);
          }
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [canvasRef, engineRef, isCommandMode, appState]);
}
