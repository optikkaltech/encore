import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { validateSetupToken, completeSetup, initiateSetupCheckout, type SetupTokenInfo } from '../../api/setup.api';
import { ROUTES } from '../../constants/app.constants';

type Step = 'welcome' | 'password' | 'payment' | 'completing';

/**
 * Subscriber setup page — accessed from the onboarding email link.
 * /setup?token=xxx
 * Step 1: Welcome + plan info
 * Step 2: Set portal password
 * Step 3: Set up payment method
 * On complete: auto-login into portal
 */
export default function SetupPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [info, setInfo] = useState<SetupTokenInfo | null>(null);
  const [error, setError] = useState<string | null>(token ? null : 'No setup token found in the link.');
  const [loading, setLoading] = useState(!!token);
  const [step, setStep] = useState<Step>('welcome');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'direct_debit' | 'virtual_account'>('card');

  // Callback query parameters from Nomba
  const statusParam = searchParams.get('status') || '';
  const orderRefParam = searchParams.get('orderReference') || '';
  const methodParam = searchParams.get('method') || '';

  // Handle Nomba redirect callback FIRST — before token validation
  // (invite token may already be consumed at this point, so validate only when no callback)
  useEffect(() => {
    if (!token || !statusParam) return;

    if (statusParam === 'SUCCESS' && orderRefParam) {
      const savedPassword = sessionStorage.getItem('setup_password') || '';
      const savedMerchantId = sessionStorage.getItem('setup_merchant_id') || '';

      // Clean callback params from URL immediately
      const cleanUrl = window.location.pathname + '?token=' + token;
      window.history.replaceState({}, document.title, cleanUrl);

      if (savedPassword) {
        setStep('completing');
        setPassword(savedPassword);
        setConfirmPassword(savedPassword);
        setPaymentMethod(methodParam as any);

        completeSetup({
          inviteToken: token,
          password: savedPassword,
          paymentMethod: methodParam as any,
          orderReference: orderRefParam,
        })
          .then(result => {
            sessionStorage.removeItem('setup_password');
            sessionStorage.removeItem('setup_merchant_id');
            sessionStorage.setItem('portal_token', result.portalToken);
            sessionStorage.setItem('portal_merchant_id', result.merchantId);
            toast.success('Payment verified! Setup complete 🎉');
            setTimeout(() => navigate(`${ROUTES.PORTAL.DASHBOARD}?merchant=${result.merchantId}`, { replace: true }), 800);
          })
          .catch(err => {
            const errMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || '';
            // Setup link already consumed = account was already created, just redirect to portal login
            if (errMsg.includes('already-used') || errMsg.includes('already been used')) {
              const loginUrl = savedMerchantId
                ? `${ROUTES.PORTAL.LOGIN}?merchant=${savedMerchantId}`
                : ROUTES.PORTAL.LOGIN;
              toast.success('Your account is already set up! Please log in.');
              setTimeout(() => navigate(loginUrl, { replace: true }), 1500);
            } else {
              toast.error(errMsg || 'Verification failed. Please try again.');
              setStep('payment');
            }
          });
      } else {
        // sessionStorage was cleared (e.g., browser session ended, cross-origin navigation)
        // The payment likely succeeded. We can't auto-complete without the password.
        const loginUrl = savedMerchantId
          ? `${ROUTES.PORTAL.LOGIN}?merchant=${savedMerchantId}`
          : ROUTES.PORTAL.LOGIN;
        toast.success('Payment authorized! Please log in to your portal to confirm your setup.');
        setTimeout(() => navigate(loginUrl, { replace: true }), 2500);
      }
    } else if (statusParam === 'FAILED') {
      toast.error('Payment authorization failed or was cancelled. Please try again.');
      setStep('payment');
      // Clean query parameters from URL without page reload
      const cleanUrl = window.location.pathname + '?token=' + token;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only — avoids re-running on state changes

  // Token validation — only runs when NOT handling a callback
  useEffect(() => {
    if (!token || statusParam) return; // skip if we're in a callback flow
    validateSetupToken(token)
      .then(data => {
        setInfo(data);
        // Save merchantId early so portal login redirect always has it
        sessionStorage.setItem('setup_merchant_id', data.subscriber.merchantId);
      })
      .catch(err => {
        const errMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || '';
        // If the link was already used, check if we should redirect to portal login
        if (errMsg.includes('already been used') || errMsg.includes('already-used')) {
          const merchantId = sessionStorage.getItem('setup_merchant_id') || sessionStorage.getItem('portal_merchant_id');
          if (merchantId) {
            // Subscriber already completed setup — send them to portal login
            toast.success('Your account is already set up! Redirecting to portal login...');
            setTimeout(() => navigate(`${ROUTES.PORTAL.LOGIN}?merchant=${merchantId}`, { replace: true }), 1800);
            return;
          }
        }
        setError(errMsg || 'This link is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [token, statusParam, navigate]);

  const handleCompleteSetup = async () => {
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    if (paymentMethod === 'virtual_account') {
      setStep('completing');
      try {
        const result = await completeSetup({
          inviteToken: token,
          password,
          paymentMethod: 'virtual_account',
        });

        sessionStorage.setItem('portal_token', result.portalToken);
        sessionStorage.setItem('portal_merchant_id', result.merchantId);
        toast.success('Setup complete! Welcome to your portal 🎉');
        setTimeout(() => navigate(`${ROUTES.PORTAL.DASHBOARD}?merchant=${result.merchantId}`, { replace: true }), 800);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Setup failed. Please try again.');
        setStep('payment');
      }
    } else {
      // Redirect via Nomba Checkout directly
      setStep('completing');
      try {
        // Save password and merchantId in session to retrieve on redirect callback
        sessionStorage.setItem('setup_password', password);
        if (info?.subscriber.merchantId) {
          sessionStorage.setItem('setup_merchant_id', info.subscriber.merchantId);
        }

        const callbackUrl = window.location.origin + ROUTES.SETUP + '?token=' + token;
        const result = await initiateSetupCheckout({
          inviteToken: token,
          method: paymentMethod,
          callbackUrl,
        });

        toast.loading('Redirecting to Nomba checkout...', { duration: 1500 });
        setTimeout(() => {
          window.location.href = result.checkoutLink;
        }, 1000);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        const errMsg = error.response?.data?.message || '';
        if (errMsg.includes('already been used') || errMsg.includes('already-used')) {
          const merchantId = info?.subscriber.merchantId;
          const loginUrl = merchantId
            ? `${ROUTES.PORTAL.LOGIN}?merchant=${merchantId}`
            : ROUTES.PORTAL.LOGIN;
          toast.success('Your payment is complete! Please log in to your portal.');
          setTimeout(() => navigate(loginUrl, { replace: true }), 1800);
        } else {
          toast.error(errMsg || 'Failed to initiate Nomba checkout.');
          setStep('payment');
        }
      }
    }
  };

  const brand = info?.merchant.brandColor || '#7c3aed';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Validating your setup link...</p>
    </div>
  );

  if (error) {
    const isAlreadyUsed = error.includes('already been used') || error.includes('already-used');
    const savedMerchantId = sessionStorage.getItem('setup_merchant_id') || sessionStorage.getItem('portal_merchant_id');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: '24px 16px' }}>
        <div className="card" style={{ padding: 48, maxWidth: 460, textAlign: 'center', animation: 'slideUp 300ms ease-out' }}>
          {isAlreadyUsed ? (
            <>
              <CheckCircle size={52} style={{ color: 'var(--success)', margin: '0 auto 20px', display: 'block' }} />
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 20, fontWeight: 700 }}>Setup already complete</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
                Your account has already been set up. You can log in to your billing portal.
              </p>
              {savedMerchantId && (
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 24 }}
                  onClick={() => navigate(`${ROUTES.PORTAL.LOGIN}?merchant=${savedMerchantId}`, { replace: true })}
                >
                  <LogIn size={16} /> Go to Portal Login
                </button>
              )}
            </>
          ) : (
            <>
              <AlertCircle size={52} style={{ color: 'var(--warning)', margin: '0 auto 20px', display: 'block' }} />
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 20, fontWeight: 700 }}>Link Expired</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>{error}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>Contact your provider to request a new setup link.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const steps: Step[] = ['welcome', 'password', 'payment'];
  const stepIdx = steps.indexOf(step === 'completing' ? 'payment' : step);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {info?.merchant.logoUrl ? (
            <img src={info.merchant.logoUrl} alt="" style={{ height: 40, marginBottom: 8 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 12, background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 auto 8px' }}>
              {info?.merchant.businessName[0] || 'E'}
            </div>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{info?.merchant.businessName}</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {['Welcome', 'Password', 'Payment'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stepIdx ? brand : 'var(--border-primary)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* ── Step 1: Welcome ── */}
          {step === 'welcome' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Hi {info?.subscriber.firstName}! 👋
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                Welcome to <strong>{info?.merchant.businessName}</strong>. Let's get your subscription set up in just 2 steps.
              </p>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '14px 16px', marginBottom: 28 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  📧 Verified: <strong>{info?.subscriber.email}</strong>
                </p>
              </div>
              <button onClick={() => setStep('password')} style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: brand, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Get Started →
              </button>
            </div>
          )}

          {/* ── Step 2: Password ── */}
          {step === 'password' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Create your portal password</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                You'll use this to log in and manage your subscription anytime.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Password (min. 8 characters)</label>
                <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoFocus />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Confirm password</label>
                <input type="password" style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('welcome')} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                <button onClick={() => { if (!password || password !== confirmPassword) { toast.error('Passwords must match (min. 8 chars)'); return; } setStep('payment'); }} style={{ flex: 2, padding: '12px 0', borderRadius: 8, border: 'none', background: brand, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment Method ── */}
          {(step === 'payment' || step === 'completing') && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Set up your payment</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                Choose how you want to be billed each cycle.
              </p>
              {/* Method Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: 20, gap: 0 }}>
                {(['card', 'direct_debit', 'virtual_account'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} style={{ flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: paymentMethod === m ? 700 : 400, color: paymentMethod === m ? brand : 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: paymentMethod === m ? `2px solid ${brand}` : '2px solid transparent', cursor: 'pointer' }}>
                    {m === 'card' ? '💳 Card' : m === 'direct_debit' ? '🏦 Bank' : '📥 Virtual Acct'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'card' && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    🔒 Card details are tokenized securely via Nomba and never stored on our servers. You will be redirected to Nomba checkout to authenticate your card.
                  </p>
                </div>
              )}
              {paymentMethod === 'direct_debit' && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    🏦 Set up an automatic bank debit mandate securely through Nomba. You will be redirected to authenticate your bank account.
                  </p>
                </div>
              )}
              {paymentMethod === 'virtual_account' && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Your virtual account</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>A dedicated account number will be created for you after setup. Pay each cycle by transferring to that account — it auto-reconciles instantly.</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('password')} disabled={step === 'completing'} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                <button onClick={handleCompleteSetup} disabled={step === 'completing'} style={{ flex: 2, padding: '12px 0', borderRadius: 8, border: 'none', background: brand, color: '#fff', fontWeight: 700, cursor: step === 'completing' ? 'wait' : 'pointer', opacity: step === 'completing' ? 0.7 : 1 }}>
                  {step === 'completing' ? 'Setting up...' : (paymentMethod === 'virtual_account' ? 'Complete Setup →' : `Connect ${paymentMethod === 'card' ? 'Card' : 'Bank'} via Nomba →`)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
