import { useState, useEffect, useCallback } from 'react';
import {
  getPayoutBalance,
  getPayouts,
  createPayout,
  cancelPayout,
  type PayoutBalance,
  type Payout,
  type CreatePayoutPayload,
} from '../api/payouts.api';
import toast from 'react-hot-toast';

export function usePayouts() {
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bal, list] = await Promise.all([getPayoutBalance(), getPayouts()]);
      setBalance(bal);
      setPayouts(list);
    } catch {
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const requestPayout = useCallback(async (payload: CreatePayoutPayload): Promise<boolean> => {
    setSubmitting(true);
    try {
      const { payout, message } = await createPayout(payload);
      if (payout.status === 'completed') {
        toast.success(message || 'Payout sent successfully!');
      } else {
        toast.error(message || 'Payout failed. Please try again.');
      }
      await fetchAll();
      return payout.status === 'completed';
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process payout');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [fetchAll]);

  const handleCancelPayout = useCallback(async (id: string): Promise<void> => {
    setCancelling(id);
    try {
      await cancelPayout(id);
      toast.success('Payout cancelled and balance restored.');
      await fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel payout');
    } finally {
      setCancelling(null);
    }
  }, [fetchAll]);

  return {
    balance,
    payouts,
    loading,
    submitting,
    cancelling,
    requestPayout,
    cancelPayout: handleCancelPayout,
    refresh: fetchAll,
  };
}
