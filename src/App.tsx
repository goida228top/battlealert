import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { BuildingType, GameState, Vector2 } from './game/types';
import { getBuildingDimensions } from './game/systems/getBuildingDimensions';
import { FogOfWar } from './game/systems/FogOfWar';
import { Zap, Shield, Factory, Coins, MousePointer2, Users, Truck, Wrench, DollarSign, XCircle, Lock, Radar, Activity, Crosshair, Skull, Target, Wind, Layers, ShieldAlert, Bomb, Cpu, Anchor, Waves, Square, User, Car, Check, Trash2 } from 'lucide-react';
import { MainMenu } from './components/MainMenu';
import { SkirmishSetup } from './components/SkirmishSetup';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerCreateRoom } from './components/MultiplayerCreateRoom';
import { MultiplayerRoom } from './components/MultiplayerRoom';
import { SettingsMenu } from './components/SettingsMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { BuildButton } from './components/BuildButton';
import { GameHUD } from './components/GameHUD';
import { DebugMenu } from './components/DebugMenu';
import { FPSCounter } from './components/FPSCounter';
import { useTouchControls } from './components/mobile/useTouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isCommandMode, setIsCommandMode] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      const docElm = document.documentElement as any;
      const requestMethod = docElm.requestFullscreen || docElm.webkitRequestFullScreen || docElm.mozRequestFullScreen || docElm.msRequestFullscreen;
      
      if (requestMethod) {
        requestMethod.call(docElm).catch((err: any) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const texturesRef = useRef<Record<string, HTMLImageElement | HTMLCanvasElement>>({});
  const texturesLoadedCountRef = useRef<number>(0);
  const cachedMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fogOfWarRef = useRef<FogOfWar>(new FogOfWar());
  const requestRef = useRef<number>(0);
  const [appState, setAppState] = useState<'MENU' | 'SKIRMISH_SETUP' | 'PLAYING' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_CREATE' | 'MULTIPLAYER_ROOM' | 'SETTINGS'>('MENU');
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('battle_alert_settings');
    try {
      return saved ? JSON.parse(saved) : { showMobileControls: false };
    } catch {
      return { showMobileControls: false };
    }
  });

  useEffect(() => {
    localStorage.setItem('battle_alert_settings', JSON.stringify(settings));
  }, [settings]);
  const [selectedFaction, setSelectedFaction] = useState<'FEDERATION' | 'COALITION'>('FEDERATION');
  const [selectedCountry, setSelectedCountry] = useState<'RUSSIA' | 'CUBA' | 'LIBYA' | 'IRAQ' | 'AMERICA' | 'BRITAIN' | 'FRANCE' | 'GERMANY' | 'KOREA'>('RUSSIA');
  const [selectedMap, setSelectedMap] = useState<string>('RIVER_DIVIDE');
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(undefined);
  const [playerName, setPlayerName] = useState<string>('Командир_' + Math.floor(Math.random() * 100));
  const mousePosRef = useRef<Vector2 | null>(null);

  useTouchControls(canvasRef, engineRef, isCommandMode, appState, mousePosRef);

  const globalMousePosRef = useRef<Vector2 | null>(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      globalMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleGlobalMouseLeave = () => {
      globalMousePosRef.current = null;
    };
    const handleGlobalTouchStart = () => {
      globalMousePosRef.current = null; // Clear on touch to aggressively prevent edge pan drift on mobile
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, []);

  useEffect(() => {
    const loadTexture = (name: string, url: string) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        console.log(`Texture loaded: ${name} from ${url}`);
        texturesRef.current = { ...texturesRef.current, [name]: img };
        texturesLoadedCountRef.current += 1;
      };
      img.onerror = () => {
        console.error(`Failed to load texture: ${name} from ${url}. Make sure the file exists and is a valid image.`);
      };
    };

    // Local textures - Put your .png files in /public/assets/
    loadTexture('GRASS', '/assets/grass.png');
    loadTexture('WATER', '/assets/water.png');
    loadTexture('GRASS_TO_WATER', '/assets/grasstowater.png');
    loadTexture('DESERT_GRASS', '/assets/desert_grass.png');
    loadTexture('DESERT_WATER', '/assets/desert_water.png');
    loadTexture('DESERT_GRASS_TO_WATER', '/assets/desert_grasstowater.png');
    loadTexture('SNOW_GRASS', '/assets/snow_grass.png');
    loadTexture('SNOW_WATER', '/assets/snow_water.png');
    loadTexture('SNOW_GRASS_TO_WATER', '/assets/snow_grasstowater.png');
    loadTexture('BRIDGE', '/assets/most.png');
    loadTexture('BASE_CIRCLE', '/assets/krugpeska.png');
    loadTexture('ROAD', '/assets/sandroad.png');
    loadTexture('ROAD_CORNER', '/assets/sandugol.png');
    loadTexture('ORE', '/assets/goldore.png');
    loadTexture('SOVIET_MCV', '/assets/soviet_mcv.png');
    loadTexture('ALLIED_MCV', '/assets/allied_mcv.png');
    loadTexture('SOVIET_BASE', '/assets/soviet_base.png');
    loadTexture('ALLIED_BASE', '/assets/allied_base.png');
    loadTexture('POWER_PLANT', '/assets/power_plant.png');
    loadTexture('ORE_REFINERY', '/assets/refinery.png');
    loadTexture('BARRACKS', '/assets/barracks.png');
    loadTexture('WAR_FACTORY', '/assets/war_factory.png');
    loadTexture('TANK', '/assets/tank.png');
    loadTexture('HARVESTER', '/assets/harvester.png');
    loadTexture('SOLDIER', '/assets/soldier.png');
    loadTexture('CRATE', '/assets/crate.png');
    loadTexture('OIL_DERRICK', '/assets/oil_derrick.png');
  }, []);

  // Add ref to track last logic update
  const lastLogicTimeRef = useRef<number>(performance.now());
  const lastUiUpdateRef = useRef<number>(0);

  const logicUpdate = () => {
    const now = performance.now();
    let dt = now - lastLogicTimeRef.current;
    
    // Cap dt to prevent massive jump if the tab was suspended for a long time
    // but allow enough to catch up background throttling.
    if (dt > 1000) dt = 16; 
    lastLogicTimeRef.current = now;

    try {
      engineRef.current.update(now);
      
      // Update React state occasionally for UI (credits, counts, etc)
      if (now - lastUiUpdateRef.current > 150) {
        setGameState({ ...engineRef.current.state });
        lastUiUpdateRef.current = now;
      }
    } catch (err) {
      console.error("Logic loop error:", err);
    }
  };

  const drawLoop = (time: number) => {
    // Edge panning (Drawing loop handles input/panning for smoothness)
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (appState === 'PLAYING' && globalMousePosRef.current && canvasRef.current && window.innerWidth > 768 && !isTouchDevice) {
      const dt = 16; // Standard frame target
      const maxScrollSpeed = 1.0 * dt;
      const edgeThreshold = 60;
      const { camera } = engineRef.current.state; 
      const x = globalMousePosRef.current.x;
      const y = globalMousePosRef.current.y;

      let dx = 0;
      let dy = 0;

      if (x < edgeThreshold) {
        dx = maxScrollSpeed * (1 - Math.max(0, x) / edgeThreshold);
      } else if (x > windowSize.width - edgeThreshold) {
        dx = -maxScrollSpeed * (1 - Math.max(0, windowSize.width - x) / edgeThreshold);
      }

      if (y < edgeThreshold) {
        dy = maxScrollSpeed * (1 - Math.max(0, y) / edgeThreshold);
      } else if (y > windowSize.height - edgeThreshold) {
        dy = -maxScrollSpeed * (1 - Math.max(0, windowSize.height - y) / edgeThreshold);
      }
      
      camera.x += dx;
      camera.y += dy;
    }

    draw();
    requestRef.current = requestAnimationFrame(drawLoop);
  };

  useEffect(() => {
    if (appState === 'PLAYING') {
      // Logic loop runs in setInterval to stay alive in background
      const logicInterval = setInterval(logicUpdate, 1000 / 60);
      // Draw loop runs in requestAnimationFrame for smooth visuals
      requestRef.current = requestAnimationFrame(drawLoop);
      
      return () => {
        clearInterval(logicInterval);
        cancelAnimationFrame(requestRef.current);
      };
    }
  }, [appState]);
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // USE ENGINE STATE DIRECTLY FOR RENDERING - Avoids React state synchronization lag
    const gameState = engineRef.current.state;
    const { camera, map } = gameState;

    // Clamp camera to map boundaries
    const mapWidthPx = map.width * map.tileSize * camera.zoom;
    const mapHeightPx = map.height * map.tileSize * camera.zoom;
    
    let minCamX = canvas.width - mapWidthPx;
    let maxCamX = 0;
    if (minCamX > maxCamX) minCamX = maxCamX = (canvas.width - mapWidthPx) / 2;

    let minCamY = canvas.height - mapHeightPx;
    let maxCamY = 0;
    if (minCamY > maxCamY) minCamY = maxCamY = (canvas.height - mapHeightPx) / 2;

    camera.x = Math.max(minCamX, Math.min(maxCamX, camera.x));
    camera.y = Math.max(minCamY, Math.min(maxCamY, camera.y));

    // Use black for void outside the map
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enable Smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    // Apply camera transform
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Render Tiles with Culling
    const { tileSize: mapTileSize, tiles, width: mapWidthVal, height: mapHeightVal, visibility } = map;

    // Draw water only as the map background (not infinite)
    ctx.fillStyle = map.theme === 'DESERT' ? '#4682b4' : map.theme === 'SNOW' ? '#add8e6' : '#00008b';
    ctx.fillRect(0, 0, mapWidthVal * mapTileSize, mapHeightVal * mapTileSize);
    
    // --- MAP CACHING LOGIC ---
    if (!cachedMapCanvasRef.current || 
        cachedMapCanvasRef.current.width !== mapWidthVal * mapTileSize || 
        cachedMapCanvasRef.current.getAttribute('data-textures') !== String(texturesLoadedCountRef.current) ||
        cachedMapCanvasRef.current.getAttribute('data-generation') !== String(gameState.map.generation || 0)) {
      
      const cacheCanvas = document.createElement('canvas');
      cacheCanvas.width = mapWidthVal * mapTileSize;
      cacheCanvas.height = mapHeightVal * mapTileSize;
      const cacheCtx = cacheCanvas.getContext('2d', { alpha: false });
      
      if (cacheCtx) {
        // Fill cache with water color first
        cacheCtx.fillStyle = map.theme === 'DESERT' ? '#4682b4' : map.theme === 'SNOW' ? '#add8e6' : '#00008b';
        cacheCtx.fillRect(0, 0, cacheCanvas.width, cacheCanvas.height);

        for (let y = 0; y < mapHeightVal; y++) {
          for (let x = 0; x < mapWidthVal; x++) {
            const type = tiles[y][x];
            
            let textureName = type === 'WATER_TO_GRASS' ? 'GRASS_TO_WATER' : type;
            if (map.theme === 'DESERT' && type !== 'ORE') {
              textureName = 'DESERT_' + textureName;
            } else if (map.theme === 'SNOW' && type !== 'ORE') {
              textureName = 'SNOW_' + textureName;
            }
            const texture = texturesRef.current[textureName];

            let grassTextureName = 'GRASS';
            if (map.theme === 'DESERT') grassTextureName = 'DESERT_GRASS';
            if (map.theme === 'SNOW') grassTextureName = 'SNOW_GRASS';
            const grassTexture = texturesRef.current[grassTextureName];

            // If it's ORE, draw grass background first
            if (type === 'ORE') {
              if (grassTexture && grassTexture.width > 0) {
                cacheCtx.drawImage(grassTexture, x * mapTileSize, y * mapTileSize, mapTileSize + 0.5, mapTileSize + 0.5);
              } else {
                cacheCtx.fillStyle = map.theme === 'DESERT' ? '#d2b48c' : map.theme === 'SNOW' ? '#ffffff' : '#2d5a27'; // Grass fallback
                cacheCtx.fillRect(x * mapTileSize, y * mapTileSize, mapTileSize + 0.5, mapTileSize + 0.5);
              }

              // Draw the ORE texture (picking one of the 6 frames based on coordinates to avoid squashing and add variety)
              if (texture && texture.width > 0) {
                const frameX = (x % 3) * (texture.width / 3);
                const frameY = (y % 2) * (texture.height / 2);
                cacheCtx.drawImage(
                  texture,
                  frameX, frameY, texture.width / 3, texture.height / 2, // Source frame
                  x * mapTileSize, y * mapTileSize, mapTileSize, mapTileSize // Destination
                );
              }
            }
            
            if (texture && texture.width > 0 && type !== 'ORE') {
              // Use a tiny overlap (0.5px) to prevent seams
              if (type === 'GRASS_TO_WATER' || type === 'WATER_TO_GRASS') {
                cacheCtx.save();
                cacheCtx.translate(x * mapTileSize + mapTileSize / 2, y * mapTileSize + mapTileSize / 2);
                cacheCtx.rotate(type === 'GRASS_TO_WATER' ? -Math.PI / 2 : Math.PI / 2);
                cacheCtx.drawImage(texture, -mapTileSize / 2, -mapTileSize / 2, mapTileSize + 0.5, mapTileSize + 0.5);
                cacheCtx.restore();
              } else {
                cacheCtx.drawImage(texture, x * mapTileSize, y * mapTileSize, mapTileSize + 0.5, mapTileSize + 0.5);
              }
            } else if (type === 'ELEVATED_GRASS' || type.startsWith('CLIFF_') || type.startsWith('RAMP_')) {
              // RENDER PLATEAUS AND CLIFFS
              const baseX = x * mapTileSize;
              const baseY = y * mapTileSize;
              const PLATEAU_H = 30; // Increased height for better perspective depth

              if (type === 'ELEVATED_GRASS' || type.startsWith('CLIFF_')) {
                // Elevated grass (surface) is shifted UP by PLATEAU_H pixels
                if (grassTexture && grassTexture.width > 0) {
                  cacheCtx.drawImage(grassTexture, baseX, baseY - PLATEAU_H, mapTileSize + 0.5, mapTileSize + 0.5);
                } else {
                  cacheCtx.fillStyle = map.theme === 'DESERT' ? '#d2b48c' : map.theme === 'SNOW' ? '#ffffff' : '#4ade80';
                  cacheCtx.fillRect(baseX, baseY - PLATEAU_H, mapTileSize + 0.5, mapTileSize + 0.5);
                }

                // Draw vertical cliff walls
                if (type === 'CLIFF_S') {
                  cacheCtx.fillStyle = '#475569'; // Main Rock Face
                  cacheCtx.fillRect(baseX, baseY - PLATEAU_H + mapTileSize, mapTileSize + 0.5, PLATEAU_H);
                  cacheCtx.fillStyle = '#334155'; // Darker crags details
                  cacheCtx.fillRect(baseX + 10, baseY - PLATEAU_H + mapTileSize, 15, PLATEAU_H);
                } else if (type === 'CLIFF_W') {
                  cacheCtx.fillStyle = '#334155'; // Side rock face (darker for shading)
                  cacheCtx.fillRect(baseX, baseY - PLATEAU_H + mapTileSize, mapTileSize, PLATEAU_H);
                } else if (type === 'CLIFF_E') {
                  cacheCtx.fillStyle = '#1e293b'; // East side rock face (even darker)
                  cacheCtx.fillRect(baseX, baseY - PLATEAU_H + mapTileSize, mapTileSize, PLATEAU_H);
                }
                // Note: CLIFF_N intentionally draws no wall. Its surface grass perfectly covers 
                // the tiles behind it natively, creating the exact pseudo-isometric hidden back-slope effect.
              } else if (type === 'RAMP_S') {
                // Ramps are drawn as geometric slopes connecting top to bottom
                cacheCtx.fillStyle = '#78350f'; // Dirt track
                cacheCtx.beginPath();
                cacheCtx.moveTo(baseX, baseY - PLATEAU_H); 
                cacheCtx.lineTo(baseX + mapTileSize, baseY - PLATEAU_H); 
                cacheCtx.lineTo(baseX + mapTileSize, baseY + mapTileSize); 
                cacheCtx.lineTo(baseX, baseY + mapTileSize); 
                cacheCtx.fill();
                cacheCtx.strokeStyle = '#451a03';
                cacheCtx.lineWidth = 2;
                cacheCtx.stroke();
              } else if (type === 'RAMP_N') {
                cacheCtx.fillStyle = '#78350f';
                cacheCtx.beginPath();
                cacheCtx.moveTo(baseX, baseY); 
                cacheCtx.lineTo(baseX + mapTileSize, baseY); 
                cacheCtx.lineTo(baseX + mapTileSize, baseY + mapTileSize - PLATEAU_H); 
                cacheCtx.lineTo(baseX, baseY + mapTileSize - PLATEAU_H); 
                cacheCtx.fill();
                cacheCtx.strokeStyle = '#451a03';
                cacheCtx.lineWidth = 2;
                cacheCtx.stroke();
              } else if (type === 'RAMP_E' || type === 'RAMP_W') {
                // Simplified side ramps
                cacheCtx.fillStyle = '#78350f';
                cacheCtx.fillRect(baseX, baseY - PLATEAU_H/2, mapTileSize, mapTileSize + PLATEAU_H/2);
              }
            } else if (type !== 'ORE') {
              // Fallback colors
              if (type === 'GRASS') cacheCtx.fillStyle = map.theme === 'DESERT' ? '#d2b48c' : map.theme === 'SNOW' ? '#ffffff' : '#2d5a27';
              else if (type === 'WATER') cacheCtx.fillStyle = map.theme === 'DESERT' ? '#4682b4' : map.theme === 'SNOW' ? '#add8e6' : '#00008b';
              else if (type === 'GRASS_TO_WATER' || type === 'WATER_TO_GRASS') cacheCtx.fillStyle = map.theme === 'DESERT' ? '#8b7355' : map.theme === 'SNOW' ? '#b0e0e6' : '#1a4a4a';
              else if (type === 'MOUNTAIN_DECOR') cacheCtx.fillStyle = '#1e3a1a'; // Very dark green
              else if (type === 'DEBUG_RED') cacheCtx.fillStyle = '#ff0000'; // Red debugging
              else if (type === 'MOUNTAIN_GRASS') cacheCtx.fillStyle = map.theme === 'DESERT' ? '#b4956d' : map.theme === 'SNOW' ? '#e2e8f0' : '#224a1e';
              cacheCtx.fillRect(x * mapTileSize, y * mapTileSize, mapTileSize + 0.5, mapTileSize + 0.5);
            } else if (type === 'ORE' && (!texture || texture.width === 0)) {
              // Gold fallback for ORE if texture is missing
              cacheCtx.fillStyle = '#ffd700';
              cacheCtx.fillRect(x * mapTileSize, y * mapTileSize, mapTileSize + 0.5, mapTileSize + 0.5);
            }
          }
        }

        // Render Bridges
        const bridgeTexture = texturesRef.current['BRIDGE'];
        gameState.map.bridges.forEach(bridge => {
          if (bridgeTexture && bridgeTexture.width > 0) {
            // Draw bridge as a single image to avoid stretching/tiling issues
            cacheCtx.drawImage(
              bridgeTexture,
              bridge.x * mapTileSize,
              bridge.y * mapTileSize,
              bridge.width * mapTileSize,
              bridge.height * mapTileSize
            );
          } else {
            // Draw a nice procedurally generated bridge
            cacheCtx.save();
            const bx = bridge.x * mapTileSize;
            const by = bridge.y * mapTileSize;
            const bw = bridge.width * mapTileSize;
            const bh = bridge.height * mapTileSize;

            // Main bridge base (Shadow/Structural)
            cacheCtx.fillStyle = '#27272a'; // Dark grey
            cacheCtx.fillRect(bx, by, bw, bh);

            // bridge floor (Reddish Brown / Wood)
            cacheCtx.fillStyle = '#78350f'; // Dark brown
            const floorMargin = 2;
            cacheCtx.fillRect(bx + floorMargin, by + floorMargin, bw - floorMargin*2, bh - floorMargin*2);

            // Wood planks effect / texture
            cacheCtx.lineWidth = 1;
            if (bw > bh) {
              // Horizontal bridge, planks are vertical
              for (let x = bx + 4; x < bx + bw - 4; x += 8) {
                cacheCtx.strokeStyle = '#451a03'; // Darker brown
                cacheCtx.beginPath();
                cacheCtx.moveTo(x, by + floorMargin);
                cacheCtx.lineTo(x, by + bh - floorMargin);
                cacheCtx.stroke();
                
                // Highlight on plank edge
                cacheCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                cacheCtx.beginPath();
                cacheCtx.moveTo(x + 1, by + floorMargin);
                cacheCtx.lineTo(x + 1, by + bh - floorMargin);
                cacheCtx.stroke();
              }
            } else {
              // Vertical bridge, planks are horizontal
              for (let y = by + 4; y < by + bh - 4; y += 8) {
                cacheCtx.strokeStyle = '#451a03';
                cacheCtx.beginPath();
                cacheCtx.moveTo(bx + floorMargin, y);
                cacheCtx.lineTo(bx + bw - floorMargin, y);
                cacheCtx.stroke();

                // Highlight
                cacheCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                cacheCtx.beginPath();
                cacheCtx.moveTo(bx + floorMargin, y + 1);
                cacheCtx.lineTo(bx + bw - floorMargin, y + 1);
                cacheCtx.stroke();
              }
            }

            // High-quality side railings
            const railW = 4;
            if (bw > bh) {
              // Horizontal bridge railings (top and bottom)
              cacheCtx.fillStyle = '#92400e'; // Mid brown
              cacheCtx.fillRect(bx, by, bw, railW); // Top rail
              cacheCtx.fillRect(bx, by + bh - railW, bw, railW); // Bottom rail
              
              // Detail line on railings
              cacheCtx.strokeStyle = '#451a03';
              cacheCtx.lineWidth = 1;
              cacheCtx.strokeRect(bx, by, bw, railW);
              cacheCtx.strokeRect(bx, by + bh - railW, bw, railW);

              // Posts
              cacheCtx.fillStyle = '#451a03';
              for (let x = bx; x <= bx + bw; x += 20) {
                cacheCtx.fillRect(x - 3, by - 2, 6, 8); // Top post
                cacheCtx.fillRect(x - 3, by + bh - 6, 6, 8); // Bottom post
              }
            } else {
              // Vertical bridge railings (left and right)
              cacheCtx.fillStyle = '#92400e';
              cacheCtx.fillRect(bx, by, railW, bh); // Left rail
              cacheCtx.fillRect(bx + bw - railW, by, railW, bh); // Right rail

              // Detail line
              cacheCtx.strokeStyle = '#451a03';
              cacheCtx.lineWidth = 1;
              cacheCtx.strokeRect(bx, by, railW, bh);
              cacheCtx.strokeRect(bx + bw - railW, by, railW, bh);

              // Posts
              cacheCtx.fillStyle = '#451a03';
              for (let y = by; y <= by + bh; y += 20) {
                cacheCtx.fillRect(bx - 2, y - 3, 8, 6); // Left post
                cacheCtx.fillRect(bx + bw - 6, y - 3, 8, 6); // Right post
              }
            }

            cacheCtx.restore();
          }
        });

        // Render Roads (Above grass, below base circles)
        const roadTexture = texturesRef.current['ROAD'];
        const cornerTexture = texturesRef.current['ROAD_CORNER'];
        if (roadTexture && roadTexture.width > 0) {
          // 1. Render Corners FIRST
          if (cornerTexture && cornerTexture.width > 0) {
            // Player corners
            [9, 25].forEach(y => {
              cacheCtx.save();
              cacheCtx.translate(6 * mapTileSize + mapTileSize / 2, y * mapTileSize + mapTileSize / 2);
              cacheCtx.rotate(Math.PI); 
              cacheCtx.drawImage(cornerTexture, -mapTileSize / 2, -mapTileSize / 2, mapTileSize, mapTileSize);
              cacheCtx.restore();
            });

            // AI corners
            [9, 25].forEach(y => {
              cacheCtx.save();
              cacheCtx.translate(52 * mapTileSize + mapTileSize / 2, y * mapTileSize + mapTileSize / 2);
              cacheCtx.rotate(Math.PI / 2); 
              cacheCtx.drawImage(cornerTexture, -mapTileSize / 2, -mapTileSize / 2, mapTileSize, mapTileSize);
              cacheCtx.restore();
            });
          }

          // 2. Render Straight Segments
          
          // Player side road
          // Vertical (from base center down to bottom bridge)
          for (let y = 5; y <= 25; y++) {
            cacheCtx.save();
            cacheCtx.translate(6 * mapTileSize + mapTileSize / 2, y * mapTileSize + mapTileSize / 2);
            cacheCtx.rotate(Math.PI / 2);
            cacheCtx.drawImage(roadTexture, -mapTileSize, -mapTileSize / 2, 2 * mapTileSize, mapTileSize);
            cacheCtx.restore();
          }
          // Horizontal roads to both bridges
          [9, 25].forEach(y => {
            for (let x = 6.5; x < 28; x++) {
              cacheCtx.drawImage(roadTexture, x * mapTileSize, y * mapTileSize, 2 * mapTileSize, mapTileSize);
            }
          });

          // AI side road
          // Vertical (from top bridge down to base center)
          for (let y = 9; y <= 27; y++) {
            cacheCtx.save();
            cacheCtx.translate(52 * mapTileSize + mapTileSize / 2, y * mapTileSize + mapTileSize / 2);
            cacheCtx.rotate(Math.PI / 2);
            cacheCtx.drawImage(roadTexture, -mapTileSize, -mapTileSize / 2, 2 * mapTileSize, mapTileSize);
            cacheCtx.restore();
          }
          // Horizontal roads to both bridges
          [9, 25].forEach(y => {
            for (let x = 32; x <= 51.5; x++) {
              cacheCtx.drawImage(roadTexture, x * mapTileSize, y * mapTileSize, 2 * mapTileSize, mapTileSize);
            }
          });
        }

        // Render Base Circles
        const baseCircleTexture = texturesRef.current['BASE_CIRCLE'];
        if (baseCircleTexture && baseCircleTexture.width > 0) {
          // Player Base (7x7)
          cacheCtx.drawImage(
            baseCircleTexture,
            2.5 * mapTileSize,
            1.5 * mapTileSize,
            7 * mapTileSize,
            7 * mapTileSize
          );

          // AI Base (7x7)
          cacheCtx.drawImage(
            baseCircleTexture,
            48.5 * mapTileSize,
            23.5 * mapTileSize,
            7 * mapTileSize,
            7 * mapTileSize
          );
        }
      }
      
      cacheCanvas.setAttribute('data-textures', String(texturesLoadedCountRef.current));
      cacheCanvas.setAttribute('data-generation', String(gameState.map.generation || 0));
      cachedMapCanvasRef.current = cacheCanvas;
    }

    // Calculate view bounds for culling
    const vx = -camera.x / camera.zoom;
    const vy = -camera.y / camera.zoom;
    const vw = canvas.width / camera.zoom;
    const vh = canvas.height / camera.zoom;
    const padding = 60; // Padding for map drawing
    
    // Extened bounds for entity frustum culling
    const cullingMargin = 150; 
    const viewLeft = vx - cullingMargin;
    const viewRight = vx + vw + cullingMargin;
    const viewTop = vy - cullingMargin;
    const viewBottom = vy + vh + cullingMargin;

    // Draw the cached map
    if (cachedMapCanvasRef.current) {
      const sx = Math.max(0, vx - padding);
      const sy = Math.max(0, vy - padding);
      const sw = Math.min(cachedMapCanvasRef.current.width - sx, vw + padding * 2);
      const sh = Math.min(cachedMapCanvasRef.current.height - sy, vh + padding * 2);

      if (sw > 0 && sh > 0) {
        ctx.drawImage(
          cachedMapCanvasRef.current,
          Math.floor(sx), Math.floor(sy), Math.floor(sw), Math.floor(sh),
          Math.floor(sx), Math.floor(sy), Math.floor(sw), Math.floor(sh)
        );
      }
    }

    // Crates
    gameState.crates.forEach(crate => {
      if (
        crate.position.x < viewLeft ||
        crate.position.x > viewRight ||
        crate.position.y < viewTop ||
        crate.position.y > viewBottom
      ) {
        return;
      }
      // CRITICAL: CRATES ARE ALWAYS VISIBLE REGARDLESS OF FOG.
      // NEVER HIDE CRATES BASED ON VISIBILITY AGAIN.
      
      ctx.save();
      ctx.translate(crate.position.x, crate.position.y);
      
      const crateTexture = texturesRef.current['CRATE'];
      if (crateTexture && crateTexture.width > 0) {
        ctx.drawImage(crateTexture, -15, -15, 30, 30);
      } else {
        // Fallback crate drawing
        ctx.fillStyle = '#92400e'; // Brown
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -12, 24, 24);
        // Question mark
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 6);
      }
      
      // Pulsing effect
      const pulse = Math.sin(performance.now() / 200) * 0.2 + 1;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });

    // Sorting for rendering
    const getZOffset = (pos: {x: number, y: number}) => engineRef.current?.getZOffset(pos) || 0;
    
    // Draw paths for selected entities before they get culled
    gameState.entities.forEach(entity => {
      if (entity.selected && entity.type === 'UNIT') {
        const zOffset = (entity as any).zOffset ?? getZOffset(entity.position);
        
        ctx.save();
        // Move to entity position (apply zOffset if any)
        ctx.translate(entity.position.x, entity.position.y - zOffset);
        
        // Draw Rally Point Line
        if (entity.rallyPoint) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1 / camera.zoom;
          ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(entity.rallyPoint.x - entity.position.x, entity.rallyPoint.y - entity.position.y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw Rally Point Marker
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(entity.rallyPoint.x - entity.position.x, entity.rallyPoint.y - entity.position.y, 3 / camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Path Line
        if (entity.path && entity.path.length > 0) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // Greenish line
          ctx.lineWidth = 2 / camera.zoom;
          ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
          ctx.beginPath();
          ctx.moveTo(0, 0); // Start at entity position
          for (const node of entity.path) {
            const nodeZ = getZOffset({x: node.x, y: node.y});
            ctx.lineTo(node.x - entity.position.x, node.y - entity.position.y + nodeZ - zOffset);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw Destination Marker
          const dest = entity.path[entity.path.length - 1];
          const destZ = getZOffset({x: dest.x, y: dest.y});
          ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
          ctx.beginPath();
          ctx.arc(dest.x - entity.position.x, dest.y - entity.position.y + destZ - zOffset, 3 / camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
    });

    // Use pre-sorted list from engine if available (calculated every 10 frames)
    const sortedEntities = (gameState as any).sortedVisEntities || gameState.entities;

    // Entities
    sortedEntities.forEach(entity => {
      // Frustum Culling
      if (
        entity.position.x < viewLeft ||
        entity.position.x > viewRight ||
        entity.position.y < viewTop ||
        entity.position.y > viewBottom
      ) {
        return;
      }

      const zOffset = (entity as any).zOffset ?? getZOffset(entity.position);
      
      const tx = Math.floor(entity.position.x / mapTileSize);
      const ty = Math.floor(entity.position.y / mapTileSize);
      const vis = visibility[ty]?.[tx] ?? 2;

      ctx.save();
      
      // CRITICAL: ENTITIES ARE ALWAYS FULLY VISIBLE AND BRIGHT REGARDLESS OF FOG.
      // NEVER APPLY FOG FILTERS OR GRAYSCALE EFFECTS AGAIN.
      
      ctx.translate(entity.position.x, entity.position.y + zOffset);
      
      let isOnMountainGrass = gameState.map.tiles[ty]?.[tx] === 'MOUNTAIN_GRASS';

      // Pseudo-Isometric Perspective Scale (Elevated objects appear slightly closer/larger)
      let scaleMag = 1.0 + (Math.abs(zOffset) / 200); 
      if (isOnMountainGrass) scaleMag *= 1.2;

      if (entity.type === 'UNIT') {
        ctx.save(); // Save before body scale and rotation
        ctx.scale(scaleMag, scaleMag);
        
        // Apply rotation for units
        if (entity.rotation !== undefined) {
          ctx.rotate(entity.rotation + Math.PI / 2); // Adjust for tank facing up by default
        }

        const textureKey = entity.subType === 'MCV' ? 'SOVIET_MCV' : entity.subType === 'ALLIED_MCV' ? 'ALLIED_MCV' : entity.subType;
        const unitTexture = texturesRef.current[textureKey];
        if (unitTexture && unitTexture.width > 0) {
          ctx.drawImage(unitTexture, -entity.size/2, -entity.size/2, entity.size, entity.size);
        } else {
          // Fallback
          const engineColors = engineRef.current?.state?.playerColors;
          let color = '#6b7280'; // neutral
          if (entity.owner && engineColors && engineColors[entity.owner]) {
             const cStr = engineColors[entity.owner];
             color = cStr === 'RED' ? '#ef4444' : cStr === 'BLUE' ? '#3b82f6' : cStr === 'GREEN' ? '#22c55e' : cStr === 'YELLOW' ? '#eab308' : '#3b82f6';
          } else {
             color = entity.owner === engineRef.current.localPlayerId ? '#3b82f6' : (entity.owner === 'AI' ? '#ef4444' : '#6b7280');
          }
          ctx.fillStyle = color;
          ctx.fillRect(-entity.size/2, -entity.size/2, entity.size, entity.size);
          
          if (entity.subType === 'TANK' || entity.subType === 'RHINO_TANK') {
            // Turret/Barrel for tanks
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-2, -entity.size/2 - 5, 4, 12);
          } else if (entity.subType === 'APOCALYPSE_TANK') {
            // Double barrel
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, -entity.size/2 - 6, 3, 14);
            ctx.fillRect(1, -entity.size/2 - 6, 3, 14);
          } else if (entity.subType === 'V3_LAUNCHER') {
            // Rocket on top
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-3, -entity.size/2 - 8, 6, 16);
          } else if (entity.subType === 'TERROR_DRONE') {
            // Spider legs
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(entity.size/2 + 2, entity.size/2 + 2);
              ctx.stroke();
            }
          } else if (entity.subType === 'TESLA_TROOPER') {
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/3, 0, Math.PI * 2);
            ctx.fill();
          } else if (entity.subType === 'ATTACK_DOG') {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-entity.size/2, -entity.size/4, entity.size, entity.size/2);
          } else if (entity.subType === 'DESOLATOR') {
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#166534';
            ctx.stroke();
          } else if (entity.subType === 'TERRORIST') {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/3, 0, Math.PI * 2);
            ctx.fill();
          } else if (entity.subType === 'TESLA_TANK') {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(-entity.size/2, -entity.size/2, entity.size, entity.size);
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/4, 0, Math.PI * 2);
            ctx.fill();
          } else if (entity.subType === 'SIEGE_CHOPPER') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-entity.size/2, -entity.size/4, entity.size, entity.size/2);
            // Propeller
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            const angle = (performance.now() / 50) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * entity.size/2, Math.sin(angle) * entity.size/2);
            ctx.lineTo(-Math.cos(angle) * entity.size/2, -Math.sin(angle) * entity.size/2);
            ctx.stroke();
          } else if (entity.subType === 'TYPHOON_SUB') {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(0, 0, entity.size/2, entity.size/4, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (entity.subType === 'SEA_SCORPION') {
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(-entity.size/2, -entity.size/4);
            ctx.lineTo(entity.size/2, 0);
            ctx.lineTo(-entity.size/2, entity.size/4);
            ctx.closePath();
            ctx.fill();
          } else if (entity.subType === 'GIANT_SQUID') {
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/3, 0, Math.PI * 2);
            ctx.fill();
            // Tentacles
            ctx.strokeStyle = '#ec4899';
            for (let i = 0; i < 8; i++) {
              ctx.rotate(Math.PI / 4);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(entity.size/2 + Math.sin(performance.now()/200 + i) * 5, 0);
              ctx.stroke();
            }
          } else if (entity.subType === 'DREADNOUGHT') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-entity.size/2, -entity.size/4, entity.size, entity.size/2);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(0, -2, entity.size/2, 4); // Missile bay
          } else if (entity.subType === 'YURI' || entity.subType === 'YURI_PRIME') {
            ctx.fillStyle = entity.subType === 'YURI_PRIME' ? '#7e22ce' : '#c084fc'; // Darker Purple for Prime
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(entity.subType === 'YURI_PRIME' ? 'Y+' : 'Y', 0, 3);
          } else if (entity.subType === 'CHRONO_COMMANDO' || entity.subType === 'PSI_COMMANDO') {
            ctx.fillStyle = entity.subType === 'CHRONO_COMMANDO' ? '#3b82f6' : '#a855f7';
            ctx.beginPath();
            ctx.arc(0, 0, entity.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(entity.subType === 'CHRONO_COMMANDO' ? 'CC' : 'PC', 0, 3);
          } else if (entity.subType === 'HOVER_TRANSPORT') {
            ctx.fillStyle = '#52525b';
            ctx.beginPath();
            ctx.ellipse(0, 0, entity.size/2, entity.size/3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(-entity.size/4, -entity.size/6, entity.size/2, entity.size/3);
          }

          // Draw Veterancy Rank
          if (entity.rank) {
            ctx.fillStyle = '#fbbf24'; // Gold color for rank
            const rankY = -entity.size/2 - 8;
            if (entity.rank === 'VETERAN') {
              ctx.beginPath();
              ctx.moveTo(-4, rankY);
              ctx.lineTo(0, rankY - 4);
              ctx.lineTo(4, rankY);
              ctx.lineTo(2, rankY);
              ctx.lineTo(0, rankY - 2);
              ctx.lineTo(-2, rankY);
              ctx.fill();
            } else if (entity.rank === 'ELITE') {
              for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-4, rankY - i*3);
                ctx.lineTo(0, rankY - 4 - i*3);
                ctx.lineTo(4, rankY - i*3);
                ctx.lineTo(2, rankY - i*3);
                ctx.lineTo(0, rankY - 2 - i*3);
                ctx.lineTo(-2, rankY - i*3);
                ctx.fill();
              }
            }
          }

          // Deployed Visuals
          if (entity.isDeployed) {
            if (entity.subType === 'GI') {
              // Draw sandbags around GI
              ctx.save();
              ctx.rotate(-entity.rotation! - Math.PI / 2); // Counter-rotate to keep sandbags static relative to world
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(0, 0, entity.size / 2 + 5, 0, Math.PI * 2);
              ctx.stroke();
              // Draw some "bags"
              for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = '#92400e';
                ctx.fillRect(entity.size / 2, -5, 6, 10);
              }
              ctx.restore();
            } else if (entity.subType === 'SIEGE_CHOPPER') {
              // Draw landing legs
              ctx.fillStyle = '#334155';
              ctx.fillRect(-entity.size/2 - 5, -5, 5, 10);
              ctx.fillRect(entity.size/2, -5, 5, 10);
            }
          }
          
          ctx.restore(); // Restore after drawing the rotated unit
        }
      } else {
        // Building
        ctx.save();
        ctx.scale(scaleMag, scaleMag);
        const dims = getBuildingDimensions(entity.subType as BuildingType);
        const width = dims.w * mapTileSize;
        const height = dims.h * mapTileSize;
        
        const bldgTexture = texturesRef.current[entity.subType === 'CONSTRUCTION_YARD' ? 'SOVIET_BASE' : entity.subType === 'ALLIED_CONSTRUCTION_YARD' ? 'ALLIED_BASE' : entity.subType];
        if (bldgTexture && bldgTexture.width > 0) {
          ctx.drawImage(bldgTexture, -width/2, -height/2, width, height);
        } else {
            const engineColors = engineRef.current?.state?.playerColors;
            let darkColor = '#4b5563'; // neutral
            if (entity.owner && engineColors && engineColors[entity.owner]) {
               const cStr = engineColors[entity.owner];
               darkColor = cStr === 'RED' ? '#991b1b' : cStr === 'BLUE' ? '#1e40af' : cStr === 'GREEN' ? '#166534' : cStr === 'YELLOW' ? '#ca8a04' : '#1e40af';
            } else {
               darkColor = entity.owner === engineRef.current.localPlayerId ? '#1e40af' : (entity.owner === 'AI' ? '#991b1b' : '#4b5563');
            }
            ctx.fillStyle = darkColor;
          if (entity.subType === 'SOVIET_WALL') ctx.fillStyle = '#4b5563';
          if (entity.subType === 'BATTLE_BUNKER') ctx.fillStyle = '#3f3f46';
          
          if (entity.subType === 'TREE') {
            // Trunk: Brown Rectangle
            ctx.fillStyle = '#78350f'; 
            ctx.fillRect(-10, -30, 20, 30);
            
            // Top: Green Square
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(-40, -110, 80, 80);
            
            // Stroke for visibility
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2;
            ctx.strokeRect(-40, -110, 80, 80);
          } else if (entity.subType === 'MOUNTAIN') {
            // Simple gray square of 1 cell size
            ctx.fillStyle = '#6b7280'; // gray-500
            ctx.fillRect(-20, -20, 40, 40);
            
            ctx.strokeStyle = '#4b5563'; // gray-600 outline
            ctx.lineWidth = 2;
            ctx.strokeRect(-20, -20, 40, 40);
          } else {
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          
          if (entity.subType === 'TESLA_COIL') {
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(0, 0, width/4, 0, Math.PI * 2);
            ctx.fill();
            // Rings
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, width/2.5, 0, Math.PI * 2);
            ctx.stroke();
          } else if (entity.subType === 'FLAK_CANNON') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-2, -12, 4, 12);
          } else if (entity.subType === 'RADAR') {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, width/3, 0, Math.PI * 2);
            ctx.stroke();
            // Dish
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width/2, 0);
            ctx.stroke();
          } else if (entity.subType === 'OIL_DERRICK') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-width/4, -height/2 - 10, width/2, 10); // Top pump
            // Animated pump handle
            const pumpY = Math.sin(performance.now() / 500) * 5;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -height/2);
            ctx.lineTo(0, -height/2 - 15 + pumpY);
            ctx.stroke();
          }

          // Label for building type
          if (entity.subType !== 'TREE' && entity.subType !== 'MOUNTAIN') {
            ctx.fillStyle = 'white';
            ctx.font = `${8 / camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(entity.subType.replace('_', ' '), 0, 5);
          }
        }
        ctx.restore();
      }

      // Selection ring
      if (entity.selected && entity.type === 'UNIT') {
        ctx.save();
        ctx.scale(scaleMag, scaleMag);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.setLineDash([2 / camera.zoom, 2 / camera.zoom]);
        ctx.beginPath();
        ctx.arc(0, 0, entity.size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Iron Curtain visual
      const timestamp = performance.now();
      const isInvulnerable = entity.invulnerableUntil && entity.invulnerableUntil > timestamp;

      // Health bar
      if ((entity.selected || entity.health < entity.maxHealth) && entity.subType !== 'TREE' && entity.subType !== 'MOUNTAIN') {
        const healthWidth = entity.size;
        const currentHealthWidth = (entity.health / entity.maxHealth) * healthWidth;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-healthWidth/2, -entity.size/2 - 12, healthWidth, 4 / camera.zoom);
        
        ctx.fillStyle = isInvulnerable ? '#ef4444' : (entity.health / entity.maxHealth > 0.5 ? '#22c55e' : '#eab308');
        if (!isInvulnerable && entity.health / entity.maxHealth < 0.25) ctx.fillStyle = '#ef4444';
        ctx.fillRect(-healthWidth/2, -entity.size/2 - 12, currentHealthWidth, 4 / camera.zoom);
      }

      if (isInvulnerable) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.arc(0, 0, entity.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selection Response Text
      // Harvester load bar
      if (entity.subType === 'HARVESTER' && entity.harvestAmount !== undefined) {
        const loadWidth = entity.size;
        const currentLoadWidth = (entity.harvestAmount / 500) * loadWidth;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-loadWidth/2, -entity.size/2 - 18, loadWidth, 3 / camera.zoom);
        ctx.fillStyle = '#eab308'; // Gold color
        ctx.fillRect(-loadWidth/2, -entity.size/2 - 18, currentLoadWidth, 3 / camera.zoom);
      }


      // Repair Icon
      if (entity.isRepairing) {
        ctx.save();
        ctx.translate(0, -entity.size/2 - 30);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 0);
        ctx.restore();
      }

      ctx.restore();
    });

    // Render highly optimized Fog of War AFTER entities so they are "under" the fog
    if (!gameState.debugFlags?.disableFog) {
      fogOfWarRef.current.render(ctx, visibility, map, gameState);
    }

    // Building Placement Ghost
    if (gameState.placingBuilding && mousePosRef.current) {
      const worldX = (mousePosRef.current.x - camera.x) / camera.zoom;
      const worldY = (mousePosRef.current.y - camera.y) / camera.zoom;
      
      const type = gameState.placingBuilding;
      const dims = getBuildingDimensions(type);
      
      // Determine effective tile size (the "step") based on terrain under cursor
      const rawMouseX = Math.floor(worldX / mapTileSize);
      const rawMouseY = Math.floor(worldY / mapTileSize);
      const isOverMountain = gameState.map.tiles[rawMouseY]?.[rawMouseX] === 'MOUNTAIN_GRASS';
      const effectiveTileSize = isOverMountain ? mapTileSize * 1.2 : mapTileSize;

      // Calculate top-left tile based on mouse position using the scaled step
      const tx = Math.floor((worldX - (dims.w * effectiveTileSize) / 2) / effectiveTileSize);
      const ty = Math.floor((worldY - (dims.h * effectiveTileSize) / 2) / effectiveTileSize);

      // Determine the bounding box in raw tile coordinates - CLAMPED TO MAP BOUNDARIES
      const startTileX = Math.max(0, Math.floor((tx * effectiveTileSize) / mapTileSize));
      const endTileX = Math.min(mapWidthVal - 1, Math.floor(((tx + dims.w) * effectiveTileSize - 1) / mapTileSize));
      const startTileY = Math.max(0, Math.floor((ty * effectiveTileSize) / mapTileSize));
      const endTileY = Math.min(mapHeightVal - 1, Math.floor(((ty + dims.h) * effectiveTileSize - 1) / mapTileSize));

      // Calculate snapped center position
      const snappedX = (tx + dims.w / 2) * effectiveTileSize;
      const snappedY = (ty + dims.h / 2) * effectiveTileSize;

      let isOnMountainGrass = true;
      // Skip loop if ranges are invalid (e.g. completely outside map)
      if (startTileX > endTileX || startTileY > endTileY) {
        isOnMountainGrass = false;
      } else {
        for (let ry = startTileY; ry <= endTileY; ry++) {
          for (let rx = startTileX; rx <= endTileX; rx++) {
             const row = gameState.map.tiles[ry];
             if (!row) { isOnMountainGrass = false; continue; }
             const tile = row[rx];
             if (tile !== 'MOUNTAIN_GRASS') isOnMountainGrass = false;
          }
        }
      }
      const placeScale = isOnMountainGrass ? 1.2 : 1.0;

      // Draw Grid around placement area
      ctx.save();
      ctx.translate(snappedX, snappedY);
      ctx.scale(placeScale, placeScale);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1 / (camera.zoom * placeScale);
      const gridRange = 8;
      for (let i = -gridRange; i <= gridRange; i++) {
        ctx.beginPath();
        ctx.moveTo(-gridRange * mapTileSize, i * mapTileSize - (dims.h % 2 === 0 ? 0 : mapTileSize/2));
        ctx.lineTo(gridRange * mapTileSize, i * mapTileSize - (dims.h % 2 === 0 ? 0 : mapTileSize/2));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i * mapTileSize - (dims.w % 2 === 0 ? 0 : mapTileSize/2), -gridRange * mapTileSize);
        ctx.lineTo(i * mapTileSize - (dims.w % 2 === 0 ? 0 : mapTileSize/2), gridRange * mapTileSize);
        ctx.stroke();
      }
      ctx.restore();
      
      const width = dims.w * mapTileSize;
      const height = dims.h * mapTileSize;
      
      ctx.save();
      ctx.translate(snappedX, snappedY);
      ctx.scale(placeScale, placeScale);
      ctx.globalAlpha = 0.5;
      
      // Check if placement is valid
      let isValid = true;
      let ghostBaseElevation: 'GROUND' | 'PLATEAU' | 'MOUNTAIN_PLATEAU' | null = null;
      
      if (startTileX > endTileX || startTileY > endTileY) {
        isValid = false;
      } else {
        for (let ry = startTileY; ry <= endTileY; ry++) {
          for (let rx = startTileX; rx <= endTileX; rx++) {
              const row = gameState.map.tiles[ry];
              const tileType = row ? row[rx] : null;
              const visibilityRow = gameState.map.visibility[ry];
              const visibilityValue = visibilityRow ? visibilityRow[rx] : 0;
              
              // Basic terrain block
              const isFoggy = !gameState.debugFlags?.disableFog && visibilityValue === 0;
              if (!tileType || tileType === 'WATER' || tileType === 'WATER_TO_GRASS' || tileType === 'GRASS_TO_WATER' || tileType === 'ORE' || tileType.startsWith('CLIFF') || tileType.startsWith('RAMP_') || isFoggy || tileType === 'MOUNTAIN_DECOR') {
                isValid = false;
              }

              // Block bridges
              const onBridge = gameState.map.bridges.some((b: any) => {
                return rx >= b.x && rx < b.x + b.width && ry >= b.y && ry < b.y + b.height;
              });
              if (onBridge) isValid = false;

              // Elevation consistency check for ghost
              const curElevation = (tileType === 'MOUNTAIN_GRASS') ? 'MOUNTAIN_PLATEAU' : ((tileType === 'ELEVATED_GRASS') ? 'PLATEAU' : 'GROUND');
              if (ghostBaseElevation === null) {
                ghostBaseElevation = curElevation;
              } else if (ghostBaseElevation !== curElevation) {
                isValid = false;
              }
          }
        }
      }

      // Overlap check with other entities
      if (isValid) {
        const overlap = gameState.entities.some(e => {
          if (e.owner === 'NEUTRAL' && e.subType === 'TREE') return false; 
          const dx = Math.abs(e.position.x - snappedX);
          const dy = Math.abs(e.position.y - snappedY);
          const collisionDist = (e.type === 'BUILDING' ? 60 : 25);
          return dx < collisionDist && dy < collisionDist;
        });
        if (overlap) isValid = false;
      }

      if (isValid) {
        // Collision Check (Using world-space bounds for accuracy)
        const margin = 2;
        const ghostRect = {
          left: snappedX - (dims.w * effectiveTileSize) / 2 + margin,
          right: snappedX + (dims.w * effectiveTileSize) / 2 - margin,
          top: snappedY - (dims.h * effectiveTileSize) / 2 + margin,
          bottom: snappedY + (dims.h * effectiveTileSize) / 2 - margin
        };

        const collision = gameState.entities.find(e => {
          if (e.type !== 'BUILDING') return false;
          const eDims = getBuildingDimensions(e.subType as BuildingType);
          
          let eIsOnMountainGrass = true;
          const ebTx_raw = Math.floor((e.position.x - (eDims.w * mapTileSize) / 2) / mapTileSize);
          const ebTy_raw = Math.floor((e.position.y - (eDims.h * mapTileSize) / 2) / mapTileSize);
          for (let edy = 0; edy < eDims.h; edy++) {
            for (let edx = 0; edx < eDims.w; edx++) {
              if (gameState.map.tiles[ebTy_raw + edy]?.[ebTx_raw + edx] !== 'MOUNTAIN_GRASS') {
                eIsOnMountainGrass = false;
              }
            }
          }
          const eEffSize = eIsOnMountainGrass ? mapTileSize * 1.2 : mapTileSize;

          const eRect = {
            left: e.position.x - (eDims.w * eEffSize) / 2 + margin,
            right: e.position.x + (eDims.w * eEffSize) / 2 - margin,
            top: e.position.y - (eDims.h * eEffSize) / 2 + margin,
            bottom: e.position.y + (eDims.h * eEffSize) / 2 - margin
          };

          return !(ghostRect.right < eRect.left || ghostRect.left > eRect.right || 
                   ghostRect.bottom < eRect.top || ghostRect.top > eRect.bottom);
        });
        if (collision) isValid = false;
      }

      if (isValid) {
        // Proximity Check
        const friendlyBuildings = gameState.entities.filter(e => e.type === 'BUILDING' && e.owner === engineRef.current.localPlayerId);
        if (friendlyBuildings.length > 0) {
          const nearBuilding = friendlyBuildings.find(b => {
            const dist = Math.hypot(b.position.x - snappedX, b.position.y - snappedY);
            return dist < 400; 
          });
          if (!nearBuilding) isValid = false;
        }
      }
      
      ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(-width/2, -height/2, width, height);
      ctx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3 / camera.zoom;
      ctx.strokeRect(-width/2, -height/2, width, height);
      
      ctx.restore();
    }

    // Special Ability Targeting Ghost
    if ((gameState.interactionMode === 'USE_IRON_CURTAIN' || gameState.interactionMode === 'USE_NUCLEAR_STRIKE' || gameState.interactionMode === 'USE_SPY_PLANE' || gameState.interactionMode === 'USE_PARATROOPERS' || gameState.interactionMode === 'USE_CHRONOSPHERE' || gameState.interactionMode === 'USE_WEATHER_STORM') && mousePosRef.current) {
      const worldX = (mousePosRef.current.x - camera.x) / camera.zoom;
      const worldY = (mousePosRef.current.y - camera.y) / camera.zoom;
      let radius = 150;
      if (gameState.interactionMode === 'USE_NUCLEAR_STRIKE' || gameState.interactionMode === 'USE_WEATHER_STORM') radius = 300;
      if (gameState.interactionMode === 'USE_SPY_PLANE') radius = 400;
      
      ctx.save();
      ctx.translate(worldX, worldY);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      
      let color = 'rgba(239, 68, 68, 0.2)';
      let strokeColor = '#ef4444';
      if (gameState.interactionMode === 'USE_NUCLEAR_STRIKE') { color = 'rgba(251, 191, 36, 0.2)'; strokeColor = '#fbbf24'; }
      if (gameState.interactionMode === 'USE_SPY_PLANE') { color = 'rgba(56, 189, 248, 0.2)'; strokeColor = '#38bdf8'; }
      if (gameState.interactionMode === 'USE_PARATROOPERS') { color = 'rgba(163, 230, 53, 0.2)'; strokeColor = '#a3e635'; }
      if (gameState.interactionMode === 'USE_CHRONOSPHERE') { color = 'rgba(168, 85, 247, 0.2)'; strokeColor = '#a855f7'; }
      if (gameState.interactionMode === 'USE_WEATHER_STORM') { color = 'rgba(56, 189, 248, 0.2)'; strokeColor = '#38bdf8'; }

      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2 / camera.zoom;
      ctx.stroke();
      
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
      ctx.moveTo(0, -20); ctx.lineTo(0, 20);
      ctx.stroke();
      
      ctx.restore();
    }

    // Projectiles
    gameState.projectiles.forEach(proj => {
      if (
        proj.position.x < viewLeft ||
        proj.position.x > viewRight ||
        proj.position.y < viewTop ||
        proj.position.y > viewBottom
      ) {
        return;
      }
      ctx.save();
      ctx.translate(proj.position.x, proj.position.y);
      if (proj.type === 'MISSILE') {
        // Draw missile
        const dx = proj.targetPosition ? proj.targetPosition.x - proj.position.x : 0;
        const dy = proj.targetPosition ? proj.targetPosition.y - proj.position.y : 0;
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle);
        ctx.fillStyle = '#cbd5e1'; // gray
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillStyle = '#ef4444'; // red tip
        ctx.fillRect(4, -2, 4, 4);
        // Rocket exhaust
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(-8, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'CANNONBALL') {
        ctx.fillStyle = '#fcd34d'; // yellow/orange
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Combat Effects
    gameState.effects.forEach(effect => {
      if (
        effect.position.x < viewLeft ||
        effect.position.x > viewRight ||
        effect.position.y < viewTop ||
        effect.position.y > viewBottom
      ) {
        return;
      }
      ctx.save();
      const age = (performance.now() - effect.startTime);
      const progress = Math.min(1, Math.max(0, age / effect.duration));
      
      if (effect.type === 'MUZZLE_FLASH') {
        ctx.translate(effect.position.x, effect.position.y);
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, 5 * (1 - progress)), 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.type === 'TRACER' && effect.targetPosition) {
        ctx.strokeStyle = effect.color || '#fff';
        ctx.lineWidth = Math.max(0.1, 2 * (1 - progress));
        ctx.beginPath();
        ctx.moveTo(effect.position.x, effect.position.y);
        ctx.lineTo(effect.targetPosition.x, effect.targetPosition.y);
        ctx.stroke();
      } else if (effect.type === 'EXPLOSION') {
        ctx.translate(effect.position.x, effect.position.y);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.8 * (1 - progress)})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, 40 * progress), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(251, 191, 36, ${0.6 * (1 - progress)})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, 20 * progress), 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.type === 'MONEY_FLOAT') {
        ctx.translate(effect.position.x, effect.position.y - (progress * 40));
        ctx.fillStyle = `rgba(34, 197, 94, ${1 - progress})`;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text || '', 0, 0);
      } else if (effect.type === 'SUPERWEAPON_STRIKE') {
        ctx.translate(effect.position.x, effect.position.y);
        // Draw a large warning circle and a beam from the sky
        ctx.strokeStyle = effect.color || '#fff';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.arc(0, 0, 300 * (1 - progress), 0, Math.PI * 2);
        ctx.stroke();

        // Beam
        const beamWidth = 20 * (1 - progress);
        const gradient = ctx.createLinearGradient(0, -1000, 0, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, effect.color || '#fff');
        ctx.fillStyle = gradient;
        ctx.fillRect(-beamWidth / 2, -1000, beamWidth, 1000);
      }
      ctx.restore();
    });

    // Move Markers
    gameState.moveMarkers.forEach(marker => {
      ctx.save();
      const mz = getZOffset(marker.position);
      const age = performance.now() - marker.startTime;
      const progress = age / 500;
      ctx.translate(marker.position.x, marker.position.y + mz);
      ctx.strokeStyle = `rgba(34, 197, 94, ${1 - progress})`;
      ctx.lineWidth = 2;
      const s = 10 * (1 + progress);
      ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
      ctx.moveTo(0, -s); ctx.lineTo(0, s);
      ctx.stroke();
      ctx.restore();
    });

    // Selection Box
    if (gameState.selectionBox) {
      const { start, end } = gameState.selectionBox;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1 / camera.zoom;
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    }

    // Hover Tooltip
    if (mousePosRef.current) {
      const worldX = (mousePosRef.current.x - camera.x) / camera.zoom;
      const worldY = (mousePosRef.current.y - camera.y) / camera.zoom;
      
      const hovered = gameState.entities.find(e => 
        Math.hypot(e.position.x - worldX, e.position.y - worldY) < e.size &&
        e.subType !== 'TREE' && e.subType !== 'MOUNTAIN'
      );

      if (hovered) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        
        const typeName = hovered.subType.replace('_', ' ');
        const text = `${typeName} (${Math.ceil(hovered.health)}/${hovered.maxHealth})`;
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillRect(mousePosRef.current.x + 15, mousePosRef.current.y + 15, textWidth + 20, 30);
        ctx.strokeRect(mousePosRef.current.x + 15, mousePosRef.current.y + 15, textWidth + 20, 30);
        
        ctx.fillStyle = hovered.owner === engineRef.current.localPlayerId ? '#4ade80' : '#f87171';
        ctx.font = '12px sans-serif';
        ctx.fillText(text, mousePosRef.current.x + 25, mousePosRef.current.y + 35);
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') {
        engineRef.current.state.interactionMode = 'ATTACK_MOVE';
        setGameState({ ...engineRef.current.state });
      }
      if (e.key.toLowerCase() === 's') {
        // Stop command
        const stoppedIds: string[] = [];
        engineRef.current.state.entities.forEach(entity => {
          if (entity.selected && entity.owner === engineRef.current.localPlayerId) {
            entity.targetPosition = undefined;
            entity.targetId = undefined;
            entity.path = undefined;
            stoppedIds.push(entity.id);
          }
        });
        if (stoppedIds.length > 0 && engineRef.current.role === 'CLIENT') {
          engineRef.current.socket.emit('client_command', {
            roomId: engineRef.current.roomId,
            command: { type: 'STOP_UNITS', unitIds: stoppedIds, owner: engineRef.current.localPlayerId }
          });
        }
        setGameState({ ...engineRef.current.state });
      }
      if (e.key.toLowerCase() === 'd') {
        // Deploy command
        engineRef.current.state.entities.forEach(entity => {
          if (entity.selected && entity.owner === engineRef.current.localPlayerId) {
            if (entity.subType === 'GI' || entity.subType === 'SIEGE_CHOPPER' || entity.subType === 'DESOLATOR') {
              entity.isDeployed = !entity.isDeployed;
              entity.targetPosition = undefined;
              entity.path = undefined;
              if (engineRef.current.role === 'CLIENT') {
                engineRef.current.socket.emit('client_command', {
                  roomId: engineRef.current.roomId,
                  command: { type: 'TOGGLE_DEPLOY', unitId: entity.id, owner: engineRef.current.localPlayerId }
                });
              }
            } else if (entity.subType === 'MCV' || entity.subType === 'ALLIED_MCV') {
              engineRef.current.deployMCV(entity.id);
            }
          }
        });
        setGameState({ ...engineRef.current.state });
      }
      if (e.key.toLowerCase() === 'x') {
        // Scatter command
        const scatteredInfos: any[] = [];
        engineRef.current.state.entities.forEach(entity => {
          if (entity.selected && entity.owner === engineRef.current.localPlayerId && entity.type === 'UNIT' && !entity.isDeployed) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            entity.targetPosition = {
              x: entity.position.x + Math.cos(angle) * distance,
              y: entity.position.y + Math.sin(angle) * distance
            };
            entity.path = [entity.targetPosition];
            entity.targetId = undefined;
            scatteredInfos.push({ id: entity.id, targetPosition: entity.targetPosition });
          }
        });
        if (scatteredInfos.length > 0 && engineRef.current.role === 'CLIENT') {
          engineRef.current.socket.emit('client_command', {
            roomId: engineRef.current.roomId,
            command: { type: 'SCATTER_UNITS', scatteredInfos, owner: engineRef.current.localPlayerId }
          });
        }
        setGameState({ ...engineRef.current.state });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    if (e.button === 1) { // Middle mouse for panning
      return;
    }

    const worldPos = engineRef.current.screenToWorld(screenPos);
    engineRef.current.handleMouseDown(worldPos, e.button === 2, e.ctrlKey || e.shiftKey);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    mousePosRef.current = screenPos;

    if (e.buttons === 4) { // Middle mouse button is held
      engineRef.current.state.camera.x += e.movementX;
      engineRef.current.state.camera.y += e.movementY;
      return;
    }

    const worldPos = engineRef.current.screenToWorld(screenPos);
    engineRef.current.handleMouseMove(worldPos);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    engineRef.current.handleMouseUp(true);
  };

  const handleMouseLeave = () => {
    // Keep mousePosRef so selection drag works even if slightly out of div bounds, but 
    // handleMouseUp will cancel the selection box.
    engineRef.current.handleMouseUp(false); // Stop dragging selection
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zooming is disabled per user request, but freeZoom allows it for debugging
    if (!engineRef.current.state.debugFlags?.freeZoom) return;

    const zoomSpeed = 0.1;
    const { camera } = engineRef.current.state;
    const oldZoom = camera.zoom;
    
    let newZoom = oldZoom;
    if (e.deltaY < 0) newZoom += zoomSpeed;
    if (e.deltaY > 0) newZoom -= zoomSpeed;
    
    // Limits
    newZoom = Math.max(0.05, Math.min(5, newZoom));
    
    // Zoom toward cursor
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    camera.x = mouseX - (mouseX - camera.x) * (newZoom / oldZoom);
    camera.y = mouseY - (mouseY - camera.y) * (newZoom / oldZoom);
    camera.zoom = newZoom;
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="fixed inset-0 flex flex-row bg-black overflow-hidden font-sans text-white select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {appState === 'MENU' && (
        <MainMenu setAppState={setAppState} playerName={playerName} setPlayerName={setPlayerName} />
      )}

      {appState === 'MULTIPLAYER_LOBBY' && (
        <MultiplayerLobby setAppState={setAppState} setRoomId={setActiveRoomId} playerName={playerName} />
      )}

      {appState === 'SETTINGS' && (
        <SettingsMenu
          setAppState={setAppState}
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {appState === 'MULTIPLAYER_CREATE' && (
        <MultiplayerCreateRoom 
          selectedFaction={selectedFaction}
          setSelectedFaction={setSelectedFaction}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          setAppState={setAppState}
          setRoomId={setActiveRoomId}
          playerName={playerName}
        />
      )}

      {appState === 'MULTIPLAYER_ROOM' && (
        <MultiplayerRoom 
          selectedFaction={selectedFaction}
          selectedCountry={selectedCountry}
          selectedMap={selectedMap}
          setAppState={setAppState}
          engineRef={engineRef}
          setGameState={setGameState}
          roomId={activeRoomId}
          playerName={playerName}
        />
      )}

      {appState === 'SKIRMISH_SETUP' && (
        <SkirmishSetup 
          selectedFaction={selectedFaction}
          setSelectedFaction={setSelectedFaction}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          setAppState={setAppState}
          engineRef={engineRef}
          setGameState={setGameState}
        />
      )}

      {appState === 'PLAYING' && (
        <>
          <DebugMenu engineRef={engineRef} />
          {gameState.debugFlags?.showFPS && <FPSCounter />}

          {/* Main Game Area */}
          <div className="relative flex-1 bg-zinc-900 cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          width={Math.max(100, windowSize.width - (windowSize.width >= 1024 ? 220 : 185))}
          height={windowSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onContextMenu={onContextMenu}
          className="block w-full h-full touch-none"
        />

        {/* Mobile Placement Confirm/Cancel */}
        {gameState.placingBuilding && settings.showMobileControls && (
          <div className="lg:hidden absolute bottom-4 right-4 z-50 flex gap-2">
            <button
              className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-zinc-500"
              onClick={() => {
                 engineRef.current.state.placingBuilding = null;
                 setGameState({ ...engineRef.current.state });
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-zinc-500"
              onClick={() => {
                if (mousePosRef.current) {
                  const placePos = engineRef.current.screenToWorld(mousePosRef.current);
                  engineRef.current.handleMouseDown(placePos, false, false);
                  engineRef.current.handleMouseUp(false);
                  setGameState({ ...engineRef.current.state });
                }
              }}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="z-20">
         <GameHUD gameState={gameState} engineRef={engineRef} setGameState={setGameState} />
      </div>

      {/* Emergency Credits */}
      {gameState.credits < 500 && !gameState.entities.some(e => e.owner === engineRef.current.localPlayerId && e.subType === 'HARVESTER') && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button 
            onClick={() => {
              engineRef.current.state.credits += 1000;
              setGameState({ ...engineRef.current.state });
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-black shadow-2xl border-2 border-white/20 uppercase tracking-tighter"
          >
            Request Reinforcements ($1000)
          </button>
        </div>
      )}
      {/* Mobile Controls */}
      {settings.showMobileControls && (
        <div className="lg:hidden absolute bottom-4 left-4 z-50 flex flex-col gap-2">
          <button
            id="mobile-command-btn"
            className={`px-3 py-2 text-sm font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] uppercase tracking-wider transition-colors duration-200 ${
              isCommandMode 
                ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-2 border-zinc-600'
            }`}
            onClick={() => setIsCommandMode(!isCommandMode)}
            onPointerDown={(e) => e.stopPropagation()} // Prevent touches on button from panning
          >
            {isCommandMode ? 'ОТМЕНА' : 'КОМАНДОВАТЬ'}
          </button>
        </div>
      )}

      <GameOverScreen gameState={gameState} />
        </>
      )}
    </div>
  );
}

