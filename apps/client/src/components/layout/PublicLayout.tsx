import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/app.constants';
import { MenuIcon, XIcon } from '../../assets';
import { useDesktopDisplay } from '../../hooks/useDesktopDisplay';
import { useAuthStore } from '../../store/auth.store';


export default function PublicLayout() {
  const isDesktop = useDesktopDisplay();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (

    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Scope Global Styles for public website layout */}
      <style>{`
        .pub-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 1000;
          background: rgba(11, 46, 40, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .pub-header {
            padding: 0 20px;
            height: 64px;
          }
        }
        .pub-logo {
          font-size: 22px;
          font-weight: 800;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .pub-logo-dot {
          color: var(--nomba-lime);
        }
        .pub-nav {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        @media (max-width: 768px) {
          .pub-nav {
            display: none;
          }
        }
        .pub-nav-link {
          color: rgba(255, 255, 255, 0.75);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          position: relative;
          padding: 6px 0;
          transition: color 0.2s ease;
        }
        .pub-nav-link:hover {
          color: #FFFFFF;
        }
        .pub-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--nomba-lime);
          transition: width 0.2s ease;
        }
        .pub-nav-link:hover::after {
          width: 100%;
        }
        .pub-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .pub-actions {
            display: none;
          }
        }
        .pub-btn-signin {
          color: #FFFFFF;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          padding: 9px 22px;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pub-btn-signin:hover {
          border-color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }
        .pub-btn-signup {
          background: var(--nomba-lime);
          color: var(--nomba-teal);
          padding: 10px 24px;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pub-btn-signup:hover {
          background: var(--nomba-lime-hover);
          transform: translateY(-1px);
        }
        .pub-btn-signup span {
          transition: transform 0.2s ease;
        }
        .pub-btn-signup:hover span {
          transform: translateX(3px);
        }
        .pub-menu-toggle {
          display: none;
          color: #FFFFFF;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px;
        }
        @media (max-width: 768px) {
          .pub-menu-toggle {
            display: block;
          }
        }
        .pub-mobile-drawer {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 46, 40, 0.98);
          backdrop-filter: blur(16px);
          z-index: 999;
          display: flex;
          flex-direction: column;
          padding: 40px 24px;
          gap: 28px;
          animation: drawerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pub-mobile-link {
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 14px;
        }
        .pub-footer {
          background: #0B2E28;
          color: rgba(255, 255, 255, 0.65);
          padding: 80px 40px 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        @media (max-width: 768px) {
          .pub-footer {
            padding: 60px 20px 30px;
          }
        }
        .pub-footer-grid {
          display: grid;
          grid-template-columns: 2fr repeat(4, 1.2fr) 2fr;
          gap: 48px;
          max-width: 1200px;
          margin: 0 auto 60px;
        }
        @media (max-width: 1024px) {
          .pub-footer-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
          }
        }
        @media (max-width: 600px) {
          .pub-footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .pub-footer-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pub-footer-logo-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.55);
        }
        .pub-footer-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--nomba-lime);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .pub-footer-link {
          color: rgba(255, 255, 255, 0.65);
          font-size: 13.5px;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .pub-footer-link:hover {
          color: #FFFFFF;
        }
        .pub-footer-address {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
        }
        .pub-footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 30px;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.45);
          flex-wrap: wrap;
          gap: 16px;
        }
        .pub-footer-badges {
          display: flex;
          gap: 12px;
        }
        .pub-footer-badge-btn {
          height: 36px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .pub-footer-badge-btn:hover {
          opacity: 0.85;
        }
      `}</style>

      {/* Navigation Header */}
      <header className="pub-header">
        <Link to={ROUTES.HOME} className="pub-logo">
          <span>Encore</span>
          <span className="pub-logo-dot">.</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="pub-nav">
          <Link to="/#features" className="pub-nav-link">Features</Link>
          <Link to="/#billing-models" className="pub-nav-link">Billing Models</Link>
          <Link to={ROUTES.ABOUT} className="pub-nav-link">About Us</Link>
          <Link to={ROUTES.PRICING} className="pub-nav-link">Pricing</Link>
          <Link to={ROUTES.CONTACT} className="pub-nav-link">Contact</Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="pub-actions">
          {isAuthenticated ? (
            <button className="pub-btn-signup" onClick={() => navigate(ROUTES.DASHBOARD.OVERVIEW)}>
              Dashboard <span>»</span>
            </button>
          ) : (
            <>
              <button className="pub-btn-signin" onClick={() => navigate(ROUTES.LOGIN)}>Sign In</button>
              <button className="pub-btn-signup" onClick={() => navigate(ROUTES.REGISTER)}>
                Sign Up <span>»</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className="pub-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="pub-mobile-drawer">
          <Link to="/#features" className="pub-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link to="/#billing-models" className="pub-mobile-link" onClick={() => setMobileMenuOpen(false)}>Billing Models</Link>
          <Link to={ROUTES.ABOUT} className="pub-mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
          <Link to={ROUTES.PRICING} className="pub-mobile-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          <Link to={ROUTES.CONTACT} className="pub-mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' }}>
            {isAuthenticated ? (
              <button className="btn btn-primary btn-full btn-lg" onClick={() => { setMobileMenuOpen(false); navigate(ROUTES.DASHBOARD.OVERVIEW); }}>
                Dashboard »
              </button>
            ) : (
              <>
                <button className="btn btn-secondary btn-full btn-lg" onClick={() => { setMobileMenuOpen(false); navigate(ROUTES.LOGIN); }}>Sign In</button>
                <button className="btn btn-primary btn-full btn-lg" onClick={() => { setMobileMenuOpen(false); navigate(ROUTES.REGISTER); }}>Sign Up »</button>
              </>
            )}
          </div>
        </div>
      )}


      {/* Page Content */}
      <div style={{ flex: 1, paddingTop: isDesktop ? 72 : 64 }}>
        <Outlet />
      </div>

      {/* Global Footer */}
      <footer className="pub-footer">
        <div className="pub-footer-grid">
          {/* Col 1 */}
          <div className="pub-footer-col">
            <Link to={ROUTES.HOME} className="pub-logo" style={{ marginBottom: 8 }}>
              <span>Encore</span><span className="pub-logo-dot">.</span>
            </Link>
            <p className="pub-footer-logo-desc">
              Encore Technology Limited is registered and regulated to provide secure automated ledger reconciliations, billing routing, and collection services.
            </p>
            <p className="pub-footer-logo-desc" style={{ fontStyle: 'italic' }}>
              Settled securely through verified banking partners.
            </p>
          </div>

          {/* Col 2 */}
          <div className="pub-footer-col">
            <span className="pub-footer-title">Products</span>
            <Link to="/#features" className="pub-footer-link">Flat Rate Billing</Link>
            <Link to="/#features" className="pub-footer-link">Tiered Billing</Link>
            <Link to="/#features" className="pub-footer-link">Metered Billing</Link>
            <Link to="/#features" className="pub-footer-link">Dunning Cycles</Link>
            <Link to="/#features" className="pub-footer-link">Virtual Accounts</Link>
          </div>

          {/* Col 3 */}
          <div className="pub-footer-col">
            <span className="pub-footer-title">Company</span>
            <Link to={ROUTES.ABOUT} className="pub-footer-link">About Us</Link>
            <Link to="/#pricing" className="pub-footer-link">Pricing Plans</Link>
            <Link to="/#faq" className="pub-footer-link">Frequently Asked FAQ</Link>
            <Link to="/#dev" className="pub-footer-link">Developer Docs</Link>
          </div>

          {/* Col 4 */}
          <div className="pub-footer-col">
            <span className="pub-footer-title">Legal</span>
            <Link to={ROUTES.PRIVACY} className="pub-footer-link">Privacy Policy</Link>
            <Link to={ROUTES.TERMS} className="pub-footer-link">Terms of Service</Link>
            <Link to={ROUTES.SECURITY} className="pub-footer-link">Security Center</Link>
          </div>

          {/* Col 5 */}
          <div className="pub-footer-col" style={{ gridColumn: isDesktop ? 'span 1' : 'span 1' }}>
            <span className="pub-footer-title">Locations</span>
            <p className="pub-footer-address">
              <strong>Lagos</strong>: 17 M.I. Okoro Avenue, Lekki Phase 1, Lagos, Nigeria.
            </p>
            <p className="pub-footer-address" style={{ marginTop: 8 }}>
              <strong>Abuja</strong>: 11 Uyo Close, Off Emeka Anyaoku Street, Area 11, Garki, Abuja, Nigeria.
            </p>
            <p className="pub-footer-address" style={{ marginTop: 8 }}>
              <strong>SF</strong>: 490 Post Street, Ste. 526, San Francisco, CA 94102.
            </p>
          </div>

          {/* Col 6 */}
          <div className="pub-footer-col">
            <span className="pub-footer-title">Contact & Apps</span>
            <span className="pub-footer-link">support@encorepay.co</span>
            
            <div className="pub-footer-badges" style={{ flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="App Store Badge" 
                className="pub-footer-badge-btn" 
              />
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Google Play Badge" 
                className="pub-footer-badge-btn" 
              />
            </div>
          </div>
        </div>

        <div className="pub-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Encore Technology Limited. All rights reserved.</span>
          <span>Regulated by verified financial compliance standards.</span>
        </div>
      </footer>
    </div>
  );
}
