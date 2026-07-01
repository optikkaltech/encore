import client from './client';

export interface DunningLog {
  id: string;
  amount: number;
  status: string;
  attemptCount: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  createdAt: string;
  subscriber?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  timeline?: Array<{
    timestamp: string;
    action: string;
    description: string;
    attempt?: number;
  }>;
}

export const dunningApi = {
  getAll: async (): Promise<DunningLog[]> => {
    const { data } = await client.get('/dunning');
    return data.data || [];
  },

  manualRetry: async (id: string): Promise<{ success: boolean; message: string; data: DunningLog }> => {
    const { data } = await client.post(`/dunning/${id}/retry`);
    return data;
  },

  forceSuspend: async (id: string): Promise<{ success: boolean; message: string; data: DunningLog }> => {
    const { data } = await client.post(`/dunning/${id}/cancel`);
    return data;
  },
};
