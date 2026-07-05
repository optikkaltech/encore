import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from '../../assets';
import { usePortalStore } from '../../store/portal.store';
import { ROUTES } from '../../constants/app.constants';

/**
 * Portal Login Page — accessed via /portal/login?merchant=<merchantId>
 * Subscriber enters email + password to get a portalToken.
 * Uses standard system CSS variables for colors, ensuring consistency.
 */
export default function PortalLoginPage() {
  const [searchParams] = useSearchParams();
  const merchantId = searchParams.get('merchant')
    || sessionStorage.getItem('setup_merchant_id')
    || sessionStorage.getItem('portal_merchant_id')
    || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loadConfig, config, isAuthenticated, multipleMerchantsList } = usePortalStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (merchantId) loadConfig(merchantId);
  }, [merchantId, loadConfig]);

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.PORTAL.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, merchantId || undefined);
      if (result && result.multipleMerchants) {
        toast.success('Select a business to continue');
      } else {
        toast.success('Welcome back!');
        navigate(ROUTES.PORTAL.DASHBOARD, { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMerchant = async (selectedMerchantId: string) => {
    setError('');
    setLoading(true);
    try {
      await login(email, password, selectedMerchantId);
      toast.success('Welcome back!');
      navigate(ROUTES.PORTAL.DASHBOARD, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-secondary)',
    }}>
      {/* Portal-scoped stylesheet reset for login card */}
      <style>{`
        .portal-login-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .portal-login-input {
          width: 100%;
          padding: 11px 13px;
          font-size: 14px;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          outline: none;
          transition: all 0.15s;
          box-sizing: border-box;
        }
        .portal-login-input:focus {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 3px var(--accent-light);
        }
        .portal-merchant-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          cursor: pointer;
          text-align: left;
          transition: all 200ms ease;
          box-shadow: var(--shadow-sm);
        }
        .portal-merchant-btn:hover {
          border-color: var(--accent-primary) !important;
          box-shadow: var(--shadow-md);
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {config?.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.businessName}
              style={{ height: 48, marginBottom: 12, objectFit: 'contain' }}
            />
          ) : (
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              fontSize: 22,
              fontWeight: 700,
              margin: '0 auto 12px',
              boxShadow: 'var(--shadow-md)',
            }}>
              {config?.businessName?.[0]?.toUpperCase() || 'E'}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {config?.businessName ? `${config.businessName} Portal` : 'Subscriber Portal'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Sign in to manage your subscription
          </p>
        </div>

        {multipleMerchantsList ? (
          /* Merchant selection list */
          <div className="portal-login-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Select Business Portal
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Your email is subscribed to multiple businesses. Choose one to continue:
              </p>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {multipleMerchantsList.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMerchant(m.id)}
                  disabled={loading}
                  className="portal-merchant-btn"
                >
                  {m.logoUrl ? (
                    <img src={m.logoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  ) : (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--bg-primary)',
                      fontWeight: 700,
                      fontSize: 16
                    }}>
                      {m.businessName?.[0]?.toUpperCase() || 'B'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {m.businessName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      Click to enter portal
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => usePortalStore.setState({ multipleMerchantsList: null })}
              disabled={loading}
              style={{
                alignSelf: 'center',
                marginTop: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Login
            </button>
          </div>
        ) : (
          /* Form card */
          <div className="portal-login-card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ padding: '10px 12px', background: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 8, fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Email address</label>
                <input
                  id="portal-email"
                  type="email"
                  className="portal-login-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="portal-password"
                    type={showPass ? 'text' : 'password'}
                    className="portal-login-input"
                    style={{ paddingRight: 40 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="portal-login-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 24 }}>
          Powered by <strong>Encore</strong>
        </p>
      </div>
    </div>
  );
}
