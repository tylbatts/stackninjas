import { Outlet, Navigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';

export function Layout() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      {/* Navbar / Sidebar would go here */}
      <Outlet />
    </div>
  );
}
