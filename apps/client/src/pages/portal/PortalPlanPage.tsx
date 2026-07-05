import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePortalProfile } from '../../hooks/usePortal';
import { usePortalSubscription } from '../../hooks/usePortal';
import { usePortalStore } from '../../store/portal.store';
import { ROUTES } from '../../constants/app.constants';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

/**
 * Portal Plan Page — view plan details and manage subscription lifecycle.
 * Subscribers can pause or cancel from here.
 * Uses standard system CSS variables for colors.
 */
export default function PortalPlanPage() {
  const { profile, loading, refetch } = usePortalProfile();
  const { pause, cancel, loading: actLoading } = usePortalSubscription();
  const { logout } = usePortalStore();
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const plan = profile?.activePlan;
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

  const handlePause = async () => {
    try {
      const res = await pause();
      toast.success(res?.message || 'Subscription paused');
      refetch();
    } catch { toast.error('Failed to pause subscription'); }
  };

  const handleCancel = async () => {
    try {
      const res = await cancel();
      toast.success(res?.message || 'Subscription cancelled');
      setTimeout(() => { logout(); navigate(ROUTES.PORTAL.LOGIN); }, 2000);
    } catch { toast.error('Failed to cancel subscription'); }
    setConfirmCancel(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading plan details...</div>;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Scope styles for standard cards inside portal pages */}
      <style>{`
        .portal-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Plan</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Details about your current subscription plan</p>
      </div>

      {plan ? (
        <div className="portal-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.planName}</h2>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: 'var(--accent-light)', color: 'var(--accent-primary)',
            }}>{plan.status.toUpperCase()}</span>
          </div>
          <InfoRow label="Billing Amount" value={formatCurrency(plan.amount, plan.currency)} />
          <InfoRow label="Frequency" value={plan.frequency?.charAt(0).toUpperCase() + plan.frequency?.slice(1)} />
          <InfoRow label="Current Period Ends" value={formatDate(plan.currentPeriodEnd)} />
          <InfoRow label="Next Billing Date" value={formatDate(profile?.nextBillingDate)} />
        </div>
      ) : (
        <div className="portal-card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No active subscription found</p>
        </div>
      )}

      {/* Actions */}
      {plan && ['active', 'trial', 'past_due'].includes(plan.status) && (
        <div className="portal-card">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Manage Subscription</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={handlePause} disabled={actLoading} style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14,
              fontWeight: 600, cursor: actLoading ? 'not-allowed' : 'pointer', textAlign: 'left',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              ⏸ Pause Subscription
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, marginTop: 2 }}>
                Temporarily pause billing. You can resume anytime.
              </span>
            </button>

            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} style={{
                padding: '12px 16px', borderRadius: 8, border: '1px solid #ef4444',
                background: 'transparent', color: '#ef4444', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}>
                ✕ Cancel Subscription
                <span style={{ display: 'block', fontSize: 12, color: '#ef4444', fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                  Access continues until the end of your current period.
                </span>
              </button>
            ) : (
              <div style={{ padding: 16, borderRadius: 8, border: '1px solid #ef4444', background: '#fee2e220' }}>
                <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 12, fontWeight: 600 }}>
                  Are you sure you want to cancel?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCancel} disabled={actLoading} style={{
                    padding: '8px 16px', borderRadius: 6, background: '#ef4444', color: '#fff',
                    border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>{actLoading ? 'Cancelling...' : 'Yes, cancel'}</button>
                  <button onClick={() => setConfirmCancel(false)} style={{
                    padding: '8px 16px', borderRadius: 6, background: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)',
                  }}>Go back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
