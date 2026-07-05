import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/app.constants';

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Up to 20 active subscribers',
    desc: 'Ideal for early-stage subscription validation and SaaS side projects.',
    features: [
      'Flat-rate recurring billing',
      'Basic dashboard analytics',
      'Unified collections (Card, Bank Transfer)',
      'Secure standard customer portal',
      'Full API sandbox access',
      'Webhook endpoints (basic)'
    ],
    cta: 'Start Free',
    lime: false,
    route: ROUTES.REGISTER
  },
  {
    name: 'Growth',
    price: '₦15,000',
    sub: 'Up to 500 active subscribers',
    desc: 'For growing teams automating renewals, usage models, and dunning.',
    features: [
      'Everything in Starter',
      'Metered (usage-based) billing models',
      'Tiered feature subscription rules',
      'Automated email/SMS dunning cycles',
      'Advanced customizable branding',
      'Priority customer support desk'
    ],
    cta: 'Upgrade Now',
    lime: true,
    route: ROUTES.REGISTER
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: 'Unlimited subscription tiers',
    desc: 'For scaling platforms requiring dedicated infrastructure, custom SLAs, and custom limits.',
    features: [
      'Everything in Growth',
      'Dedicated integration engineer support',
      'Custom API rate limitations',
      'Multi-merchant console integrations',
      'SLA-backed payment settlements',
      'Direct compliance name verification checks'
    ],
    cta: 'Contact Sales',
    lime: false,
    route: ROUTES.REGISTER
  }
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#FFFFFF', padding: '80px 20px', minHeight: 'calc(100vh - 72px)' }}>
      {/* Page styling scope */}
      <style>{`
        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 40px;
            max-width: 400px;
          }
        }
        .pricing-card {
          border: 1px solid var(--border-light);
          background: #FFFFFF;
          border-radius: 16px;
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }
        .pricing-card.recommended {
          border: 2px solid var(--nomba-teal);
          box-shadow: var(--shadow-md);
        }
        .pricing-recommended-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--nomba-teal);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 4px 16px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .pricing-price {
          font-size: 44px;
          font-weight: 800;
          color: var(--nomba-teal);
          margin: 16px 0 4px;
        }
        .pricing-price-sub {
          font-size: 13.5px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .pricing-feature-list {
          list-style: none;
          padding: 0;
          margin: 28px 0 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 14px;
          color: var(--text-primary);
        }
        .pricing-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .pricing-check {
          color: var(--nomba-teal);
          font-weight: 700;
        }
      `}</style>

      <div className="pricing-header">
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          PLANS & SUBSCRIPTIONS
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--nomba-teal)', marginTop: 8 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: 8 }}>
          Whether you are launching your first SaaS or managing enterprise renewals, choose the right fit.
        </p>
      </div>

      <div className="pricing-grid">
        {PRICING_PLANS.map(plan => (
          <div key={plan.name} className={`pricing-card ${plan.lime ? 'recommended' : ''}`}>
            {plan.lime && <div className="pricing-recommended-badge">Recommended</div>}
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 6, minHeight: '36px' }}>{plan.desc}</p>
            
            <div className="pricing-price">
              {plan.price}
              {plan.price !== 'Free' && plan.price !== 'Custom' && <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>/ month</span>}
            </div>
            <div className="pricing-price-sub">{plan.sub}</div>

            <button 
              className={plan.lime ? 'btn btn-primary btn-full btn-lg' : 'btn btn-secondary btn-full btn-lg'}
              onClick={() => navigate(plan.route)}
            >
              {plan.cta}
            </button>

            <ul className="pricing-feature-list">
              {plan.features.map(feat => (
                <li key={feat} className="pricing-feature-item">
                  <span className="pricing-check">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
