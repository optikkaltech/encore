import { useState } from 'react';
import { Calendar, CreditCard, Banknote, ShieldCheck, Mail, Phone, MapPin, X, Info } from 'lucide-react';
import type { Subscriber } from '../../types/subscribers.types';

interface SubscriberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  onPause: (id: string) => void;
  onCancel: (id: string) => void;
  onGenerateVirtualAccount: (id: string) => Promise<boolean>;
  onDeleteVirtualAccount: (id: string) => Promise<boolean>;
}

export default function SubscriberDetailsModal({
  isOpen,
  onClose,
  subscriber,
  onPause,
  onCancel,
  onGenerateVirtualAccount,
  onDeleteVirtualAccount,
}: SubscriberDetailsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerateVirtualAccount(subscriber!.id);
    setIsGenerating(false);
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate and delete this virtual account on Nomba?')) {
      return;
    }
    setIsDeactivating(true);
    await onDeleteVirtualAccount(subscriber!.id);
    setIsDeactivating(false);
  };

  if (!isOpen || !subscriber) return null;

  const activeSubscription = subscriber.subscriptions?.find(s =>
    ['active', 'trial', 'past_due', 'paused'].includes(s.status.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
      case 'suspended':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-slide-up" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-xl)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 4 }}>Subscriber Details</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${getStatusBadgeClass(subscriber.status)}`}>
                {subscriber.status}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Registered on {new Date(subscriber.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Left Column: Personal info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer Info</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Mail size={14} className="text-secondary" />
              <span>{subscriber.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Phone size={14} className="text-secondary" />
              <span>{subscriber.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
              <MapPin size={14} className="text-secondary" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                {subscriber.address ? (
                  <>
                    {subscriber.address}, {subscriber.city}, {subscriber.state}
                  </>
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No address configured</span>
                )}
              </span>
            </div>
          </div>

          {/* Right Column: Active Plan Details */}
          <div style={{
            background: 'var(--bg-secondary)', 
            borderRadius: 8, 
            padding: 16, 
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <h4 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              Active Subscription
            </h4>
            {activeSubscription?.plan ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeSubscription.plan.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  ₦{Number(activeSubscription.finalAmount).toLocaleString()} / {activeSubscription.plan.frequency}
                </div>
                {subscriber.nextBillingDate && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    Next billing: {new Date(subscriber.nextBillingDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active plan subscription
              </span>
            )}
          </div>
        </div>

        {/* Smart Reconciliation (Dedicated Virtual Account) */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Banknote size={16} style={{ color: 'var(--info)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Dedicated Virtual Account</h3>
            <span className="badge badge-info" style={{ fontSize: 9 }}>Smart Reconciliation</span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '15px', marginBottom: 12 }}>
            <Info size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            <strong>What this is:</strong> This is a unique bank account number assigned exclusively to this subscriber. Any transfer they make to this account automatically reconciles, posts to their record, and renews their subscription.
          </p>

          {subscriber.virtualAccountNumber ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>BANK NAME</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{subscriber.virtualAccountBank || 'Nomba Bank'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ACCOUNT NUMBER</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{subscriber.virtualAccountNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ACCOUNT NAME</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {subscriber.firstName} {subscriber.lastName} - Encore
                  </div>
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                style={{ padding: '4px 10px', fontSize: 11, height: 'auto', minHeight: 'unset' }}
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
              <div style={{ fontStyle: 'italic', color: 'var(--error)', fontSize: 12 }}>
                Virtual account not generated. Please try again.
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                {isGenerating ? 'Generating...' : 'Generate VA'}
              </button>
            </div>
          )}
        </div>

        {/* Payment Instrument (Card or Mandate) */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.05)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <CreditCard size={16} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Automatic Charge Mandate</h3>
            <span className="badge badge-success" style={{ fontSize: 9 }}>Auto-Pull</span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '15px', marginBottom: 12 }}>
            <Info size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            <strong>What this is:</strong> A tokenized card authorization or Direct Debit bank mandate from Nomba. This authorizes Encore to automatically pull the renewal charge from the client on their billing date.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            <div style={{ fontSize: 13 }}>
              {subscriber.paymentMethod === 'card' ? (
                subscriber.cardLastFour ? (
                  <span>Card Tokenized: Visa ending in <strong>{subscriber.cardLastFour}</strong> (Exp: {subscriber.cardExpiry})</span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Card authorization pending tokenization</span>
                )
              ) : (
                subscriber.mandateId ? (
                  <span>Direct Debit Mandate Active (Ref: <strong>{subscriber.mandateId}</strong>)</span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Bank Direct Debit mandate authorization pending</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Subscription History Ledger */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Subscription Ledger
          </h3>
          {(!subscriber.subscriptions || subscriber.subscriptions.length === 0) ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 12 }}>No subscription history found.</p>
          ) : (
            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriber.subscriptions.map(sub => (
                    <tr key={sub.id}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{sub.plan?.name || 'Deleted Plan'}</td>
                      <td style={{ fontSize: 13 }}>₦{Number(sub.finalAmount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(sub.status)}`} style={{ fontSize: 10 }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions Section */}
        {activeSubscription && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => onPause(subscriber.id)}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              Pause Subscription
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => onCancel(subscriber.id)}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
