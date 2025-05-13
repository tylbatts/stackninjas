// React import not required under new JSX transform
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();
  console.debug('[RequireAuth] isAuthenticated:', isAuthenticated, 'path:', location.pathname);

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended path
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}