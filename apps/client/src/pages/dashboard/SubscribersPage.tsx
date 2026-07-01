import { useState } from 'react';
import { Search, UserPlus, Calendar, CreditCard, Pencil, Trash2, Users, UploadCloud, CheckSquare, Send } from 'lucide-react';
import { useSubscribers } from '../../hooks/useSubscribers';
import AddSubscriberModal from '../../components/dashboard/AddSubscriberModal';
import SubscribeModal from '../../components/dashboard/SubscribeModal';
import SubscriberDetailsModal from '../../components/dashboard/SubscriberDetailsModal';
import BillingGlossary from '../../components/dashboard/BillingGlossary';
import BulkUploadModal from '../../components/dashboard/BulkUploadModal';
import BulkSubscribeModal from '../../components/dashboard/BulkSubscribeModal';
import type { Subscriber } from '../../types/subscribers.types';

export default function SubscribersPage() {
  const {
    plans,
    filteredSubscribers,
    isLoading,
    searchQuery,
    setSearchQuery,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    subscribeCustomerToPlan,
    pauseSubscription,
    cancelSubscription,
    generateVirtualAccount,
    deleteVirtualAccount,
    bulkUploadSubscribers,
    bulkSubscribeSubscribers,
    resendPortalInvite,
  } = useSubscribers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);

  // Bulk action states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkSubscribeModal, setShowBulkSubscribeModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubscribers.map(sub => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkSubscribeSubmit = async (planId: string) => {
    const success = await bulkSubscribeSubscribers(selectedIds, planId);
    if (success) {
      setSelectedIds([]);
      return true;
    }
    return false;
  };

  const openSubscribeModal = (sub: Subscriber) => {
    setSelectedSubscriber(sub);
    setShowSubscribeModal(true);
  };

  const openDetailsModal = (sub: Subscriber) => {
    setSelectedSubscriber(sub);
    setShowDetailsModal(true);
  };

  const handlePause = async (id: string) => {
    if (await pauseSubscription(id)) setShowDetailsModal(false);
  };

  const handleCancel = async (id: string) => {
    if (await cancelSubscription(id)) setShowDetailsModal(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'paused': return 'badge-warning';
      case 'cancelled':
      case 'suspended': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Subscribers
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your customer database, virtual accounts, and active subscriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowBulkUploadModal(true)}>
            <UploadCloud size={16} /> Bulk Upload (CSV)
          </button>
          <button className="btn btn-primary" onClick={() => { setSelectedSubscriber(null); setShowAddModal(true); }}>
            <UserPlus size={16} /> Add Subscriber
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 'var(--space-lg)',
      }} className="shadow-premium">
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Search subscribers by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'transparent' }}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-2xl) 0' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>No subscribers found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Add subscribers to start charging recurring payments.</p>
        </div>
      ) : (
        <div className="card table-container" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === filteredSubscribers.length && filteredSubscribers.length > 0} 
                  />
                </th>
                <th>Customer Name</th>
                <th>Contact & Virtual Account</th>
                <th>Active Plan</th>
                <th>Method</th>
                <th>Status</th>
                <th>Next Billing</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map(sub => {
                const activeSub = sub.subscriptions?.find(s =>
                  ['active', 'trial', 'past_due', 'paused'].includes(s.status.toLowerCase())
                );
                return (
                  <tr key={sub.id}>
                    <td style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(sub.id)} 
                        onChange={() => handleSelectRow(sub.id)}
                        onClick={e => e.stopPropagation()} 
                      />
                    </td>
                    <td onClick={() => openDetailsModal(sub)} style={{ cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: 'var(--link)', textDecoration: 'underline' }}>
                        {sub.firstName} {sub.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {sub.id.substring(0, 8)}...</div>
                    </td>
                    <td>
                      <div>{sub.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sub.phone}</div>
                      {sub.virtualAccountNumber ? (
                        <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 4, fontWeight: 500 }}>
                          🏦 {sub.virtualAccountNumber} ({sub.virtualAccountBank || 'Nomba Bank'})
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--error)', fontStyle: 'italic' }}>
                            No active virtual account
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: 10, alignSelf: 'flex-start', height: 'auto', minHeight: 'unset' }}
                            onClick={() => generateVirtualAccount(sub.id)}
                          >
                            Generate VA
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {activeSub?.plan ? (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{activeSub.plan.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            ₦{Number(activeSub.finalAmount).toLocaleString()}/{activeSub.plan.frequency}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No Active Plan</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                        <CreditCard size={11} /> {sub.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(sub.status)}`}>{sub.status}</span>
                    </td>
                    <td>
                      {sub.nextBillingDate ? (
                        <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} className="text-secondary" />
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {!activeSub && (
                          <button className="btn btn-secondary btn-sm" onClick={() => openSubscribeModal(sub)}>
                            Subscribe
                          </button>
                        )}
                        {/* Resend Setup Link — shown when subscriber hasn't completed portal setup */}
                        {!sub.cardToken && !sub.mandateId && !sub.virtualAccountNumber && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => resendPortalInvite(sub.id)}
                            title="Resend setup link to subscriber"
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Send size={13} /> Resend Link
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSubscriber(sub);
                            setShowAddModal(true);
                          }}
                          title="Edit Subscriber"
                          style={{ color: 'var(--text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteSubscriber(sub.id)}
                          title="Delete Subscriber"
                          style={{ color: 'var(--error)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Billing Terminology Glossary */}
      <BillingGlossary />

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          zIndex: 100,
        }} className="animate-slide-up">
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            <CheckSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--link)' }} />
            {selectedIds.length} subscriber(s) selected
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowBulkSubscribeModal(true)}
              style={{ padding: '6px 12px', fontSize: 13, height: 'auto', minHeight: 'unset' }}
            >
              Attach to Plan
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedIds([])}
              style={{ padding: '6px 12px', fontSize: 13, height: 'auto', minHeight: 'unset' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddSubscriberModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedSubscriber(null); }}
        onSubmit={selectedSubscriber ? (payload) => updateSubscriber(selectedSubscriber.id, payload) : addSubscriber}
        subscriber={selectedSubscriber}
      />
      <SubscribeModal isOpen={showSubscribeModal} onClose={() => setShowSubscribeModal(false)} subscriber={selectedSubscriber} plans={plans} onSubmit={subscribeCustomerToPlan} />
      <SubscriberDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedSubscriber(null); }}
        subscriber={filteredSubscribers.find(s => s.id === selectedSubscriber?.id) || selectedSubscriber}
        onPause={handlePause}
        onCancel={handleCancel}
        onGenerateVirtualAccount={generateVirtualAccount}
        onDeleteVirtualAccount={deleteVirtualAccount}
      />
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSubmit={bulkUploadSubscribers}
      />
      <BulkSubscribeModal
        isOpen={showBulkSubscribeModal}
        onClose={() => setShowBulkSubscribeModal(false)}
        selectedCount={selectedIds.length}
        plans={plans}
        onSubmit={handleBulkSubscribeSubmit}
      />
    </div>
  );
}
