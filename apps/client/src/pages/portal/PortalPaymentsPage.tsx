import { usePortalPayments } from '../../hooks/usePortal';
import { CreditCardIcon } from '../../assets';
import toast from 'react-hot-toast';

function statusColor(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    success: { bg: '#dcfce7', text: '#16a34a' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
    pending: { bg: '#fef9c3', text: '#ca8a04' },
  };
  return map[status?.toLowerCase()] || { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
}

/**
 * Portal Payments Page — lists all payment transactions for the subscriber.
 * Uses standard system CSS variables for colors, ensuring consistency.
 */
export default function PortalPaymentsPage() {
  const { payments, loading, payingId, payPending } = usePortalPayments();

  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading payments...</div>;
  }

  return (
    <div>
      {/* Portal page-scoped CSS rules */}
      <style>{`
        .portal-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .portal-card-table {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          padding: 0;
        }
        .portal-th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .portal-td {
          padding: 14px 16px;
          color: var(--text-primary);
          font-size: 14px;
        }
        .portal-tr:hover {
          background: var(--bg-secondary);
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment History</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>All transactions made for your subscription</p>
      </div>

      {payments.length === 0 ? (
        <div className="portal-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CreditCardIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>No payments recorded yet</p>
        </div>
      ) : (
        <div className="portal-card-table">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                  {['Date', 'Type', 'Method', 'Invoice', 'Amount', 'Status'].map(h => (
                    <th key={h} className="portal-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const sc = statusColor(p.status);
                  return (
                    <tr key={p.id} className="portal-tr" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td className="portal-td" style={{ whiteSpace: 'nowrap' }}>{formatDate(p.processedAt || p.createdAt)}</td>
                      <td className="portal-td" style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{p.type?.replace('_', ' ')}</td>
                      <td className="portal-td" style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{p.paymentMethod?.replace('_', ' ')}</td>
                      <td className="portal-td" style={{ color: 'var(--text-secondary)' }}>{p.invoiceNumber || '—'}</td>
                      <td className="portal-td" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="portal-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                            fontSize: 12, fontWeight: 700,
                            background: sc.bg, color: sc.text,
                          }}>
                            {p.status.toUpperCase()}
                          </span>
                          {p.status?.toLowerCase() === 'pending' && (
                            <button
                              onClick={async () => {
                                try {
                                  await payPending(p.id);
                                  toast.success('Payment successfully processed');
                                } catch (err: any) {
                                  toast.error(err?.response?.data?.message || 'Payment attempt failed');
                                }
                              }}
                              disabled={payingId === p.id}
                              className="btn btn-primary btn-sm"
                            >
                              {payingId === p.id ? 'Paying...' : 'Pay Now'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
