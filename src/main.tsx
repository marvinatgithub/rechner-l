import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Android PWA installation and offline capabilities
if ('serviceWorker' in navigator && !window.location.host.includes('run.app')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
