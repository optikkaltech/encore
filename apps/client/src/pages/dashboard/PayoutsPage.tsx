import { useState } from 'react';
import { Banknote, RefreshCw, Plus } from 'lucide-react';
import { usePayouts } from '../../hooks/usePayouts';
import PayoutsStats from './_components/PayoutsStats';
import PayoutsTable from './_components/PayoutsTable';
import PayoutRequestModal from './_components/PayoutRequestModal';

export default function PayoutsPage() {
  const { balance, payouts, loading, submitting, cancelling, requestPayout, cancelPayout, refresh } = usePayouts();
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Banknote size={24} color="var(--primary)" />
            Payouts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Withdraw your collected subscription revenue directly to your bank account.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={!balance || balance.availableBalance <= 50}
          >
            <Plus size={16} />
            Request Payout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <PayoutsStats balance={balance} loading={loading} />

      {/* Payout History Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Payout History</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{payouts.length} {payouts.length === 1 ? 'record' : 'records'}</span>
        </div>
        <PayoutsTable payouts={payouts} loading={loading} cancelling={cancelling} onCancel={cancelPayout} />
      </div>

      {/* Ledger note */}
      {!loading && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Balance is computed from a double-entry accounting ledger. Every credit and debit is immutably recorded.
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <PayoutRequestModal
          balance={balance}
          submitting={submitting}
          onSubmit={requestPayout}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
