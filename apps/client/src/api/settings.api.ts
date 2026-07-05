import client from './client';

export interface MerchantSettings {
  notifications: { email: boolean; sms: boolean };
  billing: { autoRetry: boolean; retryAttempts: number };
  webhookUrl: string | null;
  webhookSecret: string | null;
}

export interface MerchantProfile {
  id: string;
  merchantCode: string;
  businessName: string;
  email: string;
  status: string;
  kycStatus: string;
  accountType: string;
  pricingTier: string;
  maxSubscribers: number;
  currentSubscriberCount: number;
  transactionFeeRate: number;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  platformFeeBalance: number;
  brandLogoUrl: string | null;
  brandPrimaryColor: string | null;
  customDomain: string | null;
  webhookUrl: string | null;
  phone: string;
  registrationNumber: string | null;
  taxId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  settings: any;
}

export interface UpdateSettingsPayload {
  webhookUrl?: string;
  webhookSecret?: string;
  notifications?: { email?: boolean; sms?: boolean };
  billing?: { autoRetry?: boolean; retryAttempts?: number };
  payoutBankAccount?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface UpdateBrandingPayload {
  brandLogoUrl?: string;
  brandPrimaryColor?: string;
  customDomain?: string;
}

export const getMerchantProfile = async (): Promise<MerchantProfile> => {
  const { data } = await client.get('/merchants/me');
  return data.data;
};

export const getMerchantSettings = async (): Promise<MerchantSettings> => {
  const { data } = await client.get('/merchants/me/settings');
  return data.data;
};

export const updateMerchantSettings = async (payload: UpdateSettingsPayload): Promise<void> => {
  await client.patch('/merchants/me/settings', payload);
};

export const updateMerchantBranding = async (payload: UpdateBrandingPayload): Promise<void> => {
  await client.patch('/merchants/me/branding', payload);
};

export const updateMerchantProfile = async (payload: {
  businessName?: string;
  phone?: string;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}): Promise<void> => {
  await client.patch('/merchants/me/profile', payload);
};

export const selectMerchantTier = async (tier: string): Promise<void> => {
  await client.post('/merchants/select-tier', { tier });
};

