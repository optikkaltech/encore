import type { Invoice } from '../../types/billing.types';
import { Download, FileText, Calendar, User } from 'lucide-react';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onDownload: (id: string, invoiceNumber: string) => void;
}

export default function InvoiceDetailsModal({ isOpen, onClose, invoice, onDownload }: InvoiceDetailsModalProps) {
  if (!isOpen || !invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="badge badge-success">Paid</span>;
      case 'sent':
        return <span className="badge badge-info">Sent</span>;
      case 'void':
        return <span className="badge badge-error">Void</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText className="text-secondary" size={20} />
            <h2 className="modal-title" style={{ margin: 0 }}>Invoice Details</h2>
          </div>
          {getStatusBadge(invoice.status)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice Number</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                {invoice.invoiceNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billing Date</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} />
                {new Date(invoice.createdAt).toLocaleDateString()}
              </div>
              {invoice.paidAt && (
                <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>
                  Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} />
                {invoice.customerName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{invoice.customerEmail}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Details</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                Method: {invoice.paymentMethod.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Items</div>
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11 }}>Description</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, width: 60, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, width: 100, textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, width: 120, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{item.description}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                        ₦{Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 500 }}>
                        ₦{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-end', width: 220, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                ₦{Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                <span style={{ color: 'var(--error)' }}>
                  -₦{Number(invoice.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax:</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  ₦{Number(invoice.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 6, fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total:</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {invoice.currency} {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              padding: 12,
              borderLeft: '3px solid var(--border-light)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Notes:</div>
              {invoice.notes}
            </div>
          )}

          {/* Actions */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => onDownload(invoice.id, invoice.invoiceNumber)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
