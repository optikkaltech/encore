import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { ONBOARDING, ROUTES } from '../../constants/app.constants';
import { Play, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { convertToDemo } = useAuthStore();
  const [isConverting, setIsConverting] = useState(false);

  const handleStartTrial = () => {
    // Proceed to Step 2: KYC Form
    navigate(ROUTES.ONBOARDING.KYC);
  };

  const handleStartDemo = async () => {
    setIsConverting(true);
    try {
      await convertToDemo();
      toast.success('Converted to demo account successfully!');
      navigate(ROUTES.DASHBOARD.OVERVIEW);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 800,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {ONBOARDING.WELCOME.TITLE}
          </h1>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
            {ONBOARDING.WELCOME.SUBTITLE}
          </p>
        </div>

        {/* Options Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
        }}>
          {/* Trial Card */}
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-primary)',
          }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-md)',
              }}>
                <Sparkles size={24} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {ONBOARDING.WELCOME.TRIAL.TITLE}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.5 }}>
                {ONBOARDING.WELCOME.TRIAL.DESCRIPTION}
              </p>
              
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-xl)' }}>
                {ONBOARDING.WELCOME.TRIAL.FEATURES.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <CheckCircle size={16} className="text-success" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleStartTrial}
              className="btn btn-primary btn-full btn-lg"
            >
              <Play size={16} /> {ONBOARDING.WELCOME.TRIAL.CTA}
            </button>
          </div>

          {/* Demo Card */}
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-primary)',
          }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-md)',
              }}>
                <Play size={24} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {ONBOARDING.WELCOME.DEMO.TITLE}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.5 }}>
                {ONBOARDING.WELCOME.DEMO.DESCRIPTION}
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-xl)' }}>
                {ONBOARDING.WELCOME.DEMO.LIMITATIONS.map((lim, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    {lim}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleStartDemo}
              className="btn btn-secondary btn-full btn-lg"
              disabled={isConverting}
            >
              {isConverting ? (
                <><span className="spinner spinner-sm" /> Loading...</>
              ) : (
                ONBOARDING.WELCOME.DEMO.CTA
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
