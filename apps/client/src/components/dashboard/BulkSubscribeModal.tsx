import { useState } from 'react';
import type { Plan } from '../../types/plans.types';

interface BulkSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  plans: Plan[];
  onSubmit: (planId: string) => Promise<boolean>;
}

export default function BulkSubscribeModal({ isOpen, onClose, selectedCount, plans, onSubmit }: BulkSubscribeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setIsSubmitting(true);
    const success = await onSubmit(selectedPlanId);
    setIsSubmitting(false);

    if (success) {
      setSelectedPlanId('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, width: '100%' }}>
        <h2 className="modal-title">Bulk Subscribe to Plan</h2>
        <p className="modal-description">
          Assign a billing plan to all <strong>{selectedCount} selected subscribers</strong>. Invoices and auto-renewals will be created in the background.
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
                    {plan.name} (₦{Number(plan.amount).toLocaleString()}/{plan.frequency})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedPlanId}>
                {isSubmitting ? 'Attaching Plan...' : `Subscribe ${selectedCount} Customers`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
