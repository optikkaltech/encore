import { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types/subscribers.types';
import type { CreateSubscriberPayload, Subscriber } from '../../types/subscribers.types';

interface AddSubscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSubscriberPayload) => Promise<boolean>;
  subscriber?: Subscriber | null;
}

export default function AddSubscriberModal({ isOpen, onClose, onSubmit, subscriber }: AddSubscriberModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subscriber) {
      setEmail(subscriber.email);
      setFirstName(subscriber.firstName);
      setLastName(subscriber.lastName);
      setPhone(subscriber.phone);
      setAddress(subscriber.address || '');
      setCity(subscriber.city || '');
      setState(subscriber.state || '');
      setPaymentMethod(subscriber.paymentMethod);
    } else {
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setAddress('');
      setCity('');
      setState('');
      setPaymentMethod(PaymentMethod.CARD);
    }
  }, [subscriber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      email,
      firstName,
      lastName,
      phone,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      paymentMethod,
    });
    setIsSubmitting(false);

    if (success) {
      if (!subscriber) {
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setAddress('');
        setCity('');
        setState('');
        setPaymentMethod(PaymentMethod.CARD);
      }
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, width: '100%' }}>
        <h2 className="modal-title">{subscriber ? 'Edit Subscriber' : 'Add Subscriber'}</h2>
        <p className="modal-description">{subscriber ? 'Update the details for this customer.' : 'Register a new customer for subscription payments.'}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">First Name *</label>
              <input
                type="text"
                className="input"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Last Name *</label>
              <input
                type="text"
                className="input"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                className="input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number *</label>
              <input
                type="tel"
                className="input"
                required
                placeholder="+234"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Address</label>
            <input
              type="text"
              className="input"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">City</label>
              <input
                type="text"
                className="input"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">State</label>
              <input
                type="text"
                className="input"
                value={state}
                onChange={e => setState(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Preferred Payment Method</label>
            <select
              className="input"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.CARD}>Card</option>
              <option value={PaymentMethod.DIRECT_DEBIT}>Direct Debit</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (subscriber ? 'Updating...' : 'Creating...') : (subscriber ? 'Update Subscriber' : 'Create Subscriber')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
