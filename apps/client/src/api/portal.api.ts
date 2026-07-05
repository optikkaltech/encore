import axios from 'axios';
import type {
  PortalProfile,
  PortalInvoice,
  PortalPayment,
  PortalConfig,
  UpdatePaymentMethodPayload,
  PortalSubscriber,
} from '../types/portal.types';

// Isolated API client for portal — reads portalToken from sessionStorage
const portalClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

portalClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('portal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('portal_token');
      sessionStorage.removeItem('portal_subscriber');
      window.location.href = '/portal/login';
    }
    return Promise.reject(err);
  },
);

// ── Auth ────────────────────────────────────────────────────────────────
export const portalLogin = async (
  email: string,
  password: string,
  merchantId?: string,
): Promise<any> => {
  const { data } = await portalClient.post('/portal/auth/login', { email, password, merchantId });
  return data;
};

export const portalSetPassword = async (inviteToken: string, password: string): Promise<void> => {
  await portalClient.post('/portal/auth/set-password', { inviteToken, password });
};

export const portalGetMe = async (): Promise<PortalSubscriber> => {
  const { data } = await portalClient.get('/portal/auth/me');
  return data;
};

// ── Profile & Plan ───────────────────────────────────────────────────────
export const portalGetProfile = async (): Promise<PortalProfile> => {
  const { data } = await portalClient.get('/portal/me');
  return data;
};

// ── Invoices ─────────────────────────────────────────────────────────────
export const portalGetInvoices = async (): Promise<PortalInvoice[]> => {
  const { data } = await portalClient.get('/portal/invoices');
  return data;
};

export const portalDownloadInvoice = async (invoiceId: string): Promise<void> => {
  const token = sessionStorage.getItem('portal_token');
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const res = await fetch(`${base}/portal/invoices/${invoiceId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download invoice');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Payments ─────────────────────────────────────────────────────────────
export const portalGetPayments = async (): Promise<PortalPayment[]> => {
  const { data } = await portalClient.get('/portal/payments');
  return data;
};

// ── Payment Method ────────────────────────────────────────────────────────
export const portalUpdatePaymentMethod = async (payload: UpdatePaymentMethodPayload): Promise<void> => {
  await portalClient.patch('/portal/payment-method', payload);
};

// ── Subscription ──────────────────────────────────────────────────────────
export const portalPauseSubscription = async (): Promise<{ message: string }> => {
  const { data } = await portalClient.post('/portal/subscription/pause');
  return data;
};

export const portalCancelSubscription = async (): Promise<{ message: string }> => {
  const { data } = await portalClient.post('/portal/subscription/cancel');
  return data;
};

// ── Transaction Retry Payment ──────────────────────────────────────────────
export const portalPayTransaction = async (transactionId: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await portalClient.post(`/portal/payments/${transactionId}/pay`);
  return data;
};

// ── Branding Config ───────────────────────────────────────────────────────
export const portalGetConfig = async (merchantId: string): Promise<PortalConfig> => {
  const { data } = await portalClient.get(`/portal/config/${merchantId}`);
  return data;
};
