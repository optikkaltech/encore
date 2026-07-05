import { useState, useEffect, useRef } from 'react';
import { X, Banknote, AlertCircle, Loader2 } from 'lucide-react';
import {
  getPayoutBanks,
  resolvePayoutAccount,
  type PayoutBalance,
  type CreatePayoutPayload,
} from '../../../api/payouts.api';
import { getMerchantProfile } from '../../../api/settings.api';
import SearchableBankSelect from './SearchableBankSelect';

interface Props {
  balance: PayoutBalance | null;
  submitting: boolean;
  onSubmit: (payload: CreatePayoutPayload) => Promise<boolean>;
  onClose: () => void;
}

const PAYOUT_FEE = 50;

export default function PayoutRequestModal({ balance, submitting, onSubmit, onClose }: Props) {
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [notes, setNotes] = useState('');

  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const initialRef = useRef<{ bankCode: string; accountNumber: string; accountName: string } | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const net = Math.max(0, numAmount - PAYOUT_FEE);
  const available = balance?.availableBalance || 0;
  const insufficient = numAmount > available;
  const tooSmall = numAmount > 0 && net <= 0;

  // Fetch bank list on mount
  useEffect(() => {
    getPayoutBanks()
      .then((data) => {
        setBanks(data);
      })
      .catch((err) => {
        console.error('Failed to load banks', err);
      })
      .finally(() => {
        setLoadingBanks(false);
      });
  }, []);

  // Fetch saved payout bank details on mount
  useEffect(() => {
    getMerchantProfile()
      .then((profile) => {
        const savedBank = profile?.settings?.payoutBankAccount;
        if (savedBank) {
          initialRef.current = {
            bankCode: savedBank.bankCode || '',
            accountNumber: savedBank.accountNumber || '',
            accountName: savedBank.accountName || '',
          };
          setBankCode(savedBank.bankCode || '');
          setBankName(savedBank.bankName || '');
          setAccountNumber(savedBank.accountNumber || '');
          setAccountName(savedBank.accountName || '');
        }
      })
      .catch((err) => {
        console.error('Failed to load merchant profile settings', err);
      });
  }, []);

  // Auto-resolve account name
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      // Check if we are matching the saved pre-populated details
      if (
        initialRef.current &&
        initialRef.current.accountNumber === accountNumber &&
        initialRef.current.bankCode === bankCode
      ) {
        setAccountName(initialRef.current.accountName);
        return;
      }

      setResolvingAccount(true);
      setResolveError('');
      resolvePayoutAccount(accountNumber, bankCode)
        .then((data) => {
          setAccountName(data.accountName);
        })
        .catch((err) => {
          setResolveError(
            err.response?.data?.message || 'Failed to resolve account name. Verify bank and account number.',
          );
          setAccountName('');
        })
        .finally(() => {
          setResolvingAccount(false);
        });
    } else {
      setAccountName('');
      setResolveError('');
    }
  }, [accountNumber, bankCode]);


  const handleBankChange = (code: string) => {
    setBankCode(code);
    setBankName(banks.find((b) => b.code === code)?.name || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !bankCode || !accountNumber || !accountName) return;
    const ok = await onSubmit({
      amount: numAmount,
      bankCode,
      bankName,
      bankAccountNumber: accountNumber,
      bankAccountName: accountName,
      notes: notes || undefined,
    });
    if (ok) onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={22} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Request Payout</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Available: <strong style={{ color: 'var(--success)' }}>
                ₦{available.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Amount */}
          <div className="form-group">
            <label className="label">Amount (₦) *</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 50000"
              value={amount}
              min={51}
              max={available}
              step="0.01"
              onChange={e => setAmount(e.target.value)}
              required
            />
            {numAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform fee: ₦{PAYOUT_FEE}</span>
                <span style={{ fontWeight: 600, color: tooSmall || insufficient ? 'var(--destructive)' : 'var(--success)' }}>
                  You receive: ₦{net.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {insufficient && <p style={{ color: 'var(--destructive)', fontSize: 12, marginTop: 4 }}>Amount exceeds available balance</p>}
            {tooSmall && <p style={{ color: 'var(--destructive)', fontSize: 12, marginTop: 4 }}>Amount must be greater than the ₦{PAYOUT_FEE} fee</p>}
          </div>

          {/* Bank */}
          <div className="form-group">
            <label className="label">Bank *</label>
            <SearchableBankSelect
              banks={banks}
              selectedCode={bankCode}
              onChange={handleBankChange}
              disabled={loadingBanks}
            />
          </div>


          {/* Account Number */}
          <div className="form-group">
            <label className="label">Account Number *</label>
            <input
              className="input"
              placeholder="10-digit NUBAN"
              value={accountNumber}
              maxLength={10}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {/* Account Name */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="label">Account Name *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder={resolvingAccount ? 'Resolving name...' : 'As it appears on your bank'}
                value={accountName}
                readOnly
                required
                style={{
                  background: 'var(--bg-secondary)',
                  cursor: 'not-allowed',
                  paddingRight: resolvingAccount ? 36 : 12,
                }}
              />
              {resolvingAccount && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    color: 'var(--primary)',
                  }}
                />
              )}
            </div>
            {resolveError && (
              <p style={{ color: 'var(--destructive)', fontSize: 12, marginTop: 4 }}>
                {resolveError}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              placeholder="Internal reference or memo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Info */}
          <div style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
            <AlertCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A ₦50 platform fee is deducted from each payout. Transfers are processed via Nomba and typically settle within minutes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={submitting || insufficient || tooSmall || !bankCode || !accountNumber || !accountName}
            >
              {submitting ? 'Processing…' : `Withdraw ₦${net > 0 ? net.toLocaleString('en-NG') : '—'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
