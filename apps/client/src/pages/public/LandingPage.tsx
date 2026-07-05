import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/app.constants';

import hero3dBilling from '../../assets/hero_3d_billing.png';
import heroMerchantFocus from '../../assets/hero_merchant_focus.png';
import heroBambooPillars from '../../assets/hero_bamboo_pillars.png';
import securityPadlockMockup from '../../assets/security_padlock_mockup.png';


const HERO_SLIDES = [
  {
    title: 'Dream. Build. Recur.',
    desc: "At Encore, we believe recurring billing is more than a transaction; it's a dream in the making, a legacy in motion. Collect cards, bank transfers, and mobile money automatically.",
    image: hero3dBilling,
    badge: 'AUTOMATED BILLING MIDDLEWARE',
  },
  {
    title: 'Engineered for Growth.',
    desc: 'Empowering software teams and service providers to build stable, predictable recurring income streams. Create and iterate plans in seconds with full API automation.',
    image: heroMerchantFocus,
    badge: 'DEVELOPER-FIRST API INFRASTRUCTURE',
  },
  {
    title: 'Stop Revenue Leakage.',
    desc: 'Mitigate involuntary churn automatically. Our smart retry rules and customized email/SMS reminders recover up to 25% of failed subscriptions in real time.',
    image: heroBambooPillars,
    badge: 'REVENUE RECOVERY & DUNNING CONTROL',
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Stats SVGs drawing trigger states
  const [inView, setInView] = useState(false);

  // Calculator states
  const [billingPlan, setBillingPlan] = useState<'flat' | 'metered'>('flat');
  const [subscribers, setSubscribers] = useState(1500);
  const [averagePrice, setAveragePrice] = useState(15000);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Basic simulate intersection observer for animation
    const timer = setTimeout(() => setInView(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const calculateARR = () => {
    const multi = billingPlan === 'flat' ? 1.0 : 1.35; // usage based usually expands conversion
    return Math.round(subscribers * averagePrice * 12 * multi);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ background: '#FFFFFF', color: '#0D1F1C', overflowX: 'hidden' }}>
      {/* Styles for Landing Page interactions */}
      <style>{`
        .hero-section {
          position: relative;
          height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #FFFFFF;
          padding: 0 20px;
          overflow: hidden;
          transition: background-image 1.2s ease-in-out;
        }
        @media (max-width: 768px) {
          .hero-section {
            padding: 40px 20px;
            height: auto;
            min-height: 540px;
          }
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 33, 29, 0.76);
          z-index: 1;
        }
        .hero-container {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        .hero-content {
          animation: slideFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideFade {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-badge {
          background: rgba(200, 255, 0, 0.12);
          border: 1px solid rgba(200, 255, 0, 0.25);
          color: var(--nomba-lime);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 6px 14px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        .pub-banner {
          background: #08211D;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 30px 20px;
          text-align: center;
        }
        .pub-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 60px;
          flex-wrap: wrap;
          margin-top: 16px;
          opacity: 0.6;
        }
        .pub-logo {
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .stat-section {
          padding: 100px 40px;
          background: #0B2E28;
          color: #FFFFFF;
          text-align: center;
        }
        .stat-circle-box {
          position: relative;
          display: inline-block;
          margin-bottom: 30px;
        }
        .stat-value {
          font-size: 72px;
          font-weight: 800;
          color: #FFFFFF;
          position: relative;
          z-index: 2;
        }
        .stat-circle-svg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 320px;
          height: 180px;
          pointer-events: none;
          z-index: 1;
        }
        .stat-circle-path {
          fill: none;
          stroke: var(--nomba-lime);
          stroke-width: 3;
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          transition: stroke-dashoffset 2s ease-in-out;
        }
        .stat-circle-path.active {
          stroke-dashoffset: 0;
        }
        .models-section {
          padding: 100px 40px;
          background: #F4F8F6;
        }
        .models-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1100px;
          margin: 40px auto 0;
        }
        @media (max-width: 768px) {
          .models-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .model-card {
          background: #0F3D35;
          border: 1px solid #164D42;
          color: #FFFFFF;
          border-radius: 16px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .model-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: var(--nomba-lime);
          box-shadow: 0 12px 30px rgba(200, 255, 0, 0.12);
        }
        .security-section {
          padding: 100px 40px;
          background: #0B2E28;
          color: #FFFFFF;
        }
        .security-container {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 60px;
          align-items: center;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .security-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
        .security-badge {
          background: rgba(200, 255, 0, 0.12);
          border: 1px solid rgba(200, 255, 0, 0.25);
          color: var(--nomba-lime);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 6px 14px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 16px;
        }

        .calc-section {
          padding: 100px 40px;
          background: #F4F8F6;
        }
        .calc-container {
          background: #FFFFFF;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
          border-radius: 20px;
          max-width: 1000px;
          margin: 40px auto 0;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .calc-container {
            grid-template-columns: 1fr;
          }
        }
        .calc-inputs {
          padding: 40px;
        }
        .calc-outputs {
          background: #0F3D35;
          color: #FFFFFF;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .calc-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: #E5E7EB;
          border-radius: 3px;
          outline: none;
          margin: 16px 0 24px;
        }
        .calc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--nomba-teal);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .calc-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .calc-toggle {
          display: inline-flex;
          border: 1px solid var(--border-light);
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 24px;
          background: #F9FAFB;
        }
        .calc-toggle-btn {
          border: none;
          background: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .calc-toggle-btn.active {
          background: var(--nomba-teal);
          color: #FFFFFF;
        }
        .cta-section {
          padding: 100px 40px 0;
          background: #0B2E28;
          color: #FFFFFF;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
      `}</style>

      {/* Hero Section with background carousel images */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${HERO_SLIDES[currentSlide].image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-overlay" />
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">{HERO_SLIDES[currentSlide].badge}</span>
            <h1 style={{ fontSize: '56px', fontWeight: 800, marginBottom: 20, lineHeight: 1.15, letterSpacing: '-1.5px' }}>
              {HERO_SLIDES[currentSlide].title}
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.85)', marginBottom: 36, lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 36px' }}>
              {HERO_SLIDES[currentSlide].desc}
            </p>
            <button
              className="pub-btn-signup"
              style={{ fontSize: '15px', padding: '14px 32px', borderRadius: '30px', margin: '0 auto' }}
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Create a free account <span>»</span>
            </button>
          </div>
        </div>
      </section>

      {/* Publications/Trust Banner */}
      <section className="pub-banner">
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Featured in Top Publications
        </span>
        <div className="pub-grid">
          <span className="pub-logo">QUARTZ</span>
          <span className="pub-logo">BENZINGA</span>
          <span className="pub-logo">BUSINESS INSIDER</span>
          <span className="pub-logo">TECHCRUNCH</span>
          <span className="pub-logo">FUTURE AFRICA</span>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stat-section">
        <div className="stat-circle-box">
          <span className="stat-value">₦10B+</span>
          <svg className="stat-circle-svg" viewBox="0 0 320 180">
            <path
              className={`stat-circle-path ${inView ? 'active' : ''}`}
              d="M 160 90 C 80 90, 40 140, 160 140 C 280 140, 290 40, 160 40 C 30 40, 20 120, 160 120"
            />
          </svg>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: 12, maxWidth: 600, margin: '0 auto 12px' }}>
          Africans trust us to make their dreams come alive.
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.65)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          We have processed over ₦10 Billion in subscription revenue across various billing plans. Start with as little as ₦10,000 and setup configurations to scale your business.
        </p>
      </section>

      {/* Pricing Models Section */}
      <section id="billing-models" className="models-section">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Flexible Subscription Schemes
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--nomba-teal)', marginTop: 8 }}>
            Diversify your pricing models
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: 8 }}>
            Configure multiple billing models all from one unified subscription engine.
          </p>
        </div>

        <div className="models-grid">
          {/* Card 1 */}
          <div className="model-card" onClick={() => navigate(ROUTES.REGISTER)}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--nomba-lime)' }}>Flat-Rate Subscriptions</h3>
            <p style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6 }}>
              Collect fixed payments at scheduled cycles (weekly, monthly, custom). The ideal choice for SaaS memberships, media subscriptions, and box clubs.
            </p>
            <button className="pub-btn-signin" style={{ width: 'fit-content', marginTop: 'auto', alignSelf: 'flex-start' }}>
              Start Billing »
            </button>
          </div>

          {/* Card 2 */}
          <div className="model-card" onClick={() => navigate(ROUTES.REGISTER)}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--nomba-lime)' }}>Metered Usage Billing</h3>
            <p style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6 }}>
              Calculate renewals dynamically based on actual consumption (e.g. storage used, API calls, minutes spent). Ideal for cloud compute and utility APIs.
            </p>
            <button className="pub-btn-signin" style={{ width: 'fit-content', marginTop: 'auto', alignSelf: 'flex-start' }}>
              Start Billing »
            </button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="security-container">
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <img
              src={securityPadlockMockup}
              alt="Secure Padlock Mockup"
              style={{
                width: '100%',
                maxWidth: '380px',
                height: 'auto',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          </div>

          <div>
            <span className="security-badge">Safe-guard your billing</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--nomba-teal)', lineHeight: 1.15, marginBottom: 16 }}>
              Your trust matters most to us
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              Protected by ledger accountability, tokenized card vaults, and name matching constraints. That's why we maintain absolute transparency in payout reconciliations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--nomba-lime-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nomba-teal)', fontWeight: 700, fontSize: 12 }}>✓</div>
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700 }}>Double-entry Reconciliations</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>Immutable accounting logs for every payout and collection event.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--nomba-lime-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nomba-teal)', fontWeight: 700, fontSize: 12 }}>✓</div>
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700 }}>PCI-DSS Vaults Integration</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>Sensitive payment credentials are tokenized directly at processor level.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding step workflow */}
      <section className="stat-section" style={{ background: '#08211D' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-lime)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            How to Get Started
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: 8 }}>
            How to achieve billing with Encore?
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '15px', marginTop: 8 }}>
            It's easy. Setup and test subscription streams in minutes. No paperwork, no hassle.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40, maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 28, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🔌</div>
            <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Create an account</h4>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Sign up in 60 seconds. Access test Sandbox keys instantly to run dunning simulations, webhook events, and test billing setups.
            </p>
          </div>
          <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 28, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🌐</div>
            <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Connect & collect</h4>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Map your checkout pages, structure billing models, and collect payments automatically via Cards, Mobile Money, and Virtual Bank Accounts.
            </p>
          </div>
        </div>

        <button
          className="pub-btn-signup"
          style={{ margin: '48px auto 0', padding: '12px 28px' }}
          onClick={() => navigate(ROUTES.REGISTER)}
        >
          Get Started »
        </button>
      </section>

      {/* Potential revenue calculator slider */}
      <section className="calc-section">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Track How You Recur
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--nomba-teal)', marginTop: 8 }}>
            Calculate the potential of your subscriptions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: 8 }}>
            Plug in your numbers and see how consistent subscription revenue compounds over time.
          </p>
        </div>

        <div className="calc-container">
          <div className="calc-inputs">
            {/* Toggle */}
            <div className="calc-toggle">
              <button
                className={`calc-toggle-btn ${billingPlan === 'flat' ? 'active' : ''}`}
                onClick={() => setBillingPlan('flat')}
              >
                Flat-Rate Plan
              </button>
              <button
                className={`calc-toggle-btn ${billingPlan === 'metered' ? 'active' : ''}`}
                onClick={() => setBillingPlan('metered')}
              >
                Metered Usage Plan (+35% conversion)
              </button>
            </div>

            {/* Slider 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>Initial Subscribers</span>
                <span style={{ color: 'var(--nomba-teal)' }}>{subscribers.toLocaleString()} subscribers</span>
              </div>
              <input
                type="range"
                min={100}
                max={25000}
                step={100}
                className="calc-slider"
                value={subscribers}
                onChange={e => setSubscribers(Number(e.target.value))}
              />
            </div>

            {/* Slider 2 */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>Average Plan Price</span>
                <span style={{ color: 'var(--nomba-teal)' }}>{formatCurrency(averagePrice)} / subscriber</span>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                className="calc-slider"
                value={averagePrice}
                onChange={e => setAveragePrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="calc-outputs">
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
              Future value in 1 year
            </span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: 'var(--nomba-lime)', margin: '8px 0 16px' }}>
              {formatCurrency(calculateARR())}
            </h2>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, opacity: 0.9 }}>
              <span>Average monthly MRR: <strong>{formatCurrency(calculateARR() / 12)}</strong></span>
              <span>Projected annual ARR: <strong>{formatCurrency(calculateARR())}</strong></span>
            </div>
            <button
              className="pub-btn-signup"
              style={{ width: '100%', marginTop: 32, justifyContent: 'center' }}
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Start collecting today »
            </button>
          </div>
        </div>
      </section>

      {/* CTA Footer Wrapper */}
      <section className="cta-section">
        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: 12 }}>
          Ready to start automating?
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.75)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Build recurring plans, configure billing, and monitor transactions on a unified dashboard. Let's make recurring income happen, together.
        </p>
        <button
          className="pub-btn-signup"
          style={{ margin: '0 auto 48px', padding: '14px 32px' }}
          onClick={() => navigate(ROUTES.REGISTER)}
        >
          Start Billing »
        </button>

      </section>
    </div>
  );
}
