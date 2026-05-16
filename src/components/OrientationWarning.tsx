import React from 'react';
import { RotateCw, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export const OrientationWarning: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/assets/soviet_base.png')] bg-cover bg-center opacity-20 grayscale" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <motion.div
          animate={{ rotate: [0, 90, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.6, 1] }}
          className="mb-8"
        >
          <Smartphone size={80} className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        </motion.div>

        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 font-display italic">
          Командир, смените позицию!
        </h1>
        
        <div className="w-16 h-1 bg-red-600 mb-6 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
        
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs leading-relaxed mb-8">
          Для тактического превосходства и управления базой переверните устройство в <span className="text-red-500">альбомный режим</span>
        </p>

        <div className="flex items-center gap-3 text-zinc-600 text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-4 py-2 rounded-full bg-black/40">
          <RotateCw size={14} className="animate-spin-slow" />
          <span>Ожидание маневра...</span>
        </div>
      </div>

      {/* Military corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-red-900/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-red-900/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-red-900/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-red-900/30" />
    </div>
  );
};
