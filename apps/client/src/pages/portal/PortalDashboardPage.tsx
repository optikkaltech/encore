import { usePortalStore } from '../../store/portal.store';
import { usePortalProfile } from '../../hooks/usePortal';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: '#22c55e', paused: '#f59e0b', cancelled: '#ef4444',
    suspended: '#ef4444', trial: '#8b5cf6',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${colors[status] || '#6b7280'}22`,
      color: colors[status] || '#6b7280',
      borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * Portal Dashboard — subscriber's home screen.
 * Shows subscription status, plan info, next billing date, payment method.
 */
export default function PortalDashboardPage() {
  const { subscriber } = usePortalStore();
  const { profile, loading } = usePortalProfile();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading your subscription...</div>;
  }

  const plan = profile?.activePlan;
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Welcome back, {subscriber?.firstName}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Here's a summary of your subscription
        </p>
      </div>

      {/* Status Banner */}
      {profile && (
        <div style={{ marginBottom: 24 }}>
          <StatusBadge status={profile.status} />
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Current Plan" value={plan?.planName || '—'} sub={plan?.frequency} />
        <StatCard label="Billing Amount" value={plan ? formatCurrency(plan.amount, plan.currency) : '—'} sub="per billing cycle" />
        <StatCard label="Next Billing Date" value={formatDate(profile?.nextBillingDate)} />
        <StatCard label="Last Charged" value={formatDate(profile?.lastBillingDate)} />
      </div>

      {/* Payment Method */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Payment Method</h3>
        {profile?.cardLastFour ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>CARD</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                •••• •••• •••• {profile.cardLastFour}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Expires {profile.cardExpiry}</p>
            </div>
          </div>
        ) : profile?.bankName ? (
          <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>Direct Debit — {profile.bankName}</p>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No payment method on file</p>
        )}
      </div>
    </div>
  );
}
