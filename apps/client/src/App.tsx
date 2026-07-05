// ====================================================================
// Encore Dashboard - Main Application with Routing
// ====================================================================

import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth.store';
import { ROUTES } from './constants/app.constants';
import { setCookie, COOKIE_KEYS } from './lib/cookies';
import { CheckCircleIcon, MailIcon } from './assets';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Guards
import AuthGuard, { PublicOnlyGuard } from './components/guards/AuthGuard';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboard Pages
import OverviewPage from './pages/dashboard/OverviewPage';
import PlansPage from './pages/dashboard/PlansPage';
import SubscribersPage from './pages/dashboard/SubscribersPage';
import DunningPage from './pages/dashboard/DunningPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';
import InvoicesPage from './pages/dashboard/InvoicesPage';
import PayoutsPage from './pages/dashboard/PayoutsPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Portal Pages
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalPaymentsPage from './pages/portal/PortalPaymentsPage';
import PortalInvoicesPage from './pages/portal/PortalInvoicesPage';
import PortalPaymentMethodPage from './pages/portal/PortalPaymentMethodPage';
import PortalPlanPage from './pages/portal/PortalPlanPage';

// Portal Layout & Guard
import PortalLayout from './components/layout/PortalLayout';
import PortalGuard from './components/guards/PortalGuard';

// Public Marketing Pages
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/public/LandingPage';
import PricingPage from './pages/public/PricingPage';
import AboutPage from './pages/public/AboutPage';
import { TermsPage, PrivacyPage, SecurityPage } from './pages/public/LegalPages';
import ContactPage from './pages/public/ContactPage';

// Onboarding Pages

import WelcomePage from './pages/onboarding/WelcomePage';
import KycPage from './pages/onboarding/KycPage';
import PaymentSetupPage from './pages/onboarding/PaymentSetupPage';
import PaymentCallbackPage from './pages/onboarding/PaymentCallbackPage';
import PaymentMockCheckoutPage from './pages/onboarding/PaymentMockCheckoutPage';
import TierSelectionPage from './pages/onboarding/TierSelectionPage';
import OnboardingProgressPage from './pages/onboarding/OnboardingProgressPage';

// Public Onboarding/Setup Pages
import CheckoutPage from './pages/checkout/CheckoutPage';
import SetupPage from './pages/checkout/SetupPage';

// Placeholder components for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Coming soon</p>
    </div>
  );
}

function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {token ? (
          <>
            <CheckCircleIcon size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Email Verified Successfully!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>You can now sign in to your account.</p>
            <a href={ROUTES.LOGIN} className="btn btn-primary">Sign In</a>
          </>
        ) : (
          <>
            <MailIcon size={48} style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Verify Your Email</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please check your email for the verification link.</p>
          </>
        )}
      </div>
    </div>
  );
}

function OAuthCallbackPage() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const onboardingRequired = params.get('onboarding_required') === 'true';
  const { setAccessToken, initialize } = useAuthStore();

  useEffect(() => {
    if (accessToken && refreshToken) {
      setCookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, 1);
      setCookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, 7);
      setAccessToken(accessToken);
      initialize();
    }
  }, [accessToken, refreshToken, setAccessToken, initialize]);

  if (!accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (onboardingRequired) {
    return <Navigate to={ROUTES.ONBOARDING.WELCOME} replace />;
  }

  return <Navigate to={ROUTES.DASHBOARD.OVERVIEW} replace />;
}

function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;
  }

  return <PlaceholderPage title="Reset Password" />;
}

export default function App() {
  const { isAuthenticated, fetchProfile } = useAuthStore();

  // Fetch merchant profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: 8,
            background: '#333',
            color: '#fff',
            fontSize: 14,
          },
        }}
      />

      <Routes>
        {/* ================================================================ */}
        {/* Public Routes (redirect to dashboard if authenticated) */}
        {/* ================================================================ */}
        <Route element={<PublicOnlyGuard />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<EmailVerificationPage />} />
          <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />
        </Route>

        {/* ================================================================ */}
        {/* Protected Routes (require authentication) */}
        {/* ================================================================ */}
        <Route element={<AuthGuard />}>
          {/* Dashboard */}
          <Route path={ROUTES.DASHBOARD.OVERVIEW} element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="dunning" element={<DunningPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Onboarding */}
          <Route path={ROUTES.ONBOARDING.WELCOME} element={<WelcomePage />} />
          <Route path={ROUTES.ONBOARDING.KYC} element={<KycPage />} />
          <Route path={ROUTES.ONBOARDING.PAYMENT_SETUP} element={<PaymentSetupPage />} />
          <Route path={ROUTES.ONBOARDING.PAYMENT_CALLBACK} element={<PaymentCallbackPage />} />
          <Route path={ROUTES.ONBOARDING.TIER_SELECTION} element={<TierSelectionPage />} />
          <Route path={ROUTES.ONBOARDING.PROGRESS} element={<OnboardingProgressPage />} />
        </Route>

        {/* ================================================================ */}
        {/* Subscriber Portal (separate auth context — no merchant auth needed) */}
        {/* ================================================================ */}
        <Route path={ROUTES.PORTAL.LOGIN} element={<PortalLoginPage />} />
        <Route element={<PortalGuard />}>
          <Route element={<PortalLayout />}>
            <Route path={ROUTES.PORTAL.DASHBOARD} element={<PortalDashboardPage />} />
            <Route path={ROUTES.PORTAL.PAYMENT_HISTORY} element={<PortalPaymentsPage />} />
            <Route path={ROUTES.PORTAL.INVOICES} element={<PortalInvoicesPage />} />
            <Route path={ROUTES.PORTAL.UPDATE_PAYMENT} element={<PortalPaymentMethodPage />} />
            <Route path={ROUTES.PORTAL.PLAN} element={<PortalPlanPage />} />
          </Route>
        </Route>

        {/* ================================================================ */}
        {/* Public Marketing Site Routes (Bamboo Theme layout) */}
        {/* ================================================================ */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.PRICING} element={<PricingPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.TERMS} element={<TermsPage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
          <Route path={ROUTES.SECURITY} element={<SecurityPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        </Route>

        {/* ================================================================ */}
        {/* Public Enrollment & Onboarding Pages */}
        {/* ================================================================ */}
        <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
        <Route path={ROUTES.SETUP} element={<SetupPage />} />
        <Route path={ROUTES.ONBOARDING.PAYMENT_MOCK_CHECKOUT} element={<PaymentMockCheckoutPage />} />


        {/* ================================================================ */}
        {/* Fallback: Redirect to dashboard or login */}
        {/* ================================================================ */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}