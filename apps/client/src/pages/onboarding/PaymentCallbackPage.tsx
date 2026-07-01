import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ROUTES } from '../../constants/app.constants';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyCheckout } = useAuthStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const hasVerified = useRef(false);

  const orderReference = searchParams.get('orderReference');
  const method = (searchParams.get('method') as 'card' | 'direct_debit') || 'card';

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasVerified.current) return;
    
    if (!orderReference) {
      setStatus('error');
      setErrorMessage('Missing order reference from payment gateway.');
      return;
    }

    const runVerification = async () => {
      hasVerified.current = true;
      try {
        const result = await verifyCheckout({
          orderReference,
          method,
        });

        if (result.success) {
          setStatus('success');
          toast.success('Payment method configured successfully!');
          // Redirect after animation completes
          setTimeout(() => {
            navigate(ROUTES.ONBOARDING.TIER_SELECTION);
          }, 3000);
        } else {
          setStatus('error');
          setErrorMessage(result.message || 'Payment method setup was not successful.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message || err.message || 'Failed to verify payment setup.');
      }
    };

    runVerification();
  }, [orderReference, method, verifyCheckout, navigate]);

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
        maxWidth: 500,
        textAlign: 'center',
        padding: 'var(--space-xl)',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {status === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div style={{
              position: 'relative',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Loader2 
                size={48} 
                className="animate-spin" 
                style={{ color: 'var(--accent-primary)', animation: 'spin 1.5s linear infinite' }} 
              />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verifying Payment Method
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '320px', margin: '0 auto' }}>
              We are communicating with Nomba to securely verify and register your payment details...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <CheckCircle2 size={48} style={{ color: 'var(--accent-success, #10b981)' }} />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verification Successful!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '320px', margin: '0 auto' }}>
              Your billing token has been registered securely.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              padding: '6px 12px',
              borderRadius: 20,
              marginTop: 'var(--space-md)',
            }}>
              <span className="spinner spinner-sm" /> Redirecting to plan selection...
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <XCircle size={48} style={{ color: 'var(--accent-danger, #ef4444)' }} />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verification Failed
            </h2>
            <p style={{ color: 'var(--accent-danger, #ef4444)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              {errorMessage}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', maxWidth: '320px', margin: '0 auto' }}>
              If you authorized the payment, it may take a minute to process. Otherwise, please try setting up your payment method again.
            </p>
            
            <button
              id="retry-payment-setup-btn"
              onClick={() => navigate(ROUTES.ONBOARDING.PAYMENT_SETUP)}
              className="btn btn-primary btn-full mt-md"
              style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 600 }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
