import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Subscriber } from '../../types/subscribers.types';
import type { CreateInvoicePayload, CreateInvoiceLineItemPayload } from '../../types/billing.types';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload) => Promise<boolean>;
  subscribers: Subscriber[];
}

export default function CreateInvoiceModal({ isOpen, onClose, onSubmit, subscribers }: CreateInvoiceModalProps) {
  const [subscriberId, setSubscriberId] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<CreateInvoiceLineItemPayload[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubscriberId('');
      setNotes('');
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof CreateInvoiceLineItemPayload, value: any) => {
    setLineItems(prev =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity') updated.quantity = Math.max(1, parseInt(value) || 1);
          if (field === 'unitPrice') updated.unitPrice = Math.max(0, parseFloat(value) || 0);
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberId) {
      alert('Please select a subscriber');
      return;
    }

    const invalidItems = lineItems.some(item => !item.description.trim() || item.unitPrice <= 0);
    if (invalidItems) {
      alert('Please fill out descriptions and enter valid unit prices (> 0) for all line items.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      subscriberId,
      lineItems,
      currency: 'NGN',
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, width: '100%' }}>
        <h2 className="modal-title">Create Invoice</h2>
        <p className="modal-description">Generate a manual one-time invoice and log its payment (auto-marked as Paid using card fallback).</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Select Subscriber *</label>
            <select
              className="input"
              required
              value={subscriberId}
              onChange={e => setSubscriberId(e.target.value)}
            >
              <option value="">-- Choose Subscriber --</option>
              {subscribers.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.firstName} {sub.lastName} ({sub.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" style={{ margin: 0 }}>Line Items *</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddLineItem}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' }}>
              {lineItems.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Item description..."
                    required
                    style={{ flex: 3 }}
                    value={item.description}
                    onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Qty"
                    min="1"
                    required
                    style={{ flex: 1, minWidth: 60 }}
                    value={item.quantity}
                    onChange={e => handleLineItemChange(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Price (₦)"
                    min="0"
                    step="0.01"
                    required
                    style={{ flex: 1.5, minWidth: 100 }}
                    value={item.unitPrice || ''}
                    onChange={e => handleLineItemChange(index, 'unitPrice', e.target.value)}
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      style={{ color: 'var(--error)', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Notes (Optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Terms, payment instructions, or other notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Totals Summary */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px dashed var(--border-light)',
            marginTop: 8
          }}>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Total Amount:</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              ₦{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Create & Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
