import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BUILD_VERSION } from './game/network';

console.log(`%c[BATTLE ALERT] BUILD VERSION: ${BUILD_VERSION}`, 'background: #f00; color: #fff; font-weight: bold; padding: 4px;');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
