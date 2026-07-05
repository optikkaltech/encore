import client from './client';

export interface PayoutBalance {
  availableBalance: number;
  totalEarned: number;
  totalPaidOut: number;
  pendingPayouts: number;
  currency: string;
}

export interface Payout {
  id: string;
  merchantId: string;
  requestedAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
  bankName: string;
  nombaReference: string | null;
  failureReason: string | null;
  processedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutPayload {
  amount: number;
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
  bankName: string;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  merchantId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  referenceId: string | null;
  referenceType: string;
  runningBalance: number | null;
  createdAt: string;
}

export const getPayoutBalance = async (): Promise<PayoutBalance> => {
  const { data } = await client.get('/payouts/balance');
  return data.data;
};

export const getPayouts = async (): Promise<Payout[]> => {
  const { data } = await client.get('/payouts');
  return data.data;
};

export const getPayoutLedger = async (): Promise<LedgerEntry[]> => {
  const { data } = await client.get('/payouts/ledger');
  return data.data;
};

export const createPayout = async (payload: CreatePayoutPayload): Promise<{ payout: Payout; message: string }> => {
  const { data } = await client.post('/payouts', payload);
  return { payout: data.data, message: data.message };
};

export const cancelPayout = async (id: string): Promise<Payout> => {
  const { data } = await client.patch(`/payouts/${id}/cancel`);
  return data.data;
};

export const getPayoutBanks = async (): Promise<{ code: string; name: string }[]> => {
  const { data } = await client.get('/payouts/banks');
  return data.data;
};

export const resolvePayoutAccount = async (
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string; bankCode: string }> => {
  const { data } = await client.get('/payouts/resolve', {
    params: { accountNumber, bankCode },
  });
  return data.data;
};

