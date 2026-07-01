import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export interface CheckoutPlan {
  planId: string;
  planName: string;
  description: string;
  amount: number;
  currency: string;
  frequency: string;
  trialDays: number;
  setupFee: number;
  merchant: {
    merchantId: string;
    businessName: string;
    logoUrl?: string;
    brandColor: string;
  };
}

export interface SelfEnrollPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const getCheckoutPlan = async (planId: string): Promise<CheckoutPlan> => {
  const { data } = await api.get(`/checkout/${planId}`);
  return data;
};

export const selfEnroll = async (planId: string, payload: SelfEnrollPayload): Promise<{ message: string }> => {
  const { data } = await api.post(`/checkout/${planId}`, payload);
  return data;
};
