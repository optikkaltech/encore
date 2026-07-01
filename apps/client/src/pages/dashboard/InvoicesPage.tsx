import { useState } from 'react';
import { Search, FileText, Plus, RefreshCw, Eye, Download } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import { useSubscribers } from '../../hooks/useSubscribers';
import CreateInvoiceModal from '../../components/dashboard/CreateInvoiceModal';
import InvoiceDetailsModal from '../../components/dashboard/InvoiceDetailsModal';
import BillingGlossary from '../../components/dashboard/BillingGlossary';
import type { Invoice } from '../../types/billing.types';

export default function InvoicesPage() {
  const {
    filteredInvoices,
    isLoading,
    invSearchQuery,
    setInvSearchQuery,
    invStatusFilter,
    setInvStatusFilter,
    createInvoice,
    downloadInvoice,
    refreshAll,
  } = useBilling();

  const { subscribers } = useSubscribers();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const openDetailsModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'badge-success';
      case 'sent':
        return 'badge-info';
      case 'void':
        return 'badge-error';
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
            Invoices
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage billing records, issue manual invoices, and download customer receipts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={refreshAll} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 'var(--space-lg)',
      }} className="shadow-premium">
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name or email..."
            value={invSearchQuery}
            onChange={e => setInvSearchQuery(e.target.value)}
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
            value={invStatusFilter}
            onChange={e => setInvStatusFilter(e.target.value as any)}
            style={{ padding: '6px 12px', fontSize: 13, width: 'auto', height: 'auto', minHeight: 'unset' }}
          >
            <option value="all">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-2xl) 0' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <FileText size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            No invoices found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            {invSearchQuery || invStatusFilter !== 'all'
              ? 'Try adjusting your search filters.'
              : 'Create a manual invoice or subscribe a customer to generate billing records.'}
          </p>
          {!invSearchQuery && invStatusFilter === 'all' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create your first invoice
            </button>
          )}
        </div>
      ) : (
        <div className="card table-container" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Billing Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td style={{ fontWeight: 600 }}>
                    {invoice.invoiceNumber}
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {invoice.customerName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {invoice.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {invoice.currency} {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>
                    {invoice.paymentMethod.replace('_', ' ')}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => openDetailsModal(invoice)}
                        className="btn btn-secondary btn-sm"
                        title="View Details"
                        style={{ padding: 6 }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                        className="btn btn-secondary btn-sm"
                        title="Download PDF"
                        style={{ padding: 6 }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createInvoice}
        subscribers={subscribers}
      />

      {/* Details Modal */}
      <InvoiceDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        onDownload={downloadInvoice}
      />

      {/* Glossary */}
      <BillingGlossary />
    </div>
  );
}
