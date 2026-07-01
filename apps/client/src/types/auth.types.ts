// ====================================================================
// Encore - Auth Types
// ====================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  businessName: string;
  email: string;
  password: string;
  phone: string;
  businessType: string;
  selectedTier?: string;
  referralCode?: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  merchant: MerchantProfile;
}

export interface MerchantProfile {
  id: string;
  merchantCode?: string | null;
  businessName: string;
  email: string;
  accountType: 'trial' | 'demo' | 'paid';
  pricingTier: string;
  isEmailVerified: boolean;
  kycStatus: string;
  status?: string;
  maxSubscribers?: number;
  currentSubscriberCount?: number;
  transactionFeeRate?: number;
  trialEndsAt?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  nextBillingDate?: string;
  platformFeeBalance?: number;
  features?: string[];
  whiteLabelEnabled?: boolean;
  customDomain?: string;
  brandLogoUrl?: string;
  brandPrimaryColor?: string;
  onboardingCompleted?: boolean;
}

export interface OnboardingStatus {
  steps: {
    registration: { completed: boolean; label: string };
    emailVerification: { completed: boolean; label: string };
    kycSubmission: { completed: boolean; label: string; status?: string };
    paymentSetup: { completed: boolean; label: string; method?: string };
    tierSelection: { completed: boolean; label: string; tier?: string };
  };
  progress: number;
  isComplete: boolean;
  accountType: string;
  canGoLive: boolean;
}

export interface PricingTier {
  name: string;
  monthlyFee: number;
  maxSubscribers: number;
  transactionFeeRate: number;
  features: string[];
  whiteLabelFee: number;
}

export interface KycPayload {
  registrationNumber?: string;
  taxId?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  cacCertificateUrl?: string;
  taxClearanceUrl?: string;
  bankStatementUrl?: string;
}

export interface PaymentSetupPayload {
  method: 'card' | 'direct_debit';
  cardToken?: string;
  mandateId?: string;
}

export interface TierSelectionPayload {
  tier: string;
}

export interface MerchantConfig {
  limits: {
    maxTransactionAmount: number;
    maxMonthlyVolume: number;
    maxSubscribers: number;
    requireCacForLive: boolean;
    settlementType: 'auto' | 'manual';
  };
  usage: {
    currentMonthlyVolume: number;
    currentSubscriberCount: number;
  };
  status: {
    isUnregistered: boolean;
    isKycPending: boolean;
    isKycVerified: boolean;
    isTrial: boolean;
    isDemo: boolean;
    limitsReached: {
      monthlyVolume: boolean;
      subscribers: boolean;
    };
  };
}

export interface InitiateCheckoutPayload {
  method: 'card' | 'direct_debit';
  callbackUrl?: string;
}

export interface InitiateCheckoutResult {
  checkoutLink: string;
  orderReference: string;
  isMock: boolean;
}

export interface VerifyCheckoutPayload {
  orderReference: string;
  method: 'card' | 'direct_debit';
}

export interface VerifyCheckoutResult {
  success: boolean;
  paymentMethod: string | null;
  message: string;
}