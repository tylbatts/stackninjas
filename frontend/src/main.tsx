// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import App from './App';               // assuming you default-export App
import './style/globals.css';
import keycloak from './keycloak';     // your Keycloak instance

// grab the container
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// create a root and render
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ReactKeycloakProvider authClient={keycloak}>
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
