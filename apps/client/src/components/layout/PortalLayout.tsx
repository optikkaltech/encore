import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePortalStore } from '../../store/portal.store';
import { ROUTES } from '../../constants/app.constants';
import { useDesktopDisplay } from '../../hooks/useDesktopDisplay';
import {
  MenuIcon,
  XIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  HistoryIcon,
  FileTextIcon,
  CreditCardIcon
} from '../../assets';

const NAV_LINKS = [
  { label: 'My Subscription', path: ROUTES.PORTAL.DASHBOARD, icon: LayoutDashboardIcon },
  { label: 'Payments', path: ROUTES.PORTAL.PAYMENT_HISTORY, icon: HistoryIcon },
  { label: 'Invoices', path: ROUTES.PORTAL.INVOICES, icon: FileTextIcon },
  { label: 'Payment Method', path: ROUTES.PORTAL.UPDATE_PAYMENT, icon: CreditCardIcon },
];

export default function PortalLayout() {
  const { subscriber, config, logout } = usePortalStore();
  const navigate = useNavigate();
  const isDesktop = useDesktopDisplay();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.PORTAL.LOGIN);
  };

  const navContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Brand logo & name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        {config?.logoUrl ? (
          <img src={config.logoUrl} alt={config.businessName} style={{ height: 32, objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--nomba-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--nomba-teal)', fontWeight: 800, fontSize: 15,
            boxShadow: '0 0 12px rgba(200, 255, 0, 0.3)',
          }}>
            {config?.businessName?.[0]?.toUpperCase() || 'E'}
          </div>
        )}
        <span style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
          {config?.businessName || 'Subscriber Portal'}
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {NAV_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === ROUTES.PORTAL.DASHBOARD}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--nomba-lime)' : 'rgba(255, 255, 255, 0.65)',
                background: isActive ? 'rgba(200, 255, 0, 0.12)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid var(--nomba-lime)' : '3px solid transparent',
              })}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!target.classList.contains('active')) {
                  target.style.background = 'rgba(255, 255, 255, 0.06)';
                  target.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!target.classList.contains('active')) {
                  target.style.background = 'transparent';
                  target.style.color = 'rgba(255, 255, 255, 0.65)';
                }
              }}
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Profile & Sign out */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(200, 255, 0, 0.15)',
            border: '1px solid rgba(200, 255, 0, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nomba-lime)',
            flexShrink: 0, fontWeight: 700
          }}>
            <span>
              {subscriber?.firstName?.[0]?.toUpperCase()}{subscriber?.lastName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {subscriber?.firstName} {subscriber?.lastName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {subscriber?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: 'rgba(255, 255, 255, 0.07)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          <LogOutIcon size={14} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* Mobile Top Header */}
      {!isDesktop && (
        <header style={{
          background: 'var(--nomba-teal)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          padding: '0 16px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 90,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt={config.businessName} style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--nomba-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--nomba-teal)', fontWeight: 800, fontSize: 13,
              }}>
                {config?.businessName?.[0]?.toUpperCase() || 'E'}
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 15, color: '#FFFFFF' }}>
              {config?.businessName || 'Subscriber Portal'}
            </span>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', padding: 6 }}
          >
            <MenuIcon size={22} />
          </button>
        </header>
      )}

      {/* Mobile Navigation Drawer (Overlay Sidebar) */}
      {!isDesktop && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
          />
          {/* Drawer body */}
          <div style={{
            position: 'relative',
            width: 280,
            background: 'var(--nomba-teal)',
            height: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInLeft 200ms ease-out',
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <XIcon size={20} />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Permanent Sidebar */}
      {isDesktop && (
        <aside style={{
          width: 260,
          background: 'var(--nomba-teal)',
          borderRight: 'none',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}>
          {navContent}
        </aside>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: isDesktop ? '32px 40px' : '24px 16px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
