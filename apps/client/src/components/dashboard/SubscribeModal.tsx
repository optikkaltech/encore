import { useState } from 'react';
import type { Subscriber } from '../../types/subscribers.types';
import type { Plan } from '../../types/plans.types';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  plans: Plan[];
  onSubmit: (subscriberId: string, planId: string) => Promise<boolean>;
}

export default function SubscribeModal({ isOpen, onClose, subscriber, plans, onSubmit }: SubscribeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !subscriber) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setIsSubmitting(true);
    const success = await onSubmit(subscriber.id, selectedPlanId);
    setIsSubmitting(false);

    if (success) {
      setSelectedPlanId('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, width: '100%' }}>
        <h2 className="modal-title">Subscribe Customer to Plan</h2>
        <p className="modal-description">
          Assign a billing plan to <strong>{subscriber.firstName} {subscriber.lastName}</strong>.
        </p>

        {plans.length === 0 ? (
          <div style={{ padding: 'var(--space-md) 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No active billing plans found.</p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Select Plan *</label>
              <select
                className="input"
                required
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
              >
                <option value="">-- Choose Plan --</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (₦{plan.amount.toLocaleString()}/{plan.frequency})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedPlanId}>
                {isSubmitting ? 'Subscribing...' : 'Subscribe Customer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
