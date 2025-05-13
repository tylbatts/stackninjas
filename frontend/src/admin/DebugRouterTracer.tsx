import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * DebugRouterTracer logs every location change (pathname, search, hash)
 * and renders its children.
 */
export default function DebugRouterTracer({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Log the exact location object on initial mount
  useEffect(() => {
    console.debug('[Router] initial location object:', location);
  }, []);
  useEffect(() => {
    console.debug('[Router] location changed', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location]);
  return <>{children}</>;
}