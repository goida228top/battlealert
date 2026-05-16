import React from 'react';
import { Maximize, X } from 'lucide-react';
import { motion } from 'motion/react';

interface FullscreenPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const FullscreenPrompt: React.FC<FullscreenPromptProps> = ({ onAccept, onDecline }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90vw] max-w-sm"
    >
      <div className="bg-zinc-950 border-2 border-red-900 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)]">
        <div className="flex items-center justify-between bg-red-900/20 px-4 py-2 border-b border-red-900/50">
          <div className="flex items-center gap-2">
            <Maximize size={16} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-100">Запрос системы</span>
          </div>
          <button 
            onClick={onDecline}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col items-center">
          <p className="text-white font-bold uppercase tracking-tight text-center mb-4 text-xs leading-relaxed">
            Командир, для полного контроля над полем боя рекомендуется <span className="text-red-500">полноэкранный режим</span>
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onDecline}
              className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              Отмена
            </button>
            <button 
              onClick={onAccept}
              className="flex-1 py-3 bg-red-700 border border-red-500 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-red-600 transition-all"
            >
              Включить
            </button>
          </div>
        </div>

        {/* Decorative scanline */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-red-500/20 shadow-[0_-1px_10px_rgba(220,38,38,0.5)] animate-pulse" />
      </div>
    </motion.div>
  );
};
