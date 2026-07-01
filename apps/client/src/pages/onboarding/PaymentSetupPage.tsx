import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { ONBOARDING, ROUTES } from '../../constants/app.constants';
import { CreditCard, Landmark, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSetupPage() {
  const navigate = useNavigate();
  const { initiateCheckout } = useAuthStore();
  const [method, setMethod] = useState<'card' | 'direct_debit'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const callbackUrl = window.location.origin + ROUTES.ONBOARDING.PAYMENT_CALLBACK;
      
      const result = await initiateCheckout({
        method,
        callbackUrl,
      });

      toast.loading('Redirecting to secure payment checkout...', { duration: 1500 });
      
      // Redirect to Nomba Checkout (or local simulated mock checkout)
      setTimeout(() => {
        window.location.href = result.checkoutLink;
      }, 1000);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.success('Payment setup skipped. You are on a 30-day free trial.');
    navigate(ROUTES.ONBOARDING.TIER_SELECTION);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl) var(--space-md)',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 580,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {ONBOARDING.PAYMENT.TITLE}
          </h1>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>
            {ONBOARDING.PAYMENT.SUBTITLE}
          </p>
        </div>

        {/* Info Box: Skippable trial info */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 'var(--space-md)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              30-Day Free Trial Active
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '18px' }}>
              Setting up payments now validates your account and ensures uninterrupted service. No card details are stored on our servers. You can also skip this and set it up later before your trial ends.
            </p>
          </div>
        </div>

        {/* Payment Form Card */}
        <div className="card" style={{ background: 'var(--bg-primary)', padding: 'var(--space-xl)', borderRadius: 16 }}>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            
            {/* Method Toggle Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                SELECT PAYMENT METHOD
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-md)',
              }}>
                {/* Card option */}
                <div
                  id="payment-method-card"
                  onClick={() => setMethod('card')}
                  style={{
                    border: method === 'card' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: 'var(--space-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: method === 'card' ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: method === 'card' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CreditCard size={18} style={{ color: method === 'card' ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={method === 'card'} 
                      onChange={() => setMethod('card')} 
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      Credit/Debit Card
                    </h5>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Instantly link Visa, Mastercard, or Verve</p>
                  </div>
                </div>

                {/* Direct Debit option */}
                <div
                  id="payment-method-direct-debit"
                  onClick={() => setMethod('direct_debit')}
                  style={{
                    border: method === 'direct_debit' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: 'var(--space-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: method === 'direct_debit' ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: method === 'direct_debit' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Landmark size={18} style={{ color: method === 'direct_debit' ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={method === 'direct_debit'} 
                      onChange={() => setMethod('direct_debit')} 
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      Direct Debit / Bank
                    </h5>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Connect directly using bank authentication</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              padding: '16px',
              fontSize: 12,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}>
              <ShieldAlert size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', lineHeight: '16px' }}>
                You will be redirected to Nomba's secure gateway. Raw financial records are never handled or stored by Encore.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="submit"
                id="connect-payment-method-btn"
                className="btn btn-primary btn-full btn-lg"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? (
                  <><span className="spinner spinner-sm" /> Redirecting...</>
                ) : (
                  <>
                    Connect {method === 'card' ? 'Card' : 'Bank'} via Nomba
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                id="skip-payment-setup-btn"
                onClick={handleSkip}
                className="btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Skip & Set Up Later
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
