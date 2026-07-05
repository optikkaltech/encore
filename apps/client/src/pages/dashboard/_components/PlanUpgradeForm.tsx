import { useState } from 'react';
import { Award, CheckCircle } from 'lucide-react';
import type { MerchantProfile } from '../../../api/settings.api';

interface Props {
  profile: MerchantProfile | null;
  saving: boolean;
  onUpgrade: (tier: string) => Promise<boolean>;
}

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₦0',
    fee: '1.5%',
    desc: 'Perfect for small businesses starting out.',
    limit: 'Up to 50 subscribers',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₦5,000/mo',
    fee: '1.2%',
    desc: 'For growing businesses expanding their base.',
    limit: 'Up to 500 subscribers',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '₦15,000/mo',
    fee: '1.0%',
    desc: 'For larger enterprises with high transaction volumes.',
    limit: 'Unlimited subscribers',
  },
];

export default function PlanUpgradeForm({ profile, saving, onUpgrade }: Props) {
  const currentTier = profile?.pricingTier || 'starter';
  const [selected, setSelected] = useState(currentTier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === currentTier) return;
    onUpgrade(selected);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={16} color="var(--primary)" />
          Subscription Plan & Pricing Tier
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Upgrade or downgrade your pricing tier to unlock larger subscriber capacities and lower transaction fees.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TIERS.map(tier => {
          const isCurrent = tier.id === currentTier;
          const isSelected = tier.id === selected;

          return (
            <div
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderRadius: 10, cursor: 'pointer',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-primary)',
                background: isSelected ? 'rgba(99,102,241,0.03)' : 'var(--bg-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: isCurrent ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCurrent ? (
                    <CheckCircle size={18} color="var(--success)" />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {tier.name[0]}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tier.name}</h4>
                    {isCurrent && <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>Current</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{tier.desc} · <strong>{tier.limit}</strong></p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{tier.price}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{tier.fee} transaction fee</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || selected === currentTier}
        >
          {saving ? 'Processing...' : `Upgrade to ${selected.toUpperCase()}`}
        </button>
      </div>
    </form>
  );
}
