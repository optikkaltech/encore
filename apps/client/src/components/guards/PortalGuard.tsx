import { Navigate, Outlet } from 'react-router-dom';
import { usePortalStore } from '../../store/portal.store';
import { useEffect } from 'react';
import { ROUTES } from '../../constants/app.constants';

/**
 * PortalGuard — protects subscriber portal routes.
 * Reads from portal.store (separate from merchant AuthGuard).
 * Hydrates sessionStorage on first render to support page refreshes.
 */
export default function PortalGuard() {
  const { isAuthenticated, hydrateFromSession } = usePortalStore();

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  if (!isAuthenticated) {
    // Check sessionStorage directly in case hydration hasn't completed
    const token = sessionStorage.getItem('portal_token');
    if (!token) {
      return <Navigate to={ROUTES.PORTAL.LOGIN} replace />;
    }
  }

  return <Outlet />;
}
