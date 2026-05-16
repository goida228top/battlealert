import React from 'react';
import { ArrowLeft, Smartphone } from 'lucide-react';

interface SettingsMenuProps {
  setAppState: (state: any) => void;
  settings: {
    showMobileControls: boolean;
  };
  setSettings: (settings: any) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ setAppState, settings, setSettings }) => {
  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-zinc-950 text-white overflow-hidden">
      <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
        <button 
          onClick={() => setAppState('MENU')}
          className="mr-4 p-2 hover:bg-zinc-800 rounded transition-colors"
          id="settings-back-button"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest text-red-600">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="space-y-8">
          {typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && (
            <section id="settings-mobile-section">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="text-red-500" size={20} />
                <h2 className="text-lg font-bold uppercase tracking-tight">Мобильное управление</h2>
              </div>
              
              <div className="bg-zinc-900 p-4 border border-zinc-800 rounded flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-200">Дополнительные кнопки</p>
                  <p className="text-sm text-zinc-500 font-medium">Показывать кнопки "Командовать" и "Построить" на телефонах.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.showMobileControls}
                    onChange={(e) => setSettings({ ...settings, showMobileControls: e.target.checked })}
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
    </div>
  );
};
