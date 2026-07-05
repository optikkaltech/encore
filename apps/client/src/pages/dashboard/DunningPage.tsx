import { useState } from 'react';
import { Search, RefreshCw, XOctagon, Calendar, History } from 'lucide-react';
import { useDunning } from '../../hooks/useDunning';
import type { DunningLog } from '../../api/dunning.api';

export default function DunningPage() {
  const { filteredLogs, isLoading, searchQuery, setSearchQuery, triggerRetry, triggerSuspend } = useDunning();
  const [selectedLog, setSelectedLog] = useState<DunningLog | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_progress': return 'badge-warning';
      case 'recovered': return 'badge-success';
      case 'failed': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Failed Payment Recovery (Dunning)
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track automated billing retries and email alert sequences for past-due subscribers.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 12, marginBottom: 'var(--space-lg)' }} className="shadow-premium">
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Search by customer name, email, or invoice number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'transparent' }}
        />
      </div>

      {/* Main Grid */}
      <div className="dunning-grid">
        {/* Left: Dunning table */}
        <div className="card table-container" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><div className="spinner spinner-lg"></div></div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No failed recovery records found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Retries</th>
                  <th>Status</th>
                  <th>Next Attempt</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer', background: selectedLog?.id === log.id ? 'var(--bg-secondary)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.subscriber?.firstName} {log.subscriber?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.subscriber?.email}</div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace' }}>#{log.invoice?.invoiceNumber.substring(0, 12)}</span></td>
                    <td style={{ fontWeight: 500 }}>₦{Number(log.amount).toLocaleString()}</td>
                    <td><span className="badge badge-neutral">{log.attemptCount} / 3</span></td>
                    <td><span className={`badge ${getStatusBadge(log.status)}`}>{log.status.replace('_', ' ')}</span></td>
                    <td>
                      {log.nextAttemptAt ? (
                        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} className="text-secondary" />
                          {new Date(log.nextAttemptAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {log.status === 'in_progress' && (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => triggerRetry(log.id)} title="Retry Charge Now">
                            <RefreshCw size={12} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => triggerSuspend(log.id)} title="Cancel & Suspend Customer">
                            <XOctagon size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Timeline Audit Log */}
        {selectedLog && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} className="text-secondary" />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recovery Timeline</h3>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 350 }}>
              {selectedLog.timeline?.map((step, index) => (
                <div key={index} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 4 }}></div>
                    {index < selectedLog.timeline!.length - 1 && <div style={{ flex: 1, width: 1, background: 'var(--border-light)', margin: '4px 0' }}></div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{step.action.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{step.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(step.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dunning-grid {
          display: grid;
          grid-template-columns: ${selectedLog ? '1.5fr 1fr' : '1fr'};
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .dunning-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
