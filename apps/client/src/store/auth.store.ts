// ====================================================================
// Encore - Auth State Store (Zustand)
// Tokens persisted via cookies for security
// ====================================================================

import { create } from 'zustand';
import client from '../api/client';
import { API_ENDPOINTS } from '../constants/app.constants';
import { setCookie, getCookie, deleteCookie, COOKIE_KEYS } from '../lib/cookies';
import type {
  LoginPayload,
  RegisterPayload,
  LoginResult,
  MerchantProfile,
  OnboardingStatus,
  KycPayload,
  PaymentSetupPayload,
  TierSelectionPayload,
  MerchantConfig,
  InitiateCheckoutPayload,
  InitiateCheckoutResult,
  VerifyCheckoutPayload,
  VerifyCheckoutResult,
} from '../types/auth.types';
import type { ApiResponse } from '../types/api.types';

// ====================================================================
// Types
// ====================================================================
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  merchant: MerchantProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingStatus: OnboardingStatus | null;
  merchantConfig: MerchantConfig | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string) => void;
  fetchProfile: () => Promise<void>;
  initialize: () => void;

  // Onboarding Actions & State
  submitKyc: (payload: KycPayload) => Promise<void>;
  setupPaymentMethod: (payload: PaymentSetupPayload) => Promise<void>;
  initiateCheckout: (payload: InitiateCheckoutPayload) => Promise<InitiateCheckoutResult>;
  verifyCheckout: (payload: VerifyCheckoutPayload) => Promise<VerifyCheckoutResult>;
  selectTier: (payload: TierSelectionPayload) => Promise<void>;
  convertToDemo: () => Promise<void>;
  fetchOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  fetchMerchantConfig: () => Promise<void>;
}

// ====================================================================
// Store
// ====================================================================
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  merchant: null,
  isAuthenticated: false,
  isLoading: false,
  onboardingStatus: null,
  merchantConfig: null,

  // ================================================================
  // Login
  // ================================================================
  login: async (payload: LoginPayload) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post<ApiResponse<LoginResult>>(
        API_ENDPOINTS.AUTH.LOGIN,
        payload,
      );

      const { access_token, refresh_token, merchant } = data.data;

      // Persist tokens in cookies (7 days for refresh, 15min for access)
      setCookie(COOKIE_KEYS.ACCESS_TOKEN, access_token, 1);
      setCookie(COOKIE_KEYS.REFRESH_TOKEN, refresh_token, 7);

      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        merchant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ================================================================
  // Register
  // ================================================================
  register: async (payload: RegisterPayload) => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<{ id: string; businessName: string; email: string; message: string }>>(
        API_ENDPOINTS.AUTH.REGISTER,
        payload,
      );
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ================================================================
  // Logout - Clear cookies and state
  // ================================================================
  logout: () => {
    deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
    deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);
    set({
      accessToken: null,
      refreshToken: null,
      merchant: null,
      isAuthenticated: false,
    });
    window.location.href = '/login';
  },

  // ================================================================
  // Set Access Token (after refresh)
  // ================================================================
  setAccessToken: (token: string) => {
    setCookie(COOKIE_KEYS.ACCESS_TOKEN, token, 1);
    set({ accessToken: token });
  },

  // ================================================================
  // Fetch Merchant Profile
  // ================================================================
  fetchProfile: async () => {
    try {
      const { data } = await client.get<ApiResponse<MerchantProfile>>(
        API_ENDPOINTS.MERCHANTS.ME,
      );
      set({ merchant: data.data });
    } catch {
      // Silently fail - profile fetch is non-critical
    }
  },

  // ================================================================
  // Initialize from cookies
  // ================================================================
  initialize: () => {
    const accessToken = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
    }
  },

  // ================================================================
  // Onboarding Actions
  // ================================================================
  submitKyc: async (payload: KycPayload) => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<void>>(API_ENDPOINTS.MERCHANTS.KYC, payload);
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  setupPaymentMethod: async (payload: PaymentSetupPayload) => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<void>>(API_ENDPOINTS.MERCHANTS.PAYMENT_METHOD, payload);
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  initiateCheckout: async (payload: InitiateCheckoutPayload) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post<ApiResponse<InitiateCheckoutResult>>(
        API_ENDPOINTS.MERCHANTS.INITIATE_CHECKOUT,
        payload
      );
      return data.data;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyCheckout: async (payload: VerifyCheckoutPayload) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post<ApiResponse<VerifyCheckoutResult>>(
        API_ENDPOINTS.MERCHANTS.VERIFY_CHECKOUT,
        payload
      );
      await get().fetchProfile();
      return data.data;
    } finally {
      set({ isLoading: false });
    }
  },

  selectTier: async (payload: TierSelectionPayload) => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<void>>(API_ENDPOINTS.MERCHANTS.SELECT_TIER, payload);
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  convertToDemo: async () => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<{ id: string; accountType: string }>>(
        API_ENDPOINTS.MERCHANTS.CONVERT_TO_DEMO
      );
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOnboardingStatus: async () => {
    try {
      const { data } = await client.get<ApiResponse<OnboardingStatus>>(
        API_ENDPOINTS.MERCHANTS.ONBOARDING_STATUS
      );
      set({ onboardingStatus: data.data });
    } catch {
      // Silently fail
    }
  },

  completeOnboarding: async () => {
    set({ isLoading: true });
    try {
      await client.post<ApiResponse<MerchantProfile>>(API_ENDPOINTS.MERCHANTS.ME, {
        settings: { onboardingCompleted: true }
      });
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMerchantConfig: async () => {
    try {
      const { data } = await client.get<ApiResponse<MerchantConfig>>(
        API_ENDPOINTS.MERCHANTS.CONFIG
      );
      set({ merchantConfig: data.data });
    } catch {
      // Silently fail
    }
  },
}));

// Auto-initialize on import
useAuthStore.getState().initialize();