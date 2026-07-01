import type { Subscriber } from './subscribers.types';

export type TransactionType = 'subscription' | 'setup_fee' | 'usage_charge' | 'one_time' | 'refund';

export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'retrying' | 'refunded';

export interface Transaction {
  id: string;
  merchantId: string;
  subscriberId: string;
  subscriptionId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string;
  nombaReference?: string;
  nombaTransactionId?: string;
  processedAt?: string | null;
  invoiceId?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
  subscriber?: Subscriber;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type?: 'subscription' | 'setup_fee' | 'usage' | 'discount';
}

export interface Invoice {
  id: string;
  merchantId: string;
  invoiceNumber: string;
  subscriberId: string;
  customerEmail: string;
  customerName: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  transactionId?: string;
  paidAt?: string | null;
  paymentMethod: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  subscriber?: Subscriber;
}

export interface CreateInvoiceLineItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoicePayload {
  subscriberId: string;
  lineItems: CreateInvoiceLineItemPayload[];
  currency?: string;
  notes?: string;
}
