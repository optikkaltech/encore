import { useState, useEffect } from 'react';
import { BuildingIcon, ShieldCheckIcon, CheckCircle2Icon } from '../../../assets';
import type { MerchantProfile } from '../../../api/settings.api';

interface Props {
  profile: MerchantProfile | null;
  saving: boolean;
  onSave: (payload: any) => Promise<boolean>;
}

export default function BusinessProfileForm({ profile, saving, onSave }: Props) {
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (profile) {
      setOwnerName(profile.settings?.ownerName || '');
      setBusinessName(profile.businessName || '');
      setPhone(profile.phone || '');
      setRegNumber(profile.registrationNumber || '');
      setTaxId(profile.taxId || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ownerName,
      businessName,
      phone,
      registrationNumber: regNumber || undefined,
      taxId: taxId || undefined,
      address,
      city,
      state,
    });
  };

  const getKycBadgeClass = (status?: string) => {
    if (status === 'verified') return 'badge-success';
    if (status === 'in_review') return 'badge-warning';
    return 'badge-neutral';
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BuildingIcon size={16} color="var(--primary-on-light)" />
          Business Profile & KYC Information
        </h3>
        <span className={`badge ${getKycBadgeClass(profile?.kycStatus)}`} style={{ textTransform: 'capitalize' }}>
          KYC: {profile?.kycStatus?.replace('_', ' ') || 'Pending'}
        </span>
      </div>

      <div className="profile-grid">
        <div className="form-group">
          <label className="label">Business Owner's Full Name *</label>
          <input className="input" placeholder="e.g. Jane Doe" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label">Business Name *</label>
          <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
        </div>
      </div>

      <div className="profile-grid">
        <div className="form-group">
          <label className="label">Phone Number *</label>
          <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label">Country</label>
          <input className="input" value="Nigeria (NG)" disabled style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }} />
        </div>
      </div>


      <div className="profile-grid">
        <div className="form-group">
          <label className="label">CAC Registration Number (optional)</label>
          <input className="input" placeholder="RC-XXXXXX" value={regNumber} onChange={e => setRegNumber(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Tax Identification Number (TIN) (optional)</label>
          <input className="input" placeholder="TIN-XXXXXX" value={taxId} onChange={e => setTaxId(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Street Address *</label>
        <input className="input" placeholder="e.g. 12 Marina Street" value={address} onChange={e => setAddress(e.target.value)} required />
      </div>

      <div className="profile-grid">
        <div className="form-group">
          <label className="label">City *</label>
          <input className="input" value={city} onChange={e => setCity(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label">State *</label>
          <input className="input" value={state} onChange={e => setState(e.target.value)} required />
        </div>
      </div>

      {profile?.kycStatus !== 'verified' && (
        <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)', alignItems: 'flex-start' }}>
          <ShieldCheckIcon size={16} color="var(--primary-on-light)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Testing Note:</strong> Submitting a valid CAC, TIN, and Address will automatically verify your KYC status instantly in this Sandbox testing environment.
          </p>
        </div>
      )}

      {profile?.kycStatus === 'verified' && (
        <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(34,197,94,0.06)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)', alignItems: 'flex-start' }}>
          <CheckCircle2Icon size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--success)', lineHeight: 1.5 }}>
            Your account is verified! You can collect unlimited live payments and request payouts.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Update Profile & KYC'}
        </button>
      </div>

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </form>
  );
}
