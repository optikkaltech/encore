// ====================================================================
// Encore - Register Page
// ====================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { AUTH, ROUTES, BUSINESS_TYPES } from '../../constants/app.constants';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    businessType: '',
    password: '',
  });
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.businessName || !form.email || !form.phone || !form.businessType || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await register(form);
      toast.success(AUTH.REGISTER.SUCCESS);
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (err) {
      setError(getErrorMessage(err));
    }
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
        maxWidth: 440,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
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
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{AUTH.REGISTER.TITLE}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{AUTH.REGISTER.SUBTITLE}</p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {error && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{AUTH.REGISTER.BUSINESS_NAME}</label>
              <input className="input" type="text" placeholder={AUTH.REGISTER.BUSINESS_PLACEHOLDER}
                value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} autoFocus />
            </div>

            <div className="input-group">
              <label className="input-label">{AUTH.REGISTER.BUSINESS_TYPE}</label>
              <select className="input" value={form.businessType} onChange={(e) => updateField('businessType', e.target.value)}>
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">{AUTH.REGISTER.EMAIL_LABEL}</label>
              <input className="input" type="email" placeholder={AUTH.REGISTER.EMAIL_PLACEHOLDER}
                value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{AUTH.REGISTER.PHONE}</label>
              <input className="input" type="tel" placeholder={AUTH.REGISTER.PHONE_PLACEHOLDER}
                value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{AUTH.REGISTER.PASSWORD_LABEL}</label>
              <input className="input" type="password" placeholder={AUTH.REGISTER.PASSWORD_PLACEHOLDER}
                value={form.password} onChange={(e) => updateField('password', e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
              {isLoading ? <><span className="spinner spinner-sm" /> {AUTH.REGISTER.SUBMITTING}</> : AUTH.REGISTER.SUBMIT}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-md)' }}>
            {AUTH.REGISTER.TERMS}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{AUTH.REGISTER.DIVIDER}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            {AUTH.REGISTER.HAS_ACCOUNT}{' '}
            <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
              {AUTH.REGISTER.SIGN_IN}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}