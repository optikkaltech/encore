import { create } from 'zustand';
import type { PortalSubscriber, PortalConfig } from '../types/portal.types';
import { portalLogin, portalGetConfig } from '../api/portal.api';

interface PortalState {
  portalToken: string | null;
  subscriber: PortalSubscriber | null;
  merchantId: string | null;
  config: PortalConfig | null;
  isAuthenticated: boolean;
  isLoadingConfig: boolean;
  multipleMerchantsList: any[] | null;

  login: (email: string, password: string, merchantId?: string) => Promise<{ multipleMerchants?: boolean; merchants?: any[] } | void>;
  logout: () => void;
  loadConfig: (merchantId: string) => Promise<void>;
  hydrateFromSession: () => void;
}

/**
 * Subscriber portal auth store.
 * Persisted to sessionStorage (not localStorage) for security.
 * Isolated from the merchant auth store.
 */
export const usePortalStore = create<PortalState>((set, get) => ({
  portalToken: null,
  subscriber: null,
  merchantId: null,
  config: null,
  isAuthenticated: false,
  isLoadingConfig: false,
  multipleMerchantsList: null,

  hydrateFromSession: () => {
    const token = sessionStorage.getItem('portal_token');
    const raw = sessionStorage.getItem('portal_subscriber');
    const merchantId = sessionStorage.getItem('portal_merchant_id');
    if (token && raw) {
      try {
        const subscriber = JSON.parse(raw) as PortalSubscriber;
        set({ portalToken: token, subscriber, merchantId, isAuthenticated: true });
      } catch {
        sessionStorage.clear();
      }
    }
  },

  login: async (email, password, merchantId) => {
    const result = await portalLogin(email, password, merchantId);
    if (result.multipleMerchants) {
      set({ multipleMerchantsList: result.merchants });
      return { multipleMerchants: true, merchants: result.merchants };
    }

    const activeMerchantId = result.subscriber.merchantId;
    sessionStorage.setItem('portal_token', result.portalToken);
    sessionStorage.setItem('portal_subscriber', JSON.stringify(result.subscriber));
    sessionStorage.setItem('portal_merchant_id', activeMerchantId);
    set({
      portalToken: result.portalToken,
      subscriber: result.subscriber,
      merchantId: activeMerchantId,
      multipleMerchantsList: null,
      isAuthenticated: true,
    });
    // Load merchant branding after login
    get().loadConfig(activeMerchantId);
  },

  logout: () => {
    sessionStorage.removeItem('portal_token');
    sessionStorage.removeItem('portal_subscriber');
    sessionStorage.removeItem('portal_merchant_id');
    set({ portalToken: null, subscriber: null, merchantId: null, isAuthenticated: false, config: null, multipleMerchantsList: null });
  },

  loadConfig: async (merchantId) => {
    set({ isLoadingConfig: true });
    try {
      const config = await portalGetConfig(merchantId);
      set({ config });
    } catch {
      // Fallback branding if config fails
      set({ config: { merchantId, businessName: 'Your Provider', brandColor: '#7c3aed', poweredBy: true } });
    } finally {
      set({ isLoadingConfig: false });
    }
  },
}));
