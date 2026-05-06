import React, { useEffect, useState, useRef } from 'react';
import { Activity, X, Maximize2, Minimize2, BarChart2 } from 'lucide-react';

interface FPSCounterProps {
  onClose?: () => void;
}

export const FPSCounter: React.FC<FPSCounterProps> = ({ onClose }) => {
  const [fps, setFps] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  // 0: Minimal, 1: Graph, 2: Extended
  const [mode, setMode] = useState<0 | 1 | 2>(1); 
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const requestRef = useRef<number>();
  
  const avgFps = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
  const minFps = history.length ? Math.min(...history) : 0;
  const maxFps = history.length ? Math.max(...history) : 0;

  useEffect(() => {
    const loop = (timestamp: number) => {
      frameCount.current++;
      const delta = timestamp - lastTime.current;
      
      // Update FPS every 500ms
      if (delta >= 500) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        setHistory(prev => {
          const newHistory = [...prev, currentFps];
          if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
          return newHistory;
        });
        
        frameCount.current = 0;
        lastTime.current = timestamp;
      }
      
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const cycleMode = () => {
    setMode(m => (m === 2 ? 0 : (m + 1) as any));
  };

  const renderGraph = () => {
    if (history.length < 2) return null;
    const maxVal = 60; // Assume 60 fps max for the graph scale
    const width = 200;
    const height = 60;
    const pts = history.map((val, i) => {
      const x = (i / (50 - 1)) * width;
      const h = Math.min((val / maxVal) * height, height);
      const y = height - h;
      return `${x},${y}`;
    });

    const isGood = fps >= 45;
    const isOk = fps >= 30 && fps < 45;
    const strokeColor = isGood ? '#22c55e' : isOk ? '#eab308' : '#ef4444';
    const fillGradient = isGood ? 'url(#greenGradient)' : isOk ? 'url(#yellowGradient)' : 'url(#redGradient)';

    const d = `M 0,${height} L 0,${pts[0].split(',')[1]} L ${pts.join(' L ')} L ${width},${height} Z`;

    return (
      <div className="relative mt-2" style={{ width: '200px', height: '60px' }}>
        <svg width="200" height="60" viewBox="0 0 200 60" className="overflow-visible">
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={d} fill={fillGradient} />
          <polyline points={pts.join(' ')} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  const getMemoryStr = () => {
    const memory = (performance as any).memory;
    if (!memory) return 'N/A';
    return `${Math.round(memory.usedJSHeapSize / 1048576)} MB / ${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`;
  };

  const fpsColor = fps >= 45 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  if (mode === 0) {
    return (
      <div 
        onClick={cycleMode}
        className="absolute top-4 right-4 bg-zinc-900/80 border border-zinc-700 backdrop-blur-sm p-2 rounded shadow-lg flex items-center gap-2 cursor-pointer select-none z-50 hover:bg-zinc-800 transition-colors"
      >
        <Activity className="w-4 h-4 text-zinc-400" />
        <span className={`font-mono font-bold ${fpsColor}`}>{fps} FPS</span>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bg-zinc-900/90 border border-zinc-700/50 backdrop-blur-md p-3 rounded-lg shadow-2xl flex flex-col cursor-pointer select-none z-50 min-w-[220px]" onClick={cycleMode}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-200 font-bold text-sm">Performance</span>
        </div>
        <div className={`font-mono text-xl font-black ${fpsColor}`}>
          {fps} <span className="text-xs text-zinc-500 font-medium">FPS</span>
        </div>
      </div>
      
      {renderGraph()}

      {mode === 2 && (
        <div className="mt-3 pt-3 border-t border-zinc-700/50 flex flex-col gap-1 text-xs font-mono text-zinc-400">
          <div className="flex justify-between">
            <span>MIN</span>
            <span className="text-zinc-200">{minFps}</span>
          </div>
          <div className="flex justify-between">
            <span>AVG</span>
            <span className="text-zinc-200">{avgFps}</span>
          </div>
          <div className="flex justify-between">
            <span>MAX</span>
            <span className="text-zinc-200">{maxFps}</span>
          </div>
          <div className="flex justify-between mt-1 pt-1 border-t border-zinc-800">
            <span>MEM</span>
            <span className="text-zinc-200">{getMemoryStr()}</span>
          </div>
        </div>
      )}
      <div className="absolute top-full right-0 mt-1 flex gap-1">
          <div className={`w-2 h-2 rounded-full ${mode === 0 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
          <div className={`w-2 h-2 rounded-full ${mode === 1 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
          <div className={`w-2 h-2 rounded-full ${mode === 2 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
      </div>
    </div>
  );
};
