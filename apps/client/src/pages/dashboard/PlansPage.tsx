import { useState } from 'react';
import { Plus, Search, Trash2, ToggleLeft, ToggleRight, Link, Pencil, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePlans } from '../../hooks/usePlans';
import CreatePlanModal from '../../components/dashboard/CreatePlanModal';
import BillingGlossary from '../../components/dashboard/BillingGlossary';
import type { Plan } from '../../types/plans.types';

export default function PlansPage() {
  const {
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    createPlan,
    updatePlan,
    togglePlanStatus,
    deletePlan,
  } = usePlans();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Billing Plans
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage pricing models for your recurring subscriptions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedPlan(null); setShowCreateModal(true); }}>
          <Plus size={16} />
          Create Plan
        </button>
      </div>

      {/* Filter / Search Bar */}
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
          placeholder="Search plans by name or code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: 'var(--text-primary)',
            background: 'transparent',
          }}
        />
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-2xl) 0' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Package size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {searchQuery ? 'No plans found' : 'No plans created yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            {searchQuery ? 'Try adjusting your search filters.' : 'Billing plans let you automate payment schedules.'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create your first plan
            </button>
          )}
        </div>
      ) : (
        <div className="card table-container" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Plan Details</th>
                <th>Price</th>
                <th>Billing Cycle</th>
                <th>Setup / Trial</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => (
                <tr key={plan.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{plan.code}</div>
                    {plan.isUsageBased && (
                      <span className="badge badge-info" style={{ fontSize: 10, marginTop: 4 }}>
                        Usage: {plan.currency} {plan.usageRate}/{plan.usageMetric}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {plan.currency} {Number(plan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {plan.frequency}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {plan.trialDays > 0 ? `${plan.trialDays}d trial` : 'No trial'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {plan.setupFee > 0 ? `+${plan.currency} ${plan.setupFee.toLocaleString()} setup` : 'No setup fee'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {plan.isProrated ? 'Prorated upgrades' : 'No proration'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-error'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/checkout/${plan.id}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Checkout link copied!');
                        }}
                        title="Copy Checkout Link"
                        style={{ color: 'var(--text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Link size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowCreateModal(true);
                        }}
                        title="Edit Plan"
                        style={{ color: 'var(--text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => togglePlanStatus(plan)}
                        title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                        style={{ color: plan.isActive ? 'var(--text-secondary)' : 'var(--success)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {plan.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        title="Delete Plan"
                        style={{ color: 'var(--error)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal Overlay */}
      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedPlan(null); }}
        onSubmit={selectedPlan ? (payload) => updatePlan(selectedPlan.id, payload) : createPlan}
        plan={selectedPlan}
      />

      {/* Shared Billing Terminology Glossary */}
      <BillingGlossary />
    </div>
  );
}
