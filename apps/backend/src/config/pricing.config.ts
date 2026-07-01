import { registerAs } from '@nestjs/config';

export interface PricingTierConfig {
  name: string;
  monthlyFee: number; // in NGN (₦)
  maxSubscribers: number;
  transactionFeeRate: number; // percentage (0.5 - 1.5)
  features: string[];
  whiteLabelFee: number; // additional monthly fee
}

export interface EncorePricingConfig {
  tiers: Record<string, PricingTierConfig>;
  recoveryFeeRate: number; // 10% of recovered amount
  payoutFee: number; // ₦50 flat per payout
  trialDays: number;
  demoDays: number;
  gracePeriodDays: number;
}

export default registerAs(
  'pricing',
  (): EncorePricingConfig => ({
    tiers: {
      starter: {
        name: 'Starter',
        monthlyFee: 0, // Free
        maxSubscribers: 50,
        transactionFeeRate: 1.5, // 1.5% per transaction
        features: [
          'Up to 50 subscribers',
          'Basic billing automation',
          'Virtual account reconciliation',
          'Email notifications',
          'Standard support',
        ],
        whiteLabelFee: 0,
      },
      growth: {
        name: 'Growth',
        monthlyFee: 25000, // ₦25,000/month
        maxSubscribers: 500,
        transactionFeeRate: 1.0, // 1.0% per transaction
        features: [
          'Up to 500 subscribers',
          'Advanced billing automation',
          'Smart reconciliation',
          'Dunning & recovery engine',
          'Subscriber self-service portal',
          'Priority support',
        ],
        whiteLabelFee: 15000, // ₦15,000/month additional
      },
      scale: {
        name: 'Scale',
        monthlyFee: 75000, // ₦75,000/month
        maxSubscribers: -1, // Unlimited
        transactionFeeRate: 0.5, // 0.5% per transaction
        features: [
          'Unlimited subscribers',
          'Full billing automation',
          'Smart reconciliation',
          'Advanced dunning & recovery',
          'White-label portal included',
          'Usage-based billing',
          'Split payouts',
          'Dedicated account manager',
        ],
        whiteLabelFee: 0, // Included
      },
      enterprise: {
        name: 'Enterprise',
        monthlyFee: 0, // Custom pricing
        maxSubscribers: -1, // Unlimited
        transactionFeeRate: 0.5, // Negotiable
        features: [
          'Everything in Scale',
          'Custom integrations',
          'SLA guarantees',
          'Dedicated support team',
          'Custom contract terms',
        ],
        whiteLabelFee: 0,
      },
    },
    // Monetization: 10% of recovered failed payments
    recoveryFeeRate: 10.0,
    // Monetization: ₦50 flat per payout
    payoutFee: 50,
    // Trial period: 30 days
    trialDays: 30,
    // Demo period: 14 days (limited features)
    demoDays: 14,
    // Grace period for failed platform fee payments
    gracePeriodDays: 7,
  }),
);
