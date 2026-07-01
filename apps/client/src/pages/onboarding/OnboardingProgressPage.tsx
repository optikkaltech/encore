import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import { ONBOARDING, ROUTES } from '../../constants/app.constants';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnboardingProgressPage() {
  const navigate = useNavigate();
  const { onboardingStatus: status, fetchOnboardingStatus, completeOnboarding, merchant, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(!status);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchOnboardingStatus(),
          fetchProfile()
        ]);
      } catch (err) {
        toast.error(`Failed to load onboarding data: ${getErrorMessage(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchOnboardingStatus, fetchProfile]);

  const handleFinish = async () => {
    try {
      await completeOnboarding();
      navigate(ROUTES.DASHBOARD.OVERVIEW);
    } catch (err) {
      toast.error(`Failed to complete onboarding: ${getErrorMessage(err)}`);
    }
  };

  const getNextUncompletedStepRoute = (): string => {
    if (!status) return ROUTES.ONBOARDING.WELCOME;
    
    const { steps } = status;
    if (!steps.kycSubmission.completed) return ROUTES.ONBOARDING.KYC;
    if (!steps.paymentSetup.completed) return ROUTES.ONBOARDING.PAYMENT_SETUP;
    if (!steps.tierSelection.completed) return ROUTES.ONBOARDING.TIER_SELECTION;
    
    return ROUTES.DASHBOARD.OVERVIEW;
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading onboarding progress...</p>
        </div>
      </div>
    );
  }

  const progress = status?.progress ?? 0;
  const isComplete = status?.isComplete ?? false;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl) var(--space-md)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 600,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {ONBOARDING.PROGRESS.TITLE}
          </h1>
          {merchant?.merchantCode && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
              Merchant ID: <strong style={{ color: 'var(--text-primary)' }}>{merchant.merchantCode}</strong>
            </p>
          )}
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>
            {isComplete ? ONBOARDING.PROGRESS.CAN_GO_LIVE : 'Verify your account and select a tier to go live'}
          </p>
        </div>

        {/* Progress Card */}
        <div className="card" style={{ background: 'var(--bg-primary)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          {/* Progress Bar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Onboarding Progress
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {progress}%
            </span>
          </div>

          {/* Progress Bar fill */}
          <div className="progress-bar" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Steps List */}
          {status && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StepRow
                title={status.steps.registration.label}
                completed={status.steps.registration.completed}
              />
              <StepRow
                title={status.steps.emailVerification.label}
                completed={status.steps.emailVerification.completed}
              />
              <StepRow
                title={status.steps.kycSubmission.label}
                completed={status.steps.kycSubmission.completed}
                badgeText={status.steps.kycSubmission.status}
              />
              <StepRow
                title={status.steps.paymentSetup.label}
                completed={status.steps.paymentSetup.completed}
                badgeText={status.steps.paymentSetup.method}
              />
              <StepRow
                title={status.steps.tierSelection.label}
                completed={status.steps.tierSelection.completed}
                badgeText={status.steps.tierSelection.tier}
              />
            </div>
          )}
        </div>

        {/* Final CTA */}
        <div style={{ textAlign: 'center' }}>
          {isComplete ? (
            <button
              onClick={handleFinish}
              className="btn btn-primary btn-lg"
              style={{ minWidth: 220, gap: 8 }}
            >
              <ShieldCheck size={18} />
              {ONBOARDING.PROGRESS.GO_DASHBOARD}
            </button>
          ) : (
            <button
              onClick={() => navigate(getNextUncompletedStepRoute())}
              className="btn btn-primary btn-lg"
              style={{ minWidth: 220, gap: 8 }}
            >
              Resume Onboarding
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepRowProps {
  title: string;
  completed: boolean;
  badgeText?: string;
}

function StepRow({ title, completed, badgeText }: StepRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      border: '1px solid var(--border-light)',
      borderRadius: 8,
      background: completed ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
      borderColor: completed ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: completed ? 'var(--success)' : 'var(--bg-secondary)',
          color: completed ? 'white' : 'var(--text-muted)',
        }}>
          {completed ? <Check size={14} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />}
        </div>
        
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: completed ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}>
          {title}
        </span>
      </div>

      {badgeText && (
        <span className={`badge ${completed ? 'badge-success' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
          {badgeText}
        </span>
      )}
    </div>
  );
}
