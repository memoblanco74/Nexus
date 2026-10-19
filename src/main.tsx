import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ParentPortal } from './components/parent/ParentPortal';
import { PublicBooking } from './components/public/PublicBooking';
import { QueueDisplay } from './components/public/QueueDisplay';
import './index.css';

const portalMatch = window.location.hash.match(/^#\/parent\/([0-9a-fA-F-]{36})$/);
const bookMatch = window.location.hash.match(/^#\/book\/([0-9a-fA-F-]{36})$/);
const queueMatch = window.location.hash.match(/^#\/queue\/([0-9a-fA-F-]{36})$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {portalMatch ? <ParentPortal token={portalMatch[1]} /> : bookMatch ? <PublicBooking token={bookMatch[1]} /> : queueMatch ? <QueueDisplay token={queueMatch[1]} /> : <App />}
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Nexus/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}
