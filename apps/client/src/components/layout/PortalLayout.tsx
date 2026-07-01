import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePortalStore } from '../../store/portal.store';
import { ROUTES } from '../../constants/app.constants';

const NAV_LINKS = [
  { label: 'My Subscription', path: ROUTES.PORTAL.DASHBOARD },
  { label: 'Payments', path: ROUTES.PORTAL.PAYMENT_HISTORY },
  { label: 'Invoices', path: ROUTES.PORTAL.INVOICES },
  { label: 'Payment Method', path: ROUTES.PORTAL.UPDATE_PAYMENT },
];

/**
 * White-labeled layout for the subscriber portal.
 * Applies merchant branding (logo, name, brandColor) loaded from portal.store.
 */
export default function PortalLayout() {
  const { subscriber, config, logout } = usePortalStore();
  const navigate = useNavigate();
  const brandColor = config?.brandColor || '#7c3aed';

  const handleLogout = () => {
    logout();
    navigate(ROUTES.PORTAL.LOGIN);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Bar ── */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt={config.businessName} style={{ height: 32, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              {config?.businessName?.[0] || 'E'}
            </div>
          )}
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            {config?.businessName || 'Subscriber Portal'}
          </span>
        </div>

        {/* ── Subscriber Avatar & Logout ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {subscriber?.firstName} {subscriber?.lastName}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid var(--border-primary)',
            borderRadius: 6, padding: '4px 12px', fontSize: 13,
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Sub-nav ── */}
      <nav style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '0 24px',
        display: 'flex',
        gap: 0,
      }}>
        {NAV_LINKS.map(link => (
          <NavLink key={link.path} to={link.path} end={link.path === ROUTES.PORTAL.DASHBOARD}
            style={({ isActive }) => ({
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? brandColor : 'var(--text-secondary)',
              borderBottom: isActive ? `2px solid ${brandColor}` : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Page Content ── */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      {config?.poweredBy && (
        <footer style={{
          padding: '16px 24px', textAlign: 'center',
          fontSize: 12, color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-primary)',
        }}>
          Powered by <strong style={{ color: brandColor }}>Encore</strong>
        </footer>
      )}
    </div>
  );
}
