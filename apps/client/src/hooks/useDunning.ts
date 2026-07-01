import { useState, useEffect, useCallback } from 'react';
import { dunningApi } from '../api/dunning.api';
import type { DunningLog } from '../api/dunning.api';
import { getErrorMessage } from '../api/client';
import toast from 'react-hot-toast';

export function useDunning() {
  const [logs, setLogs] = useState<DunningLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dunningApi.getAll();
      setLogs(data);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const triggerRetry = async (id: string) => {
    try {
      const result = await dunningApi.manualRetry(id);
      if (result.success) {
        toast.success(result.message || 'Payment retry initiated successfully!');
        fetchLogs();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const triggerSuspend = async (id: string) => {
    try {
      const result = await dunningApi.forceSuspend(id);
      if (result.success) {
        toast.success(result.message || 'Dunning cancelled and customer suspended.');
        fetchLogs();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const filteredLogs = logs.filter(
    log =>
      log.subscriber?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subscriber?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subscriber?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.invoice?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    logs,
    filteredLogs,
    isLoading,
    searchQuery,
    setSearchQuery,
    triggerRetry,
    triggerSuspend,
    refreshData: fetchLogs,
  };
}
