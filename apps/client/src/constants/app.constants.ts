/**
 * Encore - All application constants, text, icons and images in one place.
 * Do NOT hardcode text anywhere else in the app.
 */

// ====================================================================
// APPLICATION INFO
// ====================================================================
export const APP = {
  NAME: 'Encore',
  TAGLINE: 'Subscription infrastructure for African businesses',
  DESCRIPTION: 'Automate your recurring billing, reconciliation, and payment recovery',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@encorepay.co',
  WEBSITE: 'https://encorepay.co',
} as const;

// ====================================================================
// ROUTES
// ====================================================================
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  OAUTH_CALLBACK: '/auth/callback',
  PRICING: '/pricing',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SECURITY: '/security',
  CONTACT: '/contact',
  CHECKOUT: '/checkout/:planId',
  SETUP: '/setup',

  // Onboarding (auth required)
  ONBOARDING: {
    WELCOME: '/onboarding',
    KYC: '/onboarding/kyc',
    PAYMENT_SETUP: '/onboarding/payment',
    PAYMENT_CALLBACK: '/onboarding/payment/callback',
    PAYMENT_MOCK_CHECKOUT: '/onboarding/payment/mock-checkout',
    TIER_SELECTION: '/onboarding/tier',
    PROGRESS: '/onboarding/progress',
  },

  // Dashboard (auth required)
  DASHBOARD: {
    OVERVIEW: '/dashboard',
    SUBSCRIBERS: '/dashboard/subscribers',
    SUBSCRIBER_DETAIL: '/dashboard/subscribers/:id',
    PLANS: '/dashboard/plans',
    PLAN_DETAIL: '/dashboard/plans/:id',
    TRANSACTIONS: '/dashboard/transactions',
    DUNNING: '/dashboard/dunning',
    INVOICES: '/dashboard/invoices',
    PAYOUTS: '/dashboard/payouts',
    SETTINGS: '/dashboard/settings',
    SETTINGS_BRANDING: '/dashboard/settings/branding',
    SETTINGS_API: '/dashboard/settings/api',
    SETTINGS_TEAM: '/dashboard/settings/team',
  },

  // Subscriber Portal
  PORTAL: {
    LOGIN: '/portal/login',
    DASHBOARD: '/portal',
    PAYMENT_HISTORY: '/portal/payments',
    UPDATE_PAYMENT: '/portal/payment-method',
    INVOICES: '/portal/invoices',
    PLAN: '/portal/plan',
  },
} as const;

// ====================================================================
// AUTH PAGES TEXT
// ====================================================================
export const AUTH = {
  LOGIN: {
    TITLE: 'Welcome back',
    SUBTITLE: 'Sign in to your Encore dashboard',
    EMAIL_LABEL: 'Email address',
    EMAIL_PLACEHOLDER: 'you@company.com',
    PASSWORD_LABEL: 'Password',
    PASSWORD_PLACEHOLDER: 'Enter your password',
    SUBMIT: 'Sign in',
    SUBMITTING: 'Signing in...',
    NO_ACCOUNT: "Don't have an account?",
    CREATE_ACCOUNT: 'Create one',
    FORGOT_PASSWORD: 'Forgot password?',
    DIVIDER: 'or continue with',
    GOOGLE: 'Sign in with Google',
    SUCCESS: 'Signed in successfully',
    ERROR: 'Invalid email or password',
  },
  REGISTER: {
    TITLE: 'Create your account',
    SUBTITLE: 'Start automating your recurring billing in minutes',
    BUSINESS_NAME: 'Business name',
    BUSINESS_PLACEHOLDER: 'Your Business Ltd',
    BUSINESS_TYPE: 'Business type',
    EMAIL_LABEL: 'Email address',
    EMAIL_PLACEHOLDER: 'you@company.com',
    PHONE: 'Phone number',
    PHONE_PLACEHOLDER: '+234 800 000 0000',
    PASSWORD_LABEL: 'Password',
    PASSWORD_PLACEHOLDER: 'Create a strong password',
    SUBMIT: 'Create account',
    SUBMITTING: 'Creating account...',
    HAS_ACCOUNT: 'Already have an account?',
    SIGN_IN: 'Sign in',
    DIVIDER: 'or',
    GOOGLE: 'Sign up with Google',
    SUCCESS: 'Account created! Check your email to verify.',
    TERMS: 'By creating an account, you agree to our Terms of Service and Privacy Policy',
  },
  FORGOT_PASSWORD: {
    TITLE: 'Reset your password',
    SUBTITLE: "Enter your email and we'll send you a reset link",
    EMAIL_LABEL: 'Email address',
    EMAIL_PLACEHOLDER: 'you@company.com',
    SUBMIT: 'Send reset link',
    SUBMITTING: 'Sending...',
    SUCCESS: 'If that email is registered, you will receive a password reset link.',
    BACK_TO_LOGIN: 'Back to sign in',
  },
  RESET_PASSWORD: {
    TITLE: 'Set new password',
    SUBTITLE: 'Choose a strong password for your account',
    NEW_PASSWORD: 'New password',
    CONFIRM_PASSWORD: 'Confirm password',
    SUBMIT: 'Reset password',
    SUBMITTING: 'Resetting...',
    SUCCESS: 'Password reset successfully! You can now sign in.',
  },
  VERIFY_EMAIL: {
    VERIFYING: 'Verifying your email...',
    SUCCESS: 'Email verified successfully!',
    ERROR: 'Invalid or expired verification link.',
    REDIRECT: 'Redirecting to login...',
  },
} as const;

// ====================================================================
// ONBOARDING TEXT
// ====================================================================
export const ONBOARDING = {
  WELCOME: {
    TITLE: 'Welcome to Encore',
    SUBTITLE: "Let's get your business set up for automated recurring billing",
    TRIAL: {
      TITLE: 'Start Free Trial',
      DESCRIPTION: '30-day full-feature trial. No credit card required.',
      FEATURES: [
        'Up to 50 subscribers',
        'Full billing automation',
        'Virtual account reconciliation',
        'Email notifications',
        'Standard support',
      ],
      CTA: 'Start 30-day trial',
    },
    DEMO: {
      TITLE: 'Try Demo',
      DESCRIPTION: '14-day limited demo. No real payments, just explore.',
      LIMITATIONS: [
        'No real payments processed',
        'Maximum 10 subscribers',
        'No white-label features',
        '14-day duration',
      ],
      CTA: 'Try demo account',
    },
  },
  KYC: {
    TITLE: 'Verify Your Business',
    SUBTITLE: 'We need to verify your business before you can start collecting payments',
    REGISTRATION_NUMBER: 'Business Registration Number',
    TAX_ID: 'Tax ID (optional)',
    ADDRESS: 'Business Address',
    CITY: 'City',
    STATE: 'State',
    COUNTRY: 'Country',
    CAC_CERT: 'CAC Certificate',
    CAC_CERT_HELP: 'Upload your CAC certificate of incorporation',
    TAX_CLEARANCE: 'Tax Clearance Certificate (optional)',
    BANK_STATEMENT: 'Bank Statement (optional)',
    UPLOAD: 'Upload',
    UPLOADING: 'Uploading...',
    SUBMIT: 'Submit for verification',
    SUBMITTING: 'Submitting...',
    SUCCESS: 'KYC submitted successfully. We will review and get back to you.',
  },
  PAYMENT: {
    TITLE: 'Set Up Payment Method',
    SUBTITLE: 'Configure how you pay your Encore platform fees',
    CARD: 'Card Payment',
    CARD_DESC: 'Pay your monthly platform fee automatically with your card',
    DIRECT_DEBIT: 'Direct Debit',
    DIRECT_DEBIT_DESC: 'Set up a direct debit mandate for automatic deductions',
    SUBMIT: 'Complete Setup',
    SUCCESS: 'Payment method configured successfully!',
  },
  TIER: {
    TITLE: 'Choose Your Plan',
    SUBTITLE: 'Select the plan that fits your business needs. You can change anytime.',
    MONTHLY: '/month',
    FREE: 'Free',
    SUBSCRIBERS: 'subscribers',
    UNLIMITED: 'Unlimited',
    CURRENT: 'Current Plan',
    SELECT: 'Select Plan',
    SELECTED: 'Selected',
    FEATURES: 'What\'s included',
    CONFIRM: 'Confirm Selection',
    SUCCESS: 'Plan updated successfully!',
  },
  PROGRESS: {
    TITLE: 'Onboarding Progress',
    COMPLETED: 'completed',
    OF: 'of',
    STEPS: 'steps',
    STEPS_LIST: [
      'Account Created',
      'Email Verified',
      'KYC Submitted',
      'Payment Method Set',
      'Tier Selected',
    ],
    GO_DASHBOARD: 'Go to Dashboard',
    CAN_GO_LIVE: 'You\'re all set! Start managing your subscribers.',
  },
} as const;

// ====================================================================
// DASHBOARD TEXT
// ====================================================================
export const DASHBOARD = {
  OVERVIEW: {
    GREETING: 'Good afternoon',
    READY: "Here's what's happening with your business today",
    MRR: 'Monthly Recurring Revenue',
    ACTIVE_SUBSCRIBERS: 'Active Subscribers',
    CHURN_RATE: 'Churn Rate',
    FAILED_PAYMENTS: 'Failed Payments',
    UPCOMING_RENEWALS: 'Upcoming Renewals',
    QUICK_ACTIONS: 'Quick Actions',
  },
  QUICK_ACTIONS: [
    {
      title: 'Ask AI to help',
      description: 'Use natural language to create plans, invoice, etc.',
    },
    {
      title: 'Create new plan',
      description: 'Set up a new billing plan for your subscribers',
    },
    {
      title: 'Add subscriber',
      description: 'Add a new subscriber and assign them a plan',
    },
    {
      title: 'Browse reports',
      description: 'View transaction reports and analytics',
    },
    {
      title: 'Explore use cases',
      description: 'See what\'s possible with Encore',
    },
    {
      title: 'Customize workspace',
      description: 'Find one and make it yours',
    },
  ],
  SIDEBAR: {
    HOME: 'Home',
    EXPLORE: 'Explore',
    SUBSCRIBERS: 'Subscribers',
    PLANS: 'Plans',
    TRANSACTIONS: 'Transactions',
    DUNNING: 'Dunning',
    INVOICES: 'Invoices',
    PAYOUTS: 'Payouts',
    SETTINGS: 'Settings',
    MY_SPACE: 'My space',
    FILES: 'Files',
    SHARED: 'Shared with me',
    COLLECTIONS: 'Collections',
  },
  SUBSCRIBERS: {
    TITLE: 'Subscribers',
    SUBTITLE: 'Manage all your subscribers and their subscriptions',
    ADD: 'Add Subscriber',
    SEARCH: 'Search subscribers...',
    TABLE: {
      NAME: 'Name',
      EMAIL: 'Email',
      PLAN: 'Plan',
      STATUS: 'Status',
      NEXT_BILLING: 'Next Billing',
      AMOUNT: 'Amount',
      ACTIONS: 'Actions',
    },
    STATUS: {
      ACTIVE: 'Active',
      PAUSED: 'Paused',
      SUSPENDED: 'Suspended',
      CANCELLED: 'Cancelled',
      PENDING: 'Pending',
    },
    EMPTY: 'No subscribers yet. Add your first subscriber to get started.',
  },
  PLANS: {
    TITLE: 'Billing Plans',
    SUBTITLE: 'Create and manage your subscription plans',
    ADD: 'Create Plan',
    TABLE: {
      NAME: 'Plan Name',
      AMOUNT: 'Amount',
      FREQUENCY: 'Frequency',
      SUBSCRIBERS: 'Subscribers',
      REVENUE: 'Revenue',
      STATUS: 'Status',
    },
    FREQUENCY: {
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      SEMI_ANNUAL: 'Semi-Annual',
      ANNUAL: 'Annual',
      CUSTOM: 'Custom',
    },
    EMPTY: 'No plans created. Create your first billing plan.',
  },
  TRANSACTIONS: {
    TITLE: 'Transactions',
    SUBTITLE: 'View all payment transactions across your subscribers',
    FILTER_ALL: 'All',
    FILTER_SUCCESS: 'Success',
    FILTER_FAILED: 'Failed',
    FILTER_PENDING: 'Pending',
    TABLE: {
      DATE: 'Date',
      SUBSCRIBER: 'Subscriber',
      PLAN: 'Plan',
      AMOUNT: 'Amount',
      STATUS: 'Status',
      REFERENCE: 'Reference',
    },
    EMPTY: 'No transactions yet.',
  },
  DUNNING: {
    TITLE: 'Payment Recovery',
    SUBTITLE: 'Manage failed payment recovery for your subscribers',
    IN_RECOVERY: 'In Recovery',
    RECOVERED: 'Recovered',
    FAILED: 'Failed',
    TABLE: {
      SUBSCRIBER: 'Subscriber',
      AMOUNT: 'Amount',
      ATTEMPTS: 'Attempts',
      LAST_ATTEMPT: 'Last Attempt',
      STATUS: 'Status',
      ACTIONS: 'Actions',
    },
    RETRY: 'Retry Payment',
    SUSPEND: 'Suspend Access',
    EMPTY: 'No payments in recovery. All payments are up to date.',
  },
  INVOICES: {
    TITLE: 'Invoices',
    SUBTITLE: 'View and download invoices for all completed payments',
    DOWNLOAD: 'Download PDF',
    TABLE: {
      NUMBER: 'Invoice #',
      SUBSCRIBER: 'Subscriber',
      DATE: 'Date',
      AMOUNT: 'Amount',
      STATUS: 'Status',
    },
    EMPTY: 'No invoices generated yet.',
  },
  PAYOUTS: {
    TITLE: 'Payouts',
    SUBTITLE: 'Manage automated payouts to vendors and partners',
    BALANCE: 'Available Balance',
    PENDING: 'Pending Payouts',
    COMPLETED: 'Completed Payouts',
    TRIGGER: 'Trigger Payout',
    TABLE: {
      DATE: 'Date',
      VENDOR: 'Vendor',
      AMOUNT: 'Amount',
      STATUS: 'Status',
      REFERENCE: 'Reference',
    },
    EMPTY: 'No payouts yet.',
  },
  SETTINGS: {
    TITLE: 'Settings',
    SUBTITLE: 'Manage your account, branding, and integration settings',
    PROFILE: 'Profile',
    BRANDING: 'Branding',
    API: 'API & Webhooks',
    TEAM: 'Team',
    BILLING: 'Billing & Plan',
    NOTIFICATIONS: 'Notifications',
    BUSINESS_INFO: 'Business Information',
    BRAND_LOGO: 'Brand Logo',
    BRAND_COLOR: 'Brand Color',
    CUSTOM_DOMAIN: 'Custom Domain',
    WEBHOOK_URL: 'Webhook URL',
    SAVE: 'Save Changes',
    SAVING: 'Saving...',
    SAVED: 'Changes saved successfully',
  },
  PROFILE: {
    TIER: 'Current Plan',
    SUBSCRIBERS_USED: 'subscribers used',
    TRIAL_ENDS: 'Trial ends in',
    DAYS: 'days',
    EXPIRED: 'Trial expired',
    ACCOUNT_TYPE: {
      TRIAL: 'Trial',
      DEMO: 'Demo',
      PAID: 'Paid',
    },
  },
} as const;

// ====================================================================
// SUBSCRIBER PORTAL TEXT
// ====================================================================
export const PORTAL = {
  LOGIN: {
    TITLE: 'Welcome to your dashboard',
    SUBTITLE: 'Manage your subscription, view invoices, and update payment methods',
    EMAIL_LABEL: 'Email address',
    SUBMIT: 'Sign in',
    SUBMITTING: 'Signing in...',
  },
  DASHBOARD: {
    TITLE: 'My Subscription',
    PLAN: 'Current Plan',
    NEXT_BILLING: 'Next Billing Date',
    AMOUNT: 'Amount',
    STATUS: 'Status',
    PAYMENT_METHOD: 'Payment Method',
  },
  PAYMENTS: {
    TITLE: 'Payment History',
    TABLE: {
      DATE: 'Date',
      DESCRIPTION: 'Description',
      AMOUNT: 'Amount',
      STATUS: 'Status',
      INVOICE: 'Invoice',
    },
  },
  PAYMENT_METHOD: {
    TITLE: 'Update Payment Method',
    CARD: 'Card Payment',
    DIRECT_DEBIT: 'Bank Direct Debit',
    CURRENT: 'Current Method',
    UPDATE: 'Update Method',
    SUCCESS: 'Payment method updated successfully',
  },
  INVOICES: {
    TITLE: 'My Invoices',
    DOWNLOAD: 'Download',
    TABLE: {
      NUMBER: 'Invoice #',
      DATE: 'Date',
      AMOUNT: 'Amount',
      STATUS: 'Status',
    },
  },
  PLAN: {
    TITLE: 'My Plan',
    CURRENT: 'Current Plan',
    CHANGE: 'Request Plan Change',
    PAUSE: 'Pause Subscription',
    CANCEL: 'Cancel Subscription',
    CONFIRM_CANCEL: 'Are you sure you want to cancel? Your access will be terminated at the end of the billing cycle.',
  },
} as const;

// ====================================================================
// SHARED UI TEXT
// ====================================================================
export const UI = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  ERROR: 'Something went wrong',
  RETRY: 'Try again',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  DELETE: 'Delete',
  EDIT: 'Edit',
  VIEW: 'View',
  CLOSE: 'Close',
  BACK: 'Back',
  NEXT: 'Next',
  SKIP: 'Skip',
  DONE: 'Done',
  SEARCH: 'Search',
  FILTER: 'Filter',
  SORT: 'Sort',
  EXPORT: 'Export',
  DOWNLOAD: 'Download',
  UPLOAD: 'Upload',
  NO_DATA: 'No data available',
  NO_RESULTS: 'No results found',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
} as const;

// ====================================================================
// SIDEBAR NAVIGATION ITEMS
// ====================================================================
export const SIDEBAR_ITEMS = [
  { label: DASHBOARD.SIDEBAR.HOME, icon: 'home', path: ROUTES.DASHBOARD.OVERVIEW },
  { label: DASHBOARD.SIDEBAR.SUBSCRIBERS, icon: 'users', path: ROUTES.DASHBOARD.SUBSCRIBERS },
  { label: DASHBOARD.SIDEBAR.PLANS, icon: 'credit-card', path: ROUTES.DASHBOARD.PLANS },
  { label: DASHBOARD.SIDEBAR.TRANSACTIONS, icon: 'arrow-left-right', path: ROUTES.DASHBOARD.TRANSACTIONS },
  { label: DASHBOARD.SIDEBAR.DUNNING, icon: 'alert-triangle', path: ROUTES.DASHBOARD.DUNNING },
  { label: DASHBOARD.SIDEBAR.INVOICES, icon: 'file-text', path: ROUTES.DASHBOARD.INVOICES },
  { label: DASHBOARD.SIDEBAR.PAYOUTS, icon: 'banknote', path: ROUTES.DASHBOARD.PAYOUTS },
] as const;

export const SIDEBAR_BOTTOM_ITEMS = [
  { label: DASHBOARD.SIDEBAR.SETTINGS, icon: 'settings', path: ROUTES.DASHBOARD.SETTINGS },
] as const;

// ====================================================================
// BUSINESS TYPES
// ====================================================================
export const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'limited_liability', label: 'Limited Liability Company' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'non_profit', label: 'Non-Profit Organization' },
] as const;

// ====================================================================
// PRICING TIERS
// ====================================================================
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    monthlyFee: 0,
    maxSubscribers: 50,
    transactionFee: '1.5%',
    features: [
      'Up to 50 subscribers',
      'Basic billing automation',
      'Virtual account reconciliation',
      'Email notifications',
      'Standard support',
    ],
  },
  growth: {
    name: 'Growth',
    monthlyFee: 25000,
    maxSubscribers: 500,
    transactionFee: '1.0%',
    features: [
      'Up to 500 subscribers',
      'Advanced billing automation',
      'Smart reconciliation',
      'Dunning & recovery engine',
      'Subscriber self-service portal',
      'Priority support',
    ],
  },
  scale: {
    name: 'Scale',
    monthlyFee: 75000,
    maxSubscribers: 'Unlimited',
    transactionFee: '0.5%',
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
  },
} as const;

// ====================================================================
// IMAGE & ASSET PATHS
// ====================================================================
export const IMAGES = {
  LOGO: '/images/encore-logo.svg',
  LOGO_SMALL: '/images/encore-icon.svg',
  DEFAULT_AVATAR: '/images/default-avatar.svg',
  EMPTY_STATE: '/images/empty-state.svg',
  ERROR_STATE: '/images/error-state.svg',
} as const;

// ====================================================================
// API ENDPOINTS
// ====================================================================
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
  },
  MERCHANTS: {
    ME: '/merchants/me',
    REGISTER: '/merchants/register',
    DEMO: '/merchants/demo',
    KYC: '/merchants/kyc',
    PAYMENT_METHOD: '/merchants/payment-method',
    INITIATE_CHECKOUT: '/merchants/payment-method/initiate-checkout',
    VERIFY_CHECKOUT: '/merchants/payment-method/verify-checkout',
    CONVERT_TO_PAID: '/merchants/convert-to-paid',
    SELECT_TIER: '/merchants/select-tier',
    PRICING_TIERS: '/merchants/pricing-tiers',
    ONBOARDING_STATUS: '/merchants/onboarding-status',
    CONVERT_TO_DEMO: '/merchants/convert-to-demo',
    CONFIG: '/merchants/me/config',
  },
  UPLOADS: {
    KYC_CAC: '/uploads/kyc/cac',
    KYC_TAX: '/uploads/kyc/tax',
    KYC_BANK: '/uploads/kyc/bank',
    LOGO: '/uploads/branding/logo',
  },
  PORTAL_AUTH: {
    LOGIN: '/portal/auth/login',
    SET_PASSWORD: '/portal/auth/set-password',
    ME: '/portal/auth/me',
  },
  PORTAL: {
    ME: '/portal/me',
    INVOICES: '/portal/invoices',
    INVOICE_DOWNLOAD: (id: string) => `/portal/invoices/${id}/download`,
    PAYMENTS: '/portal/payments',
    PAYMENT_METHOD: '/portal/payment-method',
    SUBSCRIPTION_PAUSE: '/portal/subscription/pause',
    SUBSCRIPTION_CANCEL: '/portal/subscription/cancel',
    CONFIG: (merchantId: string) => `/portal/config/${merchantId}`,
  },
} as const;