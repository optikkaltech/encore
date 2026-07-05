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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('encore-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });
  const location = useLocation();

  // Sync theme with HTML document element attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('encore-theme', theme);
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)', overflow: 'hidden', maxWidth: '100vw' }}>
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
          minWidth: 0,        /* prevent flex child from overflowing */
          overflow: 'hidden',
        }}
      >
        <TopBar 
          onMenuClick={() => setMobileMenuOpen(true)} 
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <main style={{
          flex: 1,
          padding: 'var(--space-lg) var(--space-xl)',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          overflow: 'hidden',
          boxSizing: 'border-box',
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
            width: 100vw;
            max-width: 100vw;
          }
          main {
            padding: var(--space-md) var(--space-sm) !important;
            overflow-x: hidden;
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}