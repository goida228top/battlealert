import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BUILD_VERSION } from './game/network';

console.log(`%c[BATTLE ALERT] 🚀 КЛИЕНТ ОБНОВЛЕН ДО: ${BUILD_VERSION}`, 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold; padding: 10px; border: 2px solid #000;');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
