import client from './client';
import type { Plan, CreatePlanPayload } from '../types/plans.types';

export const plansApi = {
  getAll: async (): Promise<Plan[]> => {
    const { data } = await client.get('/plans');
    return data.data || [];
  },

  create: async (payload: CreatePlanPayload): Promise<{ success: boolean; message: string; data: Plan }> => {
    const { data } = await client.post('/plans', payload);
    return data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<Plan> => {
    const { data } = await client.patch(`/plans/${id}`, { isActive });
    return data.data;
  },

  update: async (id: string, payload: Partial<CreatePlanPayload>): Promise<Plan> => {
    const { data } = await client.patch(`/plans/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<string> => {
    const { data } = await client.delete(`/plans/${id}`);
    return data.message || 'Plan deleted successfully';
  },
};
