// ====================================================================
// Encore - Login Page
// ====================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { AUTH, APP, ROUTES, API_ENDPOINTS } from '../../constants/app.constants';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login({ email, password });
      toast.success(AUTH.LOGIN.SUCCESS);
      navigate(ROUTES.DASHBOARD.OVERVIEW);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api/v1'}${API_ENDPOINTS.AUTH.GOOGLE}`;
  };

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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 auto 12px',
          }}>
            E
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {AUTH.LOGIN.TITLE}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {AUTH.LOGIN.SUBTITLE}
          </p>
        </div>

        {/* Form */}
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
              <label className="input-label">{AUTH.LOGIN.EMAIL_LABEL}</label>
              <input
                className="input"
                type="email"
                placeholder={AUTH.LOGIN.EMAIL_PLACEHOLDER}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">{AUTH.LOGIN.PASSWORD_LABEL}</label>
                <Link to={ROUTES.FORGOT_PASSWORD} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {AUTH.LOGIN.FORGOT_PASSWORD}
                </Link>
              </div>
              <input
                className="input"
                type="password"
                placeholder={AUTH.LOGIN.PASSWORD_PLACEHOLDER}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner spinner-sm" /> {AUTH.LOGIN.SUBMITTING}</>
              ) : (
                <><LogIn size={16} /> {AUTH.LOGIN.SUBMIT}</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            margin: 'var(--space-lg) 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {AUTH.LOGIN.DIVIDER}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="btn btn-secondary btn-full"
            style={{ justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {AUTH.LOGIN.GOOGLE}
          </button>

          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 'var(--space-md)' }}>
            {AUTH.LOGIN.NO_ACCOUNT}{' '}
            <Link to={ROUTES.REGISTER} style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
              {AUTH.LOGIN.CREATE_ACCOUNT}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-lg)' }}>
          &copy; 2026 {APP.NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
}