import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style/globals.css';
import { ToastProvider } from './components/ui/Toast';

// Grab the root container
const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);