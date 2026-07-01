import { useState, useEffect } from 'react';
import { BillingFrequency } from '../../types/plans.types';
import type { CreatePlanPayload, Plan } from '../../types/plans.types';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePlanPayload) => Promise<boolean>;
  plan?: Plan | null;
}

export default function CreatePlanModal({ isOpen, onClose, onSubmit, plan }: CreatePlanModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillingFrequency>(BillingFrequency.MONTHLY);
  const [customDays, setCustomDays] = useState('');
  const [description, setDescription] = useState('');
  const [trialDays, setTrialDays] = useState('0');
  const [setupFee, setSetupFee] = useState('0');
  const [isProrated, setIsProrated] = useState(true);
  const [isUsageBased, setIsUsageBased] = useState(false);
  const [usageMetric, setUsageMetric] = useState('');
  const [usageRate, setUsageRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial plan properties when editing
  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setCode(plan.code);
      setAmount(plan.amount.toString());
      setFrequency(plan.frequency as BillingFrequency);
      setDescription(plan.description || '');
      setTrialDays(plan.trialDays.toString());
      setSetupFee(plan.setupFee.toString());
      setIsProrated(plan.isProrated);
      setIsUsageBased(plan.isUsageBased);
      setUsageMetric(plan.usageMetric || '');
      setUsageRate(plan.usageRate?.toString() || '');
    } else {
      setName('');
      setCode('');
      setAmount('');
      setFrequency(BillingFrequency.MONTHLY);
      setCustomDays('');
      setDescription('');
      setTrialDays('0');
      setSetupFee('0');
      setIsProrated(true);
      setIsUsageBased(false);
      setUsageMetric('');
      setUsageRate('');
    }
  }, [plan, isOpen]);

  // Auto-generate code from name (only in Create mode)
  useEffect(() => {
    if (plan) return;
    if (name) {
      const generatedCode = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCode(generatedCode);
    } else {
      setCode('');
    }
  }, [name, plan]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !amount) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      name,
      code,
      amount: Number(amount),
      frequency,
      customDays: frequency === BillingFrequency.CUSTOM ? (Number(customDays) || undefined) : undefined,
      description: description || undefined,
      trialDays: Number(trialDays) || 0,
      setupFee: Number(setupFee) || 0,
      isProrated,
      isUsageBased,
      usageMetric: isUsageBased ? (usageMetric || undefined) : undefined,
      usageRate: isUsageBased ? (Number(usageRate) || undefined) : undefined,
    });
    setIsSubmitting(false);

    if (success) {
      if (!plan) {
        setName('');
        setCode('');
        setAmount('');
        setFrequency(BillingFrequency.MONTHLY);
        setCustomDays('');
        setDescription('');
        setTrialDays('0');
        setSetupFee('0');
        setIsProrated(true);
        setIsUsageBased(false);
        setUsageMetric('');
        setUsageRate('');
      }
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, width: '100%' }}>
        <h2 className="modal-title">{plan ? 'Edit Billing Plan' : 'Create Billing Plan'}</h2>
        <p className="modal-description">{plan ? 'Update the details below for this plan tier.' : 'Fill in the details below to define a new plan tier.'}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Plan Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Premium Tier"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Plan Code (slug reference) *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., premium-tier"
              required
              disabled={!!plan}
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description (optional)</label>
            <textarea
              className="input"
              placeholder="Tell your subscribers what is included..."
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Price (NGN) *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 5000"
                required
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Billing Frequency *</label>
              <select
                className="input"
                value={frequency}
                disabled={!!plan}
                onChange={e => setFrequency(e.target.value as BillingFrequency)}
              >
                <option value={BillingFrequency.WEEKLY}>Weekly</option>
                <option value={BillingFrequency.MONTHLY}>Monthly</option>
                <option value={BillingFrequency.QUARTERLY}>Quarterly</option>
                <option value={BillingFrequency.SEMI_ANNUAL}>Semi-Annual</option>
                <option value={BillingFrequency.ANNUAL}>Annual</option>
                <option value={BillingFrequency.CUSTOM}>Custom Period</option>
              </select>
            </div>
          </div>

          {frequency === BillingFrequency.CUSTOM && (
            <div className="input-group animate-slide-up">
              <label className="input-label">Custom Billing Cycle (days) *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 45"
                required
                disabled={!!plan}
                min="1"
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Specify the exact number of days between billings.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Trial Period (days)
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                disabled={!!plan}
                min="0"
                value={trialDays}
                onChange={e => setTrialDays(e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Free trial days before charging.
              </span>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Setup Fee
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                disabled={!!plan}
                min="0"
                value={setupFee}
                onChange={e => setSetupFee(e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                One-time fee charged on first cycle.
              </span>
            </div>
          </div>

          {/* Premium Advanced Toggles with Explainers */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="isProrated"
                checked={isProrated}
                disabled={!!plan}
                onChange={e => setIsProrated(e.target.checked)}
                style={{ marginTop: 3, cursor: 'pointer' }}
              />
              <label htmlFor="isProrated" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Prorate Plan Changes</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '15px' }}>
                  Auto-calculates partial charges for mid-cycle upgrades/downgrades (e.g. charging only for remaining days in the month).
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="isUsageBased"
                checked={isUsageBased}
                disabled={!!plan}
                onChange={e => setIsUsageBased(e.target.checked)}
                style={{ marginTop: 3, cursor: 'pointer' }}
              />
              <label htmlFor="isUsageBased" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Usage-Based Billing</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '15px' }}>
                  Charge subscribers dynamically based on their consumption data (e.g., charge per credit or API call used) instead of a flat price.
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Usage-Based Fields */}
          {isUsageBased && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px solid var(--border-light)',
            }} className="animate-slide-up">
              <div className="input-group">
                <label className="input-label">Usage Metric *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., api_calls, credits"
                  required
                  disabled={!!plan}
                  value={usageMetric}
                  onChange={e => setUsageMetric(e.target.value)}
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Name of the resource being tracked.</span>
              </div>

              <div className="input-group">
                <label className="input-label">Unit Rate (NGN) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g., 10"
                  required
                  disabled={!!plan}
                  min="0.0001"
                  step="any"
                  value={usageRate}
                  onChange={e => setUsageRate(e.target.value)}
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Price charged per unit consumed.</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (plan ? 'Updating Plan...' : 'Creating Plan...') : (plan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
