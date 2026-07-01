import type { Transaction } from '../../types/billing.types';
import { Calendar, CreditCard, Shield, User, Tag } from 'lucide-react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <span className="badge badge-success">Success</span>;
      case 'pending':
      case 'processing':
      case 'retrying':
        return <span className="badge badge-warning">{status}</span>;
      case 'failed':
        return <span className="badge badge-error">Failed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Transaction Details</h2>
          {getStatusBadge(transaction.status)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Amount Info */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Amount
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
              {transaction.currency} {Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize' }}>
              Type: {transaction.type.replace('_', ' ')}
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Subscriber */}
            {transaction.subscriber && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <User size={18} className="text-secondary" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {transaction.subscriber.firstName} {transaction.subscriber.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{transaction.subscriber.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{transaction.subscriber.phone}</div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <CreditCard size={18} className="text-secondary" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {transaction.paymentMethod.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Reference */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Shield size={18} className="text-secondary" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nomba Reference</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {transaction.nombaReference || 'N/A'}
                </div>
              </div>
            </div>

            {/* Invoice Reference */}
            {transaction.invoiceNumber && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Tag size={18} className="text-secondary" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Linked Invoice</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {transaction.invoiceNumber}
                  </div>
                </div>
              </div>
            )}

            {/* Processed At / Created At */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Calendar size={18} className="text-secondary" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Initiated: {new Date(transaction.createdAt).toLocaleString()}
                </div>
                {transaction.processedAt && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Processed: {new Date(transaction.processedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
