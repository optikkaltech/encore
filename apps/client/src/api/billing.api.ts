import client from './client';
import type { Transaction, Invoice, CreateInvoicePayload } from '../types/billing.types';

export const billingApi = {
  getTransactions: async (): Promise<Transaction[]> => {
    const { data } = await client.get('/billing/transactions');
    return data.data || [];
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const { data } = await client.get('/billing/invoices');
    return data.data || [];
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<{ success: boolean; data: Invoice; message: string }> => {
    const { data } = await client.post('/billing/invoices', payload);
    return data;
  },

  downloadInvoice: async (id: string, invoiceNumber: string): Promise<void> => {
    const response = await client.get(`/billing/invoices/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
export default billingApi;
