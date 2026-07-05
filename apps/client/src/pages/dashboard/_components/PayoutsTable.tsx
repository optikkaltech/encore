import { XCircle } from 'lucide-react';
import type { Payout } from '../../../api/payouts.api';

interface Props {
  payouts: Payout[];
  loading: boolean;
  cancelling: string | null;
  onCancel: (id: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

const statusBadge = (status: Payout['status']) => {
  const map: Record<Payout['status'], string> = {
    completed: 'badge-success',
    pending: 'badge-warning',
    processing: 'badge-warning',
    failed: 'badge-error',
    cancelled: 'badge-neutral',
  };
  return map[status] || 'badge-neutral';
};

export default function PayoutsTable({ payouts, loading, cancelling, onCancel }: Props) {
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading payouts…
      </div>
    );
  }

  if (!payouts.length) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 16, marginBottom: 6 }}>No payouts yet</p>
        <p style={{ fontSize: 14 }}>Request your first withdrawal above.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Bank / Account</th>
            <th>Requested</th>
            <th>Fee</th>
            <th>Net Paid</th>
            <th>Status</th>
            <th>Reference</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                {new Date(p.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.bankAccountName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.bankName} · {p.bankAccountNumber}</div>
              </td>
              <td style={{ fontWeight: 600 }}>{fmt(p.requestedAmount)}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmt(p.platformFee)}</td>
              <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(p.netAmount)}</td>
              <td>
                <span className={`badge ${statusBadge(p.status)}`} style={{ textTransform: 'capitalize' }}>
                  {p.status}
                </span>
              </td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {p.nombaReference ? p.nombaReference.slice(0, 20) + '…' : '—'}
              </td>
              <td>
                {p.status === 'pending' && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 12, color: 'var(--destructive)' }}
                    disabled={cancelling === p.id}
                    onClick={() => onCancel(p.id)}
                  >
                    <XCircle size={14} style={{ marginRight: 4 }} />
                    {cancelling === p.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
