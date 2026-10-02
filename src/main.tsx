import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/pushNotifications'

// Register service worker for push notifications on app launch
registerServiceWorker().catch((err) => console.warn('SW registration on init error:', err));

createRoot(document.getElementById("root")!).render(<App />);
