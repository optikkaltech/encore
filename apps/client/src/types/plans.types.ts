export const BillingFrequency = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUAL: 'semi_annual',
  ANNUAL: 'annual',
  CUSTOM: 'custom',
} as const;

export type BillingFrequency = typeof BillingFrequency[keyof typeof BillingFrequency];

export interface Plan {
  id: string;
  name: string;
  code: string;
  description?: string;
  amount: number;
  frequency: string;
  currency: string;
  trialDays: number;
  setupFee: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  isProrated: boolean;
  isUsageBased: boolean;
  usageMetric?: string;
  usageRate?: number;
}

export interface CreatePlanPayload {
  name: string;
  code: string;
  amount: number;
  frequency: BillingFrequency;
  customDays?: number;
  description?: string;
  trialDays?: number;
  setupFee?: number;
  isProrated?: boolean;
  isUsageBased?: boolean;
  usageMetric?: string;
  usageRate?: number;
}
