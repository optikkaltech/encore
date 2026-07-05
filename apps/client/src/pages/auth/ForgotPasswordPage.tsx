import { useState } from 'react';
import { Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client';
import { AUTH, ROUTES, API_ENDPOINTS } from '../../constants/app.constants';
import type { ApiResponse } from '../../types/api.types';
import { MailIcon } from '../../assets';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    setIsLoading(true);
    try {
      await client.post<ApiResponse<unknown>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MailIcon size={40} style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{AUTH.FORGOT_PASSWORD.SUCCESS}</h2>
          <Link to={ROUTES.LOGIN} style={{ fontSize: 14, color: 'var(--accent-primary)', fontWeight: 500 }}>
            {AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{AUTH.FORGOT_PASSWORD.TITLE}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{AUTH.FORGOT_PASSWORD.SUBTITLE}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {error && <ErrorBox message={error} />}
          <div className="input-group">
            <label className="input-label">{AUTH.FORGOT_PASSWORD.EMAIL_LABEL}</label>
            <input className="input" type="email" placeholder={AUTH.FORGOT_PASSWORD.EMAIL_PLACEHOLDER}
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? <><span className="spinner spinner-sm" /> {AUTH.FORGOT_PASSWORD.SUBMITTING}</> : AUTH.FORGOT_PASSWORD.SUBMIT}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
          <Link to={ROUTES.LOGIN} style={{ fontSize: 13, color: 'var(--accent-primary)' }}>
            {AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', background: 'var(--bg-secondary)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>{children}</div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>{message}</div>;
}