import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { usePortalStore } from '../../store/portal.store';
import { ROUTES } from '../../constants/app.constants';

/**
 * Portal Login Page — accessed via /portal/login?merchant=<merchantId>
 * Subscriber enters email + password to get a portalToken.
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
  const { login, loadConfig, config, isAuthenticated } = usePortalStore();
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
    if (!merchantId) return toast.error('No merchant specified in URL');
    setLoading(true);
    try {
      await login(email, password, merchantId);
      toast.success('Welcome back!');
      navigate(ROUTES.PORTAL.DASHBOARD, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const brandColor = config?.brandColor || '#4A4A4A';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-lg)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
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
              background: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 22,
              fontWeight: 700,
              margin: '0 auto 12px',
            }}>
              {config?.businessName?.[0]?.toUpperCase() || 'E'}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {config?.businessName ? `${config.businessName} Portal` : 'Subscriber Portal'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Sign in to manage your subscription
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#FEE2E2',
                color: '#991B1B',
                borderRadius: 8,
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                id="portal-email"
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="portal-password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
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
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="portal-login-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ background: brandColor, marginTop: 4 }}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Signing in...</>
              ) : (
                <><LogIn size={16} /> Sign in</>
              )}
            </button>
          </form>
        </div>

        {config?.poweredBy && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-lg)' }}>
            Powered by <strong style={{ color: brandColor }}>Encore</strong>
          </p>
        )}
      </div>
    </div>
  );
}
