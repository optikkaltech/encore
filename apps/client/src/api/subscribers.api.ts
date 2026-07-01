import client from './client';
import type { Subscriber, CreateSubscriberPayload } from '../types/subscribers.types';

export const subscribersApi = {
  getAll: async (): Promise<Subscriber[]> => {
    const { data } = await client.get('/subscribers');
    return data.data || [];
  },

  create: async (payload: CreateSubscriberPayload): Promise<{ success: boolean; message: string; data: Subscriber }> => {
    const { data } = await client.post('/subscribers', payload);
    return data;
  },

  subscribeToPlan: async (subscriberId: string, planId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await client.post(`/subscribers/${subscriberId}/subscriptions`, { planId });
    return data;
  },

  pause: async (subscriberId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await client.post(`/subscribers/${subscriberId}/subscriptions/pause`);
    return data;
  },

  cancel: async (subscriberId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await client.post(`/subscribers/${subscriberId}/subscriptions/cancel`);
    return data;
  },

  update: async (id: string, payload: Partial<CreateSubscriberPayload>): Promise<{ success: boolean; message: string; data: Subscriber }> => {
    const { data } = await client.patch(`/subscribers/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<string> => {
    const { data } = await client.delete(`/subscribers/${id}`);
    return data.message || 'Subscriber deleted successfully';
  },

  generateVirtualAccount: async (id: string): Promise<{ success: boolean; message: string; data: Subscriber }> => {
    const { data } = await client.post(`/subscribers/${id}/virtual-account`);
    return data;
  },

  deleteVirtualAccount: async (id: string): Promise<{ success: boolean; message: string; data: Subscriber }> => {
    const { data } = await client.delete(`/subscribers/${id}/virtual-account`);
    return data;
  },

  bulkUpload: async (subscribers: CreateSubscriberPayload[]): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await client.post('/subscribers/bulk-upload', { subscribers });
    return data;
  },

  bulkSubscribe: async (subscriberIds: string[], planId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await client.post('/subscribers/bulk-subscribe', { subscriberIds, planId });
    return data;
  },

  resendPortalInvite: async (id: string): Promise<{ success: boolean; message: string; data: { inviteToken: string } }> => {
    const { data } = await client.post(`/subscribers/${id}/portal-invite`);
    return data;
  },
};

