// ====================================================================
// Encore - Sidebar Navigation
// ====================================================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { APP, DASHBOARD, ROUTES, SIDEBAR_ITEMS, SIDEBAR_BOTTOM_ITEMS } from '../../constants/app.constants';
import {
  Home, Users, CreditCard, ArrowLeftRight, AlertTriangle,
  FileText, Banknote, Settings, ChevronDown, ChevronRight,
  Plus, LogOut
} from 'lucide-react';

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  users: Users,
  'credit-card': CreditCard,
  'arrow-left-right': ArrowLeftRight,
  'alert-triangle': AlertTriangle,
  'file-text': FileText,
  banknote: Banknote,
  settings: Settings,
};

const truncateStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose: _onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { merchant, logout } = useAuthStore();
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside 
        className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '64px' : 'var(--sidebar-width)',
          height: '100vh',
          background: 'var(--nomba-teal)',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo Area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-md)',
          height: 'var(--topbar-height)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--nomba-lime)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--nomba-teal)',
            fontSize: 16,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(200,255,0,0.40)',
          }}>
            E
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              {APP.NAME}
            </span>
          )}
        </div>
        {onToggle && (
          <button onClick={onToggle} style={{
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            borderRadius: 6,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            flexShrink: 0,
          }}>
            <ChevronDown size={15} style={{ transform: isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 250ms' }} />
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      <div style={{ padding: '12px var(--space-md)' }}>
        <button
          className="btn btn-full"
          onClick={() => navigate(ROUTES.DASHBOARD.OVERVIEW)}
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 8,
            background: 'rgba(200,255,0,0.12)',
            color: 'var(--nomba-lime)',
            border: '1px solid rgba(200,255,0,0.20)',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            padding: '8px 12px',
          }}
        >
          <Plus size={15} />
          {!isCollapsed && <span>Quick Actions</span>}
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px var(--space-sm)' }}>
        {/* Main Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: active ? 'rgba(200,255,0,0.12)' : 'transparent',
                  color: active ? 'var(--nomba-lime)' : 'rgba(255,255,255,0.65)',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  transition: 'all 150ms',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderLeft: active ? '2px solid var(--nomba-lime)' : '2px solid transparent',
                  letterSpacing: '-0.1px',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#FFFFFF'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
              >
                {Icon && <Icon size={18} />}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>



        {/* Collections Section */}
        {!isCollapsed && (
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {collectionsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{DASHBOARD.SIDEBAR.COLLECTIONS}</span>
            </button>
          </div>
        )}

        {/* Bottom Nav Items */}
        {!isCollapsed && (
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SIDEBAR_BOTTOM_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: active ? 'rgba(200,255,0,0.12)' : 'transparent',
                    color: active ? 'var(--nomba-lime)' : 'rgba(255,255,255,0.65)',
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    transition: 'all 150ms',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    borderLeft: active ? '2px solid var(--nomba-lime)' : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#FFFFFF'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom Section: Usage & Profile */}
      {!isCollapsed && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          background: 'rgba(0,0,0,0.12)',
        }}>
          {/* Usage Widget */}
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Plan: {merchant?.pricingTier ? merchant.pricingTier.charAt(0).toUpperCase() + merchant.pricingTier.slice(1) : 'Starter'}</span>
              <span style={{ color: 'var(--nomba-lime)', fontWeight: 600 }}>
                {merchant?.currentSubscriberCount || 0}/{merchant?.maxSubscribers || 20}
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'var(--nomba-lime)',
                borderRadius: 2,
                width: merchant?.currentSubscriberCount && merchant?.maxSubscribers
                  ? `${Math.min((merchant.currentSubscriberCount / merchant.maxSubscribers) * 100, 100)}%`
                  : '35%',
                transition: 'width 600ms ease',
                boxShadow: '0 0 8px rgba(200,255,0,0.5)',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>subscribers used</div>
          </div>

          {/* Upgrade Button */}
          <button
            className="btn btn-sm btn-full"
            onClick={() => navigate(ROUTES.ONBOARDING.TIER_SELECTION)}
            style={{
              background: 'var(--nomba-lime)',
              color: 'var(--nomba-teal)',
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 7,
              padding: '7px',
            }}
          >
            Upgrade Plan
          </button>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 2 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(200,255,0,0.15)',
              border: '1px solid rgba(200,255,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--nomba-lime)',
              flexShrink: 0,
            }}>
              {merchant?.businessName?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', ...truncateStyle }}>
                {merchant?.businessName || 'User'}
              </div>
              {merchant?.merchantCode && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1, ...truncateStyle }} title={`Merchant Code: ${merchant.merchantCode}`}>
                  {merchant.merchantCode}
                </div>
              )}
            </div>
            <button onClick={logout} style={{
              background: 'rgba(255,255,255,0.07)',
              border: 'none',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              transition: 'all 150ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
      </aside>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-container {
            transform: translateX(-100%);
            box-shadow: 8px 0 32px rgba(0,0,0,0.35);
            background: var(--nomba-teal) !important;
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}