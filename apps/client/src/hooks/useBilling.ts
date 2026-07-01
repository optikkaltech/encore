import { useState, useEffect, useCallback, useMemo } from 'react';
import { billingApi } from '../api/billing.api';
import type { Transaction, Invoice, CreateInvoicePayload } from '../types/billing.types';
import { getErrorMessage } from '../api/client';
import toast from 'react-hot-toast';

export function useBilling() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Search & Filters for Transactions
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('all');

  // Search & Filters for Invoices
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState<'all' | 'paid' | 'sent' | 'void' | 'draft'>('all');

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await billingApi.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      toast.error(`Failed to fetch transactions: ${getErrorMessage(err)}`);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await billingApi.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      toast.error(`Failed to fetch invoices: ${getErrorMessage(err)}`);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTransactions(), fetchInvoices()]);
    setIsLoading(false);
  }, [fetchTransactions, fetchInvoices]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const createInvoice = async (payload: CreateInvoicePayload) => {
    setIsActionLoading(true);
    try {
      const result = await billingApi.createInvoice(payload);
      if (result.success) {
        toast.success(result.message || 'Invoice generated and paid successfully.');
        await refreshAll();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(`Failed to create invoice: ${getErrorMessage(err)}`);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const downloadInvoice = async (id: string, invoiceNumber: string) => {
    const downloadToast = toast.loading('Generating invoice PDF...');
    try {
      await billingApi.downloadInvoice(id, invoiceNumber);
      toast.success('Invoice downloaded successfully!', { id: downloadToast });
      return true;
    } catch (err: any) {
      toast.error(`Download failed: ${getErrorMessage(err)}`, { id: downloadToast });
      return false;
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesSearch =
        txn.id.toLowerCase().includes(txnSearchQuery.toLowerCase()) ||
        (txn.nombaReference && txn.nombaReference.toLowerCase().includes(txnSearchQuery.toLowerCase())) ||
        (txn.invoiceNumber && txn.invoiceNumber.toLowerCase().includes(txnSearchQuery.toLowerCase())) ||
        (txn.subscriber &&
          (`${txn.subscriber.firstName} ${txn.subscriber.lastName}`)
            .toLowerCase()
            .includes(txnSearchQuery.toLowerCase())) ||
        (txn.subscriber && txn.subscriber.email.toLowerCase().includes(txnSearchQuery.toLowerCase()));

      const matchesStatus = txnStatusFilter === 'all' || txn.status.toLowerCase() === txnStatusFilter;
      const matchesType = txnTypeFilter === 'all' || txn.type === txnTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, txnSearchQuery, txnStatusFilter, txnTypeFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
        inv.customerEmail.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
        (inv.notes && inv.notes.toLowerCase().includes(invSearchQuery.toLowerCase()));

      const matchesStatus = invStatusFilter === 'all' || inv.status === invStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, invSearchQuery, invStatusFilter]);

  return {
    transactions,
    invoices,
    isLoading,
    isActionLoading,
    
    // Transactions search/filters
    txnSearchQuery,
    setTxnSearchQuery,
    txnStatusFilter,
    setTxnStatusFilter,
    txnTypeFilter,
    setTxnTypeFilter,
    filteredTransactions,

    // Invoices search/filters
    invSearchQuery,
    setInvSearchQuery,
    invStatusFilter,
    setInvStatusFilter,
    filteredInvoices,

    // Actions
    createInvoice,
    downloadInvoice,
    refreshAll,
  };
}
