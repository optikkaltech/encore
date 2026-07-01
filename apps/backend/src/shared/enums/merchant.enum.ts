export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum KycStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum BusinessType {
  SOLE_PROPRIETORSHIP = 'sole_proprietorship',
  PARTNERSHIP = 'partnership',
  LIMITED_LIABILITY = 'limited_liability',
  CORPORATION = 'corporation',
  COOPERATIVE = 'cooperative',
  NON_PROFIT = 'non_profit',
}

export enum PricingTier {
  STARTER = 'starter', // Free up to 50 subscribers
  GROWTH = 'growth', // ₦25k/mo up to 500 subscribers
  SCALE = 'scale', // ₦75k/mo unlimited
  ENTERPRISE = 'enterprise', // Custom pricing
}

export enum AccountType {
  DEMO = 'demo', // 14-day limited demo, no real payments
  TRIAL = 'trial', // 30-day full feature trial
  PAID = 'paid', // Active paid subscription
  SUSPENDED = 'suspended', // Payment failed, grace period
  CANCELLED = 'cancelled', // Account closed
}
