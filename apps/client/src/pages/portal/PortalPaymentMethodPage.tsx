import { useState } from 'react';
import toast from 'react-hot-toast';
import { usePortalPaymentMethod, usePortalProfile } from '../../hooks/usePortal';
import { usePortalStore } from '../../store/portal.store';
import { CreditCardIcon, LandmarkIcon } from '../../assets';

/**
 * Portal Payment Method Page — subscribers can update their card or bank mandate.
 */
export default function PortalPaymentMethodPage() {
  const { profile } = usePortalProfile();
  const { update, saving } = usePortalPaymentMethod();
  const { config } = usePortalStore();
  const brandColor = config?.brandColor || '#7c3aed';

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
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? brandColor : 'var(--text-secondary)',
    background: 'none', border: 'none',
    borderBottom: active ? `2px solid ${brandColor}` : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  });

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Update Payment Method</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Change how you pay for your subscription</p>
      </div>

      {/* Current Method */}
      {(profile?.cardLastFour || profile?.bankName) && (
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase' }}>Current Method</p>
          {profile.cardLastFour ? (
            <p style={{ fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCardIcon size={16} />
              <span>Card ending in <strong>{profile.cardLastFour}</strong> (expires {profile.cardExpiry})</span>
            </p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LandmarkIcon size={16} />
              <span>Direct Debit — {profile.bankName}</span>
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: 24 }}>
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
                <input style={inputStyle} value={cardToken} onChange={e => setCardToken(e.target.value)}
                  placeholder="tok_xxxxxxxx" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Last 4 digits</label>
                  <input style={inputStyle} value={cardLastFour} onChange={e => setCardLastFour(e.target.value)}
                    placeholder="4242" maxLength={4} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Expiry (MM/YY)</label>
                  <input style={inputStyle} value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                    placeholder="12/26" maxLength={5} required />
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Mandate Reference ID
              </label>
              <input style={inputStyle} value={mandateId} onChange={e => setMandateId(e.target.value)}
                placeholder="NOMBA-MANDATE-XXXX" required />
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '12px 0', borderRadius: 8,
            background: brandColor, color: '#fff', border: 'none',
            fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving...' : 'Update Payment Method'}
          </button>
        </form>
      </div>
    </div>
  );
}
