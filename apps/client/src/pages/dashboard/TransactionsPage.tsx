import { useState } from 'react';
import { Search, CreditCard, ArrowLeftRight, RefreshCw, Eye } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import TransactionDetailsModal from '../../components/dashboard/TransactionDetailsModal';
import BillingGlossary from '../../components/dashboard/BillingGlossary';
import type { Transaction } from '../../types/billing.types';

export default function TransactionsPage() {
  const {
    filteredTransactions,
    isLoading,
    txnSearchQuery,
    setTxnSearchQuery,
    txnStatusFilter,
    setTxnStatusFilter,
    txnTypeFilter,
    setTxnTypeFilter,
    refreshAll,
  } = useBilling();

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const openDetailsModal = (txn: Transaction) => {
    setSelectedTxn(txn);
    setShowDetailsModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'badge-success';
      case 'pending':
      case 'processing':
      case 'retrying':
        return 'badge-warning';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'subscription':
        return 'badge-info';
      case 'setup_fee':
        return 'badge-neutral';
      case 'one_time':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and search all payment attempts, status updates, and reconciliation audits.</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshAll} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
        marginBottom: 'var(--space-lg)',
      }} className="shadow-premium">
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            placeholder="Search by subscriber, ref, invoice #..."
            value={txnSearchQuery}
            onChange={e => setTxnSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--text-primary)',
              background: 'transparent',
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
          <select
            className="input"
            value={txnStatusFilter}
            onChange={e => setTxnStatusFilter(e.target.value as any)}
            style={{ padding: '6px 12px', fontSize: 13, width: 'auto', height: 'auto', minHeight: 'unset' }}
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Type:</span>
          <select
            className="input"
            value={txnTypeFilter}
            onChange={e => setTxnTypeFilter(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 13, width: 'auto', height: 'auto', minHeight: 'unset' }}
          >
            <option value="all">All Types</option>
            <option value="subscription">Subscription</option>
            <option value="setup_fee">Setup Fee</option>
            <option value="one_time">One-time</option>
            <option value="usage_charge">Usage Charge</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-2xl) 0' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ArrowLeftRight size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            No transactions found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {txnSearchQuery || txnStatusFilter !== 'all' || txnTypeFilter !== 'all'
              ? 'Try adjusting your search filters.'
              : 'Payments will appear here once they are initiated.'}
          </p>
        </div>
      ) : (
        <div className="card table-container" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date & ID</th>
                <th>Subscriber</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Reference</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(txn => (
                <tr key={txn.id}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ID: {txn.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td>
                    {txn.subscriber ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {txn.subscriber.firstName} {txn.subscriber.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {txn.subscriber.email}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unknown</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getTypeBadgeClass(txn.type)}`} style={{ textTransform: 'capitalize' }}>
                      {txn.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {txn.currency} {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                      <CreditCard size={11} className="text-secondary" />
                      {txn.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {txn.nombaReference ? (
                      <span title={txn.nombaReference}>
                        {txn.nombaReference.substring(0, 12)}...
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openDetailsModal(txn)}
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                      style={{ padding: 6 }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      <TransactionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedTxn(null); }}
        transaction={selectedTxn}
      />

      {/* Glossary */}
      <BillingGlossary />
    </div>
  );
}
