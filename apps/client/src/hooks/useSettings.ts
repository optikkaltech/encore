import { useState, useEffect, useCallback } from 'react';
import {
  getMerchantProfile,
  getMerchantSettings,
  updateMerchantSettings,
  updateMerchantBranding,
  updateMerchantProfile,
  selectMerchantTier,
  type MerchantProfile,
  type MerchantSettings,
  type UpdateSettingsPayload,
  type UpdateBrandingPayload,
} from '../api/settings.api';
import toast from 'react-hot-toast';

export function useSettings() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, sett] = await Promise.all([getMerchantProfile(), getMerchantSettings()]);
      setProfile(prof);
      setSettings(sett);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveSettings = useCallback(async (payload: UpdateSettingsPayload): Promise<boolean> => {
    setSaving(true);
    try {
      await updateMerchantSettings(payload);
      toast.success('Settings saved successfully!');
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const saveBranding = useCallback(async (payload: UpdateBrandingPayload): Promise<boolean> => {
    setSaving(true);
    try {
      await updateMerchantBranding(payload);
      toast.success('Branding updated successfully!');
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update branding');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const saveProfile = useCallback(async (payload: any): Promise<boolean> => {
    setSaving(true);
    try {
      await updateMerchantProfile(payload);
      toast.success('Profile and KYC details updated successfully!');
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const upgradeTier = useCallback(async (tier: string): Promise<boolean> => {
    setSaving(true);
    try {
      await selectMerchantTier(tier);
      toast.success(`Plan successfully changed to ${tier}!`);
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change plan');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return {
    profile,
    settings,
    loading,
    saving,
    saveSettings,
    saveBranding,
    saveProfile,
    upgradeTier,
    refresh: fetchAll,
  };
}

