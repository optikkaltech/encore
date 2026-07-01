export const PaymentMethod = {
  CARD: 'card',
  DIRECT_DEBIT: 'direct_debit',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface Subscription {
  id: string;
  status: string;
  planAmount: number;
  finalAmount: number;
  currentPeriodEnd: string;
  plan?: {
    id: string;
    name: string;
    code: string;
    amount: number;
    frequency: string;
  };
}

export interface Subscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  paymentMethod: PaymentMethod;
  nextBillingDate?: string;
  createdAt: string;
  subscriptions?: Subscription[];
  virtualAccountNumber?: string;
  virtualAccountBank?: string;
  cardToken?: string;
  cardLastFour?: string;
  cardExpiry?: string;
  mandateId?: string;
  consecutiveFailures?: number;
}

export interface CreateSubscriberPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  paymentMethod: PaymentMethod;
}
