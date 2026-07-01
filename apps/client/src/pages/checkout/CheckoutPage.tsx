import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { getCheckoutPlan, selfEnroll, type CheckoutPlan } from '../../api/checkout.api';

/**
 * Public plan checkout page — accessible via /checkout/:planId
 * No auth required. Subscriber fills their info → gets onboarding email.
 */
export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<CheckoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  useEffect(() => {
    if (!planId) return;
    getCheckoutPlan(planId)
      .then(setPlan)
      .catch(() => toast.error('Plan not found'))
      .finally(() => setLoading(false));
  }, [planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    setSubmitting(true);
    try {
      await selfEnroll(planId, form);
      setSubmitted(true);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message;
      if (msg?.includes('already registered')) {
        toast.error(msg);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const brand = plan?.merchant.brandColor || 'var(--accent-primary)';
  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
      }}>
        <div className="card" style={{ padding: 'var(--space-2xl)', maxWidth: 380, textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Plan not found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            This plan link may have expired or been deactivated.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: 'var(--space-lg)',
      }}>
        <div className="card" style={{ padding: 'var(--space-2xl)', maxWidth: 440, textAlign: 'center', animation: 'slideUp 300ms ease-out' }}>
          <CheckCircle size={52} style={{ color: 'var(--success)', margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Check your email!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
            We've sent a setup link to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>.{' '}
            Click it to set up your payment and access your billing portal.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            The link expires in 72 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '48px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 880, margin: '0 auto', animation: 'slideUp 300ms ease-out' }}>

        {/* Merchant brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          {plan.merchant.logoUrl ? (
            <img src={plan.merchant.logoUrl} alt="" style={{ height: 36, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}>
              {plan.merchant.businessName[0]}
            </div>
          )}
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
            {plan.merchant.businessName}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>

          {/* Left — Plan Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Plan detail card */}
            <div className="card" style={{ padding: 28 }}>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}>
                You're subscribing to
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {plan.planName}
              </h1>
              {plan.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  {plan.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: brand }}>
                  {formatCurrency(plan.amount, plan.currency)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ {plan.frequency}</span>
              </div>

              {plan.trialDays > 0 && (
                <div style={{
                  marginTop: 14,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  Includes a {plan.trialDays}-day free trial
                </div>
              )}
              {plan.setupFee > 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10 }}>
                  One-time setup fee: {formatCurrency(plan.setupFee, plan.currency)}
                </p>
              )}
            </div>

            {/* Security note */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Lock size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Your payment details are set up securely after registration. You'll receive an email with next steps.
                </p>
              </div>
            </div>
          </div>

          {/* Right — Enrollment form */}
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Enter your details to get started
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> First name
                    </span>
                  </label>
                  <input
                    id="co-first"
                    className="input"
                    value={form.firstName}
                    required
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Ada"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Last name</label>
                  <input
                    id="co-last"
                    className="input"
                    value={form.lastName}
                    required
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Okonkwo"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} /> Email address
                  </span>
                </label>
                <input
                  id="co-email"
                  type="email"
                  className="input"
                  value={form.email}
                  required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ada@example.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> Phone number
                  </span>
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  className="input"
                  value={form.phone}
                  required
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+234 801 234 5678"
                />
              </div>

              <button
                type="submit"
                className="btn btn-full btn-lg"
                disabled={submitting}
                style={{ background: brand, color: '#fff', border: 'none', marginTop: 4 }}
              >
                {submitting ? (
                  <><span className="spinner spinner-sm" /> Submitting...</>
                ) : (
                  `Subscribe to ${plan.planName} →`
                )}
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                You'll set up your payment method via a secure email link after this step.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
