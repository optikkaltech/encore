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
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo Area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-md)',
          height: 'var(--topbar-height)',
          borderBottom: '1px solid var(--border-light)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            E
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {APP.NAME}
            </span>
          )}
        </div>
        {onToggle && (
          <button onClick={onToggle} className="btn-ghost btn-icon" style={{ flexShrink: 0 }}>
            <ChevronDown size={16} style={{ transform: isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 250ms' }} />
          </button>
        )}
      </div>

      {/* Start Chat Button */}
      <div style={{ padding: 'var(--space-md)' }}>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate(ROUTES.DASHBOARD.OVERVIEW)}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 8 }}
        >
          <Plus size={16} />
          {!isCollapsed && <span>Start Chat</span>}
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-sm)' }}>
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
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: active ? 'var(--bg-secondary)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  transition: 'all 150ms',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {Icon && <Icon size={20} />}
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
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {collectionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{DASHBOARD.SIDEBAR.COLLECTIONS}</span>
            </button>
          </div>
        )}

        {/* Bottom Nav Items */}
        {!isCollapsed && (
          <div style={{ marginTop: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: active ? 'var(--bg-secondary)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 14,
                    transition: 'all 150ms',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {Icon && <Icon size={20} />}
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
          borderTop: '1px solid var(--border-light)',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}>
          {/* Usage Widget */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Plan: {merchant?.pricingTier ? merchant.pricingTier.charAt(0).toUpperCase() + merchant.pricingTier.slice(1) : 'Starter'}
            </div>
            <div className="progress-bar" style={{ marginBottom: 4 }}>
              <div className="progress-bar-fill" style={{
                width: merchant?.currentSubscriberCount && merchant?.maxSubscribers
                  ? `${Math.min((merchant.currentSubscriberCount / merchant.maxSubscribers) * 100, 100)}%`
                  : '35%'
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {merchant?.currentSubscriberCount || 7}/{merchant?.maxSubscribers || 20} chats left
            </div>
          </div>

          {/* Upgrade Button */}
          <button
            className="btn btn-secondary btn-sm btn-full"
            onClick={() => navigate(ROUTES.ONBOARDING.TIER_SELECTION)}
          >
            Upgrade
          </button>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}>
              {merchant?.businessName?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', ...truncateStyle }}>
                {merchant?.businessName || 'User'}
              </div>
              {merchant?.merchantCode && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, ...truncateStyle }} title={`Merchant Code: ${merchant.merchantCode}`}>
                  ID: {merchant.merchantCode}
                </div>
              )}
            </div>
            <button onClick={logout} className="btn-ghost btn-icon" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
      </aside>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-container {
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

// ====================================================================
// Helper Sub-components
// ====================================================================

function NavItem({ icon: Icon, label, isCollapsed }: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  isCollapsed?: boolean;
}) {
  return (
    <button style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '6px 12px 6px 28px',
      width: '100%',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: 6,
      fontSize: 13,
      color: 'var(--text-secondary)',
      transition: 'all 150ms',
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={16} />
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
}

const truncateStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};