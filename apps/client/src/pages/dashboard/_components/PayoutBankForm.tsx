import { useState, useEffect } from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import { getPayoutBanks, resolvePayoutAccount } from '../../../api/payouts.api';
import SearchableBankSelect from './SearchableBankSelect';
import type { MerchantProfile } from '../../../api/settings.api';

interface Props {
  profile: MerchantProfile | null;
  saving: boolean;
  onSave: (payload: any) => Promise<boolean>;
}

export default function PayoutBankForm({ profile, saving, onSave }: Props) {
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolveError, setResolveError] = useState('');

  // Initial populate from profile settings
  useEffect(() => {
    const savedBank = profile?.settings?.payoutBankAccount;
    if (savedBank) {
      setBankCode(savedBank.bankCode || '');
      setBankName(savedBank.bankName || '');
      setAccountNumber(savedBank.accountNumber || '');
      setAccountName(savedBank.accountName || '');
    }
  }, [profile]);

  // Load banks
  useEffect(() => {
    getPayoutBanks()
      .then(setBanks)
      .catch(err => console.error('Failed to load banks', err))
      .finally(() => setLoadingBanks(false));
  }, []);

  // Name inquiry lookup
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      setResolvingAccount(true);
      setResolveError('');
      resolvePayoutAccount(accountNumber, bankCode)
        .then(data => {
          setAccountName(data.accountName);
        })
        .catch(err => {
          setResolveError(err.response?.data?.message || 'Failed to resolve account name.');
          setAccountName('');
        })
        .finally(() => {
          setResolvingAccount(false);
        });
    }
  }, [accountNumber, bankCode]);

  const handleBankChange = (code: string) => {
    setBankCode(code);
    setBankName(banks.find(b => b.code === code)?.name || '');
    setAccountName('');
    setResolveError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankCode || !accountNumber || !accountName) return;
    onSave({
      payoutBankAccount: {
        bankCode,
        bankName,
        accountNumber,
        accountName,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Banknote size={16} color="var(--primary)" />
          Payout Settlement Bank Details
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Specify the bank account where your revenue disbursements will be settled automatically.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="label">Settlement Bank *</label>
          <SearchableBankSelect
            banks={banks}
            selectedCode={bankCode}
            onChange={handleBankChange}
            disabled={loadingBanks}
          />
        </div>
        <div className="form-group">
          <label className="label">Account Number *</label>
          <input
            className="input"
            maxLength={10}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
      </div>

      <div className="form-group" style={{ position: 'relative' }}>
        <label className="label">Verified Account Name *</label>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder={resolvingAccount ? 'Resolving account holder name...' : 'Auto-populated on account number lookup'}
            value={accountName}
            readOnly
            required
            style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed', paddingRight: resolvingAccount ? 36 : 12 }}
          />
          {resolvingAccount && (
            <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 12, top: 12, color: 'var(--primary)' }} />
          )}
        </div>
        {resolveError && <p style={{ color: 'var(--destructive)', fontSize: 12, marginTop: 4 }}>{resolveError}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || !accountName || resolvingAccount}>
          {saving ? 'Saving...' : 'Save Settlement Details'}
        </button>
      </div>
    </form>
  );
}
