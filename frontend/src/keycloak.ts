// src/keycloak.ts
import Keycloak from 'keycloak-js';

// Initialize Keycloak client
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

// Keycloak event handlers for detailed debug
keycloak.onReady = (authenticated) => {
  console.debug('[KC] onReady', { authenticated });
};
keycloak.onAuthSuccess = () => {
  console.debug('[KC] onAuthSuccess');
};
keycloak.onAuthError = (error: any) => {
  console.error('[KC] onAuthError', error);
};
// Token refresh success (alias for onTokenRefresh)
keycloak.onAuthRefreshSuccess = () => {
  console.debug('[KC] onAuthRefreshSuccess (token refreshed)');
};
// Token refresh error
// onAuthRefreshError does not receive an error payload in TypeScript definitions
keycloak.onAuthRefreshError = () => {
  console.error('[KC] onAuthRefreshError');
};
// Token expired event
keycloak.onTokenExpired = () => {
  console.warn('[KC] onTokenExpired');
};


export default keycloak;
