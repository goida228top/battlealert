import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface SettingsMenuProps {
  setAppState: (state: any) => void;
  settings: {
    showMobileControls: boolean;
  };
  setSettings: (settings: any) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ setAppState, settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });

  const handleSave = () => {
    setSettings(localSettings);
    setAppState('MENU');
  };

  const handleCancel = () => {
    setAppState('MENU');
  };

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-zinc-950 text-white overflow-hidden">
      <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h1 className="text-xl font-black uppercase tracking-widest text-red-600">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <div className="space-y-8">
          {typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && (
            <section id="settings-mobile-section">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="text-red-500" size={20} />
                <h2 className="text-lg font-bold uppercase tracking-tight">Мобильное управление</h2>
              </div>
              
              <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-none flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-200">Дополнительные кнопки</p>
                  <p className="text-sm text-zinc-500 font-medium">Показывать кнопки "Командовать" и "Построить" на телефонах.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.showMobileControls}
                    onChange={(e) => setLocalSettings({ ...localSettings, showMobileControls: e.target.checked })}
                    id="toggle-mobile-controls"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </section>
          )}

          {!((typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0))) && (
            <div className="text-zinc-500 italic text-center py-10 opacity-50">
              Настройки для ПК будут добавлены в будущих обновлениях.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="p-4 md:p-8 border-t border-zinc-800 bg-zinc-950 flex gap-4 shrink-0">
        <button 
          onClick={handleCancel}
          className="flex-1 py-3 md:py-4 px-4 md:px-12 text-xs md:text-base font-black uppercase tracking-widest border-2 bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 transition-all cursor-pointer rounded-none"
        >
          Назад
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-3 md:py-4 px-4 md:px-16 text-xs md:text-base font-black uppercase tracking-widest border-2 bg-red-700 hover:bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all cursor-pointer rounded-none"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};
