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
  
  const brandColor = config?.brandColor || '#7c3aed';

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
                color: isActive ? brandColor : 'var(--text-secondary)',
                background: isActive ? `${brandColor}12` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Profile & Sign out */}
      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
            flexShrink: 0
          }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {subscriber?.firstName?.[0]?.toUpperCase()}{subscriber?.lastName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {subscriber?.firstName} {subscriber?.lastName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
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
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-primary)',
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
                background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 12,
              }}>
                {config?.businessName?.[0] || 'E'}
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {config?.businessName || 'Subscriber Portal'}
            </span>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6 }}
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
            background: 'var(--bg-card)',
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
                color: 'var(--text-secondary)'
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
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
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
