import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export interface SetupTokenInfo {
  valid: boolean;
  subscriber: { firstName: string; lastName: string; email: string; merchantId: string };
  merchant: { businessName: string; logoUrl?: string; brandColor: string };
}

export interface CompleteSetupPayload {
  inviteToken: string;
  password: string;
  paymentMethod: 'card' | 'direct_debit' | 'virtual_account';
  cardToken?: string;
  cardLastFour?: string;
  cardExpiry?: string;
  mandateId?: string;
  orderReference?: string;
}

export interface InitiateSetupCheckoutPayload {
  inviteToken: string;
  method: 'card' | 'direct_debit';
  callbackUrl?: string;
}

export interface InitiateSetupCheckoutResult {
  checkoutLink: string;
  orderReference: string;
  isMock: boolean;
}

export interface SetupResult {
  success: boolean;
  portalToken: string;
  merchantId: string;
  message: string;
}

export const validateSetupToken = async (token: string): Promise<SetupTokenInfo> => {
  const { data } = await api.get(`/setup/validate`, { params: { token } });
  return data;
};

export const initiateSetupCheckout = async (payload: InitiateSetupCheckoutPayload): Promise<InitiateSetupCheckoutResult> => {
  const { data } = await api.post(`/setup/initiate-checkout`, payload);
  return data;
};

export const completeSetup = async (payload: CompleteSetupPayload): Promise<SetupResult> => {
  const { data } = await api.post(`/setup/complete`, payload);
  return data;
};
