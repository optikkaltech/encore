import { useState } from 'react';
import toast from 'react-hot-toast';
import { usePortalPaymentMethod, usePortalProfile } from '../../hooks/usePortal';
import { CreditCardIcon, LandmarkIcon } from '../../assets';

/**
 * Portal Payment Method Page — subscribers can update their card or bank mandate.
 * Uses standard system CSS variables for colors, ensuring consistency.
 */
export default function PortalPaymentMethodPage() {
  const { profile } = usePortalProfile();
  const { update, saving } = usePortalPaymentMethod();

  const [tab, setTab] = useState<'card' | 'bank'>('card');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardToken, setCardToken] = useState('');
  const [mandateId, setMandateId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'card') {
        await update({ paymentMethod: 'card', cardToken, cardLastFour, cardExpiry });
      } else {
        await update({ paymentMethod: 'direct_debit', mandateId });
      }
      toast.success('Payment method updated successfully');
    } catch {
      toast.error('Failed to update payment method');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-light)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 0',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2.5px solid var(--accent-primary)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Portal page-scoped layout css rules */}
      <style>{`
        .portal-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
        .portal-card-mini {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
        .portal-input:focus {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 3px var(--accent-light);
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Update Payment Method</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Change how you pay for your subscription</p>
      </div>

      {/* Current Method */}
      {(profile?.cardLastFour || profile?.bankName) && (
        <div className="portal-card-mini">
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Method</p>
          {profile.cardLastFour ? (
            <p style={{ fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <CreditCardIcon size={16} />
              <span>Card ending in <strong>{profile.cardLastFour}</strong> (expires {profile.cardExpiry})</span>
            </p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <LandmarkIcon size={16} />
              <span>Direct Debit — {profile.bankName}</span>
            </p>
          )}
        </div>
      )}

      <div className="portal-card">
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: 24 }}>
          <button style={tabStyle(tab === 'card')} onClick={() => setTab('card')}>
            <CreditCardIcon size={16} />
            <span>Card Payment</span>
          </button>
          <button style={tabStyle(tab === 'bank')} onClick={() => setTab('bank')}>
            <LandmarkIcon size={16} />
            <span>Direct Debit</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'card' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Card Token (from payment processor)
                </label>
                <input
                  className="portal-input"
                  style={inputStyle}
                  value={cardToken}
                  onChange={e => setCardToken(e.target.value)}
                  placeholder="tok_xxxxxxxx"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Last 4 digits</label>
                  <input
                    className="portal-input"
                    style={inputStyle}
                    value={cardLastFour}
                    onChange={e => setCardLastFour(e.target.value)}
                    placeholder="4242"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Expiry (MM/YY)</label>
                  <input
                    className="portal-input"
                    style={inputStyle}
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    placeholder="12/26"
                    maxLength={5}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Mandate Reference ID
              </label>
              <input
                className="portal-input"
                style={inputStyle}
                value={mandateId}
                onChange={e => setMandateId(e.target.value)}
                placeholder="NOMBA-MANDATE-XXXX"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-full"
            style={{ marginTop: 8 }}
          >
            {saving ? 'Saving...' : 'Update Payment Method'}
          </button>
        </form>
      </div>
    </div>
  );
}
