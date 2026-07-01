import { usePortalPayments } from '../../hooks/usePortal';

function statusColor(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    success: { bg: '#dcfce7', text: '#16a34a' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
    pending: { bg: '#fef9c3', text: '#ca8a04' },
  };
  return map[status?.toLowerCase()] || { bg: '#f3f4f6', text: '#6b7280' };
}

/**
 * Portal Payments Page — lists all payment transactions for the subscriber.
 */
export default function PortalPaymentsPage() {
  const { payments, loading } = usePortalPayments();

  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading payments...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment History</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>All transactions made for your subscription</p>
      </div>

      {payments.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No payments recorded yet</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Date', 'Type', 'Method', 'Invoice', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontWeight: 600,
                    fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const sc = statusColor(p.status);
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border-primary)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{formatDate(p.processedAt || p.createdAt)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.type?.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.paymentMethod?.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.invoiceNumber || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                        background: sc.bg, color: sc.text,
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
