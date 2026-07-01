// ====================================================================
// Encore - Dashboard Layout
// Sidebar + TopBar + Main Content Area
// ====================================================================

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandBar from '../common/CommandBar';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <CommandBar />
      
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="show-on-mobile"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 90,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 200ms ease-out',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div 
        className="main-content-wrapper"
        style={{
          flex: 1,
          transition: 'margin-left 250ms ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main style={{
          flex: 1,
          padding: 'var(--space-lg) var(--space-xl)',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .main-content-wrapper {
          margin-left: ${sidebarCollapsed ? '64px' : 'var(--sidebar-width)'};
        }
        @media (max-width: 768px) {
          .main-content-wrapper {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}