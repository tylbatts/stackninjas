// frontend/src/App.tsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';
import { TicketProvider } from './context/TicketContext';
import { ReactNode } from 'react';

import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitTicket from './pages/SubmitTicket';
import TicketsList from './pages/TicketsList';
import AIPlaceholder from './pages/AIPlaceholder';
import TicketDetail from './pages/TicketDetail';
import AdminRouter from './admin/AdminRouter';
import { AdminAuthProvider } from './admin/AuthContext';
// Wrapper for public routes that need Keycloak and Ticket context
const PublicWrapper = ({ children }: { children: ReactNode }) => (
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      enableLogging: import.meta.env.DEV,
      checkLoginIframe: false,
    }}
  >
    <TicketProvider>{children}</TicketProvider>
  </ReactKeycloakProvider>
);
// Layout for public routes under Keycloak and Ticket context
const PublicRoutes = () => <PublicWrapper><Outlet /></PublicWrapper>;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes under /admin with app-level auth */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <AdminRouter />
            </AdminAuthProvider>
          }
        />
        {/* Public routes under root, using Keycloak for auth and Ticket context */}
        <Route element={<PublicRoutes />}>          
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitTicket />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/:ticketId" element={<TicketDetail />} />
            <Route path="/ai" element={<AIPlaceholder />} />
          </Route>
          {/* Public catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

