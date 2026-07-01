/**
 * Subscriber portal types — isolated from merchant dashboard types.
 */

export interface PortalSubscriber {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  merchantId: string;
  lastPortalLoginAt?: string;
}

export interface PortalActivePlan {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  frequency: string;
  status: string;
  currentPeriodEnd: string;
}

export interface PortalProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  paymentMethod: string;
  cardLastFour?: string;
  cardExpiry?: string;
  bankName?: string;
  nextBillingDate?: string;
  lastBillingDate?: string;
  activePlan: PortalActivePlan | null;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void';
  paidAt?: string;
  createdAt: string;
}

export interface PortalPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  type: string;
  invoiceNumber?: string;
  processedAt?: string;
  createdAt: string;
}

export interface PortalConfig {
  merchantId: string;
  businessName: string;
  logoUrl?: string;
  brandColor: string;
  poweredBy: boolean;
}

export interface UpdatePaymentMethodPayload {
  paymentMethod: 'card' | 'direct_debit';
  cardToken?: string;
  cardLastFour?: string;
  cardExpiry?: string;
  mandateId?: string;
}
