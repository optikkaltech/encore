import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Lock, CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentMockCheckoutPage() {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderReference = searchParams.get('orderReference') || `mock_ref_${Date.now()}`;
  const callbackUrl = searchParams.get('callbackUrl') || `${window.location.origin}/onboarding/payment/callback`;

  // Pre-filled mock details
  const [cardNumber] = useState('5061 1234 5678 9012');
  const [cardExpiry] = useState('12/28');
  const [cardCvv] = useState('123');
  const [cardName, setCardName] = useState('TEST MERCHANT');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      toast.error('Please enter the cardholder name');
      return;
    }

    setIsSubmitting(true);

    // Simulate gateway latency
    setTimeout(() => {
      // Direct redirect to our callback url with success parameters
      const url = new URL(callbackUrl);
      url.searchParams.set('status', 'SUCCESS');
      url.searchParams.set('orderReference', orderReference);
      url.searchParams.set('method', 'card');
      
      window.location.href = url.toString();
    }, 1500);
  };

  const handleCancel = () => {
    // Return with failed status
    const url = new URL(callbackUrl);
    url.searchParams.set('status', 'FAILED');
    url.searchParams.set('orderReference', orderReference);
    url.searchParams.set('method', 'card');
    
    window.location.href = url.toString();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)',
      background: '#0B0F19', // Premium checkout dark theme
      color: '#F3F4F6',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#161F30',
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #23324C',
        overflow: 'hidden',
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Gateway Header Branding */}
        <div style={{
          background: '#111827',
          padding: '24px 24px 20px',
          borderBottom: '1px solid #1F2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={18} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', color: '#F59E0B' }}>
                NOMBA
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                background: '#374151',
                padding: '2px 6px',
                borderRadius: 4,
                color: '#9CA3AF',
              }}>
                SANDBOX SIMULATOR
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Secure Payment Gateway</p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Amount Due</span>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 2 }}>₦100.00</p>
          </div>
        </div>

        {/* Transaction Summary Panel */}
        <div style={{
          background: '#1E293B',
          padding: '16px 24px',
          fontSize: 12,
          color: '#D1D5DB',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Merchant</span>
            <strong style={{ color: '#F3F4F6' }}>Encore Platform Fees</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Description</span>
            <span style={{ color: '#F3F4F6' }}>Verification & Card Tokenization</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ref</span>
            <span style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>
              {orderReference.substring(0, 18)}...
            </span>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handlePay} style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px dashed rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            color: '#F59E0B',
            lineHeight: '18px',
          }}>
            This checkout simulates the Nomba gateway tokenization redirect. Payment is mocked, and the card will be validated securely.
          </div>

          {/* Card Number Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Card Number
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                disabled
                value={cardNumber}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#9CA3AF',
                  fontSize: 14,
                  letterSpacing: '1px',
                }}
              />
              <CreditCard size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#4B5563' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Expiry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Expiry Date
              </label>
              <input
                type="text"
                disabled
                value={cardExpiry}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#9CA3AF',
                  fontSize: 14,
                  textAlign: 'center',
                }}
              />
            </div>

            {/* CVV */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CVV
              </label>
              <input
                type="password"
                disabled
                value={cardCvv}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#9CA3AF',
                  fontSize: 14,
                  textAlign: 'center',
                  letterSpacing: '2px',
                }}
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cardholder Name
            </label>
            <input
              type="text"
              required
              id="mock-card-name-input"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#F3F4F6',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              placeholder="e.g. JOHN DOE"
            />
          </div>

          {/* Secure lock note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#9CA3AF' }}>
            <Lock size={12} style={{ color: '#10B981' }} />
            <span>Secured with 256-bit SSL Encryption</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            <button
              type="submit"
              id="mock-checkout-submit-btn"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 10,
                background: '#10B981',
                color: '#FFF',
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 150ms ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderColor: '#FFF #FFF transparent transparent' }} />
                  Processing payment...
                </>
              ) : (
                <>
                  Pay ₦100.00
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            
            <button
              type="button"
              id="mock-checkout-cancel-btn"
              onClick={handleCancel}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                background: 'transparent',
                color: '#9CA3AF',
                border: '1px solid #334155',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Cancel Payment
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
