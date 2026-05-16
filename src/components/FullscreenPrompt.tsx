import React from 'react';
import { Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FullscreenPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const FullscreenPrompt: React.FC<FullscreenPromptProps> = ({ onAccept, onDecline }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-[1000]"
    >
      <div className="bg-zinc-900 border border-zinc-700 p-2 flex items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-2 px-2">
          <Maximize2 size={14} className="text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">Включить полный экран?</span>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={onDecline}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold uppercase text-zinc-500 transition-colors cursor-pointer"
          >
            Нет
          </button>
          <button 
            onClick={onAccept}
            className="px-3 py-1 bg-red-700 hover:bg-red-600 text-[10px] font-bold uppercase text-white transition-colors cursor-pointer"
          >
            Да
          </button>
        </div>
      </div>
    </motion.div>
  );
};
