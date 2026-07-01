import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { ONBOARDING, ROUTES, PRICING_TIERS } from '../../constants/app.constants';
import { Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TierSelectionPage() {
  const navigate = useNavigate();
  const { merchant, selectTier } = useAuthStore();
  const [selectedTier, setSelectedTier] = useState<string>(merchant?.pricingTier || 'starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTier = async () => {
    setIsSubmitting(true);
    try {
      await selectTier({
        tier: selectedTier,
      });

      toast.success(ONBOARDING.TIER.SUCCESS);
      navigate(ROUTES.ONBOARDING.PROGRESS);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl) var(--space-md)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 900,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {ONBOARDING.TIER.TITLE}
          </h1>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>
            {ONBOARDING.TIER.SUBTITLE}
          </p>
        </div>

        {/* Pricing Tiers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-2xl)',
        }}>
          {Object.entries(PRICING_TIERS).map(([key, config]) => {
            const isCurrentSelected = selectedTier === key;
            const isGrowth = key === 'growth';
            
            return (
              <div
                key={key}
                onClick={() => setSelectedTier(key)}
                className={`card ${isCurrentSelected ? 'active-tier' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isCurrentSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  transform: isCurrentSelected ? 'scale(1.02)' : 'none',
                  transition: 'all 200ms ease',
                  background: 'var(--bg-primary)',
                  position: 'relative',
                }}
              >
                {isGrowth && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Sparkles size={10} /> Popular Plan
                  </div>
                )}
                
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {config.name}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Max {config.maxSubscribers} {ONBOARDING.TIER.SUBSCRIBERS}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 'var(--space-lg)' }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {config.monthlyFee === 0 ? 'Free' : `₦${config.monthlyFee.toLocaleString()}`}
                    </span>
                    {config.monthlyFee > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ONBOARDING.TIER.MONTHLY}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Transaction fee: <strong>{config.transactionFee}</strong>
                  </p>

                  <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 'var(--space-md)' }} />

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {config.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <Check size={14} className="text-success" style={{ marginTop: 2, flexShrink: 0 }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 'var(--space-xl)' }}>
                  <div style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    border: isCurrentSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    background: isCurrentSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isCurrentSelected ? 'white' : 'var(--text-primary)',
                    transition: 'all 150ms ease',
                  }}>
                    {isCurrentSelected ? 'Selected' : 'Choose Plan'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSelectTier}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 200 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><span className="spinner spinner-sm" /> Loading...</>
            ) : (
              ONBOARDING.TIER.CONFIRM
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
