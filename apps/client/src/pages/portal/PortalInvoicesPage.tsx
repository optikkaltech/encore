import { usePortalInvoices } from '../../hooks/usePortal';

const statusStyles: Record<string, { bg: string; text: string }> = {
  paid:  { bg: '#dcfce7', text: '#16a34a' },
  sent:  { bg: '#dbeafe', text: '#1d4ed8' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  void:  { bg: '#fee2e2', text: '#dc2626' },
};

const fmt = (n: number, c = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Portal Invoices Page — lists all invoices with one-click PDF download.
 * Uses standard system CSS variables for colors, ensuring consistency.
 */
export default function PortalInvoicesPage() {
  const { invoices, loading, downloading, downloadInvoice } = usePortalInvoices();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading invoices...</div>;
  }

  return (
    <div>
      <style>{`
        .portal-invoice-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.15s;
        }
        .portal-invoice-card:hover {
          box-shadow: var(--shadow-md);
        }
        .portal-invoice-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        @media (max-width: 600px) {
          .portal-invoice-card {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .portal-invoice-right {
            flex-wrap: wrap;
            gap: 10px;
            justify-content: space-between;
          }
          .portal-invoice-amount {
            min-width: unset !important;
            text-align: left !important;
          }
          .portal-invoice-download {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Invoices</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Download PDF copies of your billing invoices</p>
      </div>

      {invoices.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No invoices yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invoices.map(inv => {
            const sc = statusStyles[inv.status] || { bg: '#f3f4f6', text: '#6b7280' };
            const isDownloading = downloading === inv.id;
            return (
              <div key={inv.id} className="portal-invoice-card">
                {/* Left: icon + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    color: 'var(--accent-primary)',
                  }}>
                    🧾
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {inv.invoiceNumber}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {fmtDate(inv.paidAt || inv.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: status + amount + download */}
                <div className="portal-invoice-right">
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: sc.bg, color: sc.text, whiteSpace: 'nowrap',
                  }}>
                    {inv.status.toUpperCase()}
                  </span>
                  <span className="portal-invoice-amount" style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                    minWidth: 110, textAlign: 'right', whiteSpace: 'nowrap',
                  }}>
                    {fmt(inv.totalAmount, inv.currency)}
                  </span>
                  <button
                    id={`download-${inv.id}`}
                    className="btn btn-secondary btn-sm portal-invoice-download"
                    onClick={() => downloadInvoice(inv.id)}
                    disabled={isDownloading}
                    style={{
                      border: '1px solid var(--border-primary)',
                      cursor: isDownloading ? 'wait' : 'pointer',
                      opacity: isDownloading ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isDownloading ? 'Saving...' : '↓ PDF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
