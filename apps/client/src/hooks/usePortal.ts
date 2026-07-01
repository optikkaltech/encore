import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '../store/portal.store';
import {
  portalGetProfile,
  portalGetInvoices,
  portalGetPayments,
  portalDownloadInvoice,
  portalUpdatePaymentMethod,
  portalPauseSubscription,
  portalCancelSubscription,
} from '../api/portal.api';
import type { PortalProfile, PortalInvoice, PortalPayment, UpdatePaymentMethodPayload } from '../types/portal.types';

// ── Auth hook ─────────────────────────────────────────────────────────────
export function usePortalAuth() {
  const { subscriber, isAuthenticated, login, logout, merchantId, config } = usePortalStore();
  return { subscriber, isAuthenticated, login, logout, merchantId, config };
}

// ── Profile hook ──────────────────────────────────────────────────────────
export function usePortalProfile() {
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalGetProfile();
      setProfile(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { profile, loading, error, refetch: fetch };
}

// ── Invoices hook ─────────────────────────────────────────────────────────
export function usePortalInvoices() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    portalGetInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  const downloadInvoice = async (id: string) => {
    setDownloading(id);
    try { await portalDownloadInvoice(id); }
    finally { setDownloading(null); }
  };

  return { invoices, loading, downloading, downloadInvoice };
}

// ── Payments hook ─────────────────────────────────────────────────────────
export function usePortalPayments() {
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalGetPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  return { payments, loading };
}

// ── Payment method hook ────────────────────────────────────────────────────
export function usePortalPaymentMethod() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (payload: UpdatePaymentMethodPayload) => {
    setSaving(true);
    setError(null);
    try {
      await portalUpdatePaymentMethod(payload);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update payment method');
    } finally {
      setSaving(false);
    }
  };

  return { update, saving, success, error };
}

// ── Subscription actions hook ──────────────────────────────────────────────
export function usePortalSubscription() {
  const [loading, setLoading] = useState(false);

  const pause = async () => {
    setLoading(true);
    try { return await portalPauseSubscription(); }
    finally { setLoading(false); }
  };

  const cancel = async () => {
    setLoading(true);
    try { return await portalCancelSubscription(); }
    finally { setLoading(false); }
  };

  return { pause, cancel, loading };
}
