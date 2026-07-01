// ====================================================================
// Encore - Auth Guard
// Redirects unauthenticated users to login page
// ====================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ROUTES } from '../../constants/app.constants';

export default function AuthGuard() {
  const { isAuthenticated, merchant } = useAuthStore();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  // Authenticated but onboarding not complete - redirect to onboarding (if not already there)
  if (merchant && !merchant.onboardingCompleted && !isOnboardingRoute) {
    return <Navigate to={ROUTES.ONBOARDING.WELCOME} replace />;
  }

  // Authenticated and onboarding complete - prevent going back to onboarding routes
  if (merchant && merchant.onboardingCompleted && isOnboardingRoute) {
    return <Navigate to={ROUTES.DASHBOARD.OVERVIEW} replace />;
  }

  return <Outlet />;
}

/**
 * Redirects authenticated users away from auth pages (login, register, etc.)
 */
export function PublicOnlyGuard() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD.OVERVIEW} replace />;
  }

  return <Outlet />;
}