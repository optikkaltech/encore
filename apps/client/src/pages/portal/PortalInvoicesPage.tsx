import { usePortalInvoices } from '../../hooks/usePortal';
import { usePortalStore } from '../../store/portal.store';

/**
 * Portal Invoices Page — lists all invoices with one-click PDF download.
 */
export default function PortalInvoicesPage() {
  const { invoices, loading, downloading, downloadInvoice } = usePortalInvoices();
  const { config } = usePortalStore();
  const brandColor = config?.brandColor || '#7c3aed';

  const formatCurrency = (n: number, c = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusStyles: Record<string, { bg: string; text: string }> = {
    paid: { bg: '#dcfce7', text: '#16a34a' },
    sent: { bg: '#dbeafe', text: '#1d4ed8' },
    draft: { bg: '#f3f4f6', text: '#6b7280' },
    void: { bg: '#fee2e2', text: '#dc2626' },
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading invoices...</div>;
  }

  return (
    <div>
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
              <div key={inv.id} className="card" style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  {/* Invoice icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: `${brandColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: brandColor, fontSize: 18,
                  }}>
                    🧾
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {inv.invoiceNumber}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDate(inv.paidAt || inv.createdAt)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: sc.bg, color: sc.text,
                  }}>
                    {inv.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', minWidth: 120, textAlign: 'right' }}>
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </span>
                  <button
                    id={`download-${inv.id}`}
                    onClick={() => downloadInvoice(inv.id)}
                    disabled={isDownloading}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: `1px solid ${brandColor}`,
                      background: 'transparent', color: brandColor,
                      fontSize: 13, fontWeight: 600, cursor: isDownloading ? 'wait' : 'pointer',
                      opacity: isDownloading ? 0.7 : 1, transition: 'all 0.15s',
                    }}
                  >
                    {isDownloading ? 'Downloading...' : '↓ PDF'}
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
