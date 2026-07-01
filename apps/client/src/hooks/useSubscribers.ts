import { useState, useEffect, useCallback } from 'react';
import { subscribersApi } from '../api/subscribers.api';
import { plansApi } from '../api/plans.api';
import type { Subscriber, CreateSubscriberPayload } from '../types/subscribers.types';
import type { Plan } from '../types/plans.types';
import { getErrorMessage } from '../api/client';
import toast from 'react-hot-toast';

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubscribersAndPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subsData, plansData] = await Promise.all([
        subscribersApi.getAll(),
        plansApi.getAll(),
      ]);
      setSubscribers(subsData);
      setPlans(plansData.filter(p => p.isActive));
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribersAndPlans();
  }, [fetchSubscribersAndPlans]);

  const addSubscriber = async (payload: CreateSubscriberPayload) => {
    try {
      const result = await subscribersApi.create(payload);
      if (result.success) {
        toast.success(result.message || 'Subscriber created successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const subscribeCustomerToPlan = async (subscriberId: string, planId: string) => {
    try {
      const result = await subscribersApi.subscribeToPlan(subscriberId, planId);
      if (result.success) {
        toast.success(result.message || 'Customer subscribed successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const pauseSubscription = async (subscriberId: string) => {
    try {
      const result = await subscribersApi.pause(subscriberId);
      if (result.success) {
        toast.success(result.message || 'Subscription paused successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const cancelSubscription = async (subscriberId: string) => {
    try {
      const result = await subscribersApi.cancel(subscriberId);
      if (result.success) {
        toast.success(result.message || 'Subscription cancelled successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const updateSubscriber = async (id: string, payload: Partial<CreateSubscriberPayload>) => {
    try {
      const result = await subscribersApi.update(id, payload);
      if (result.success) {
        toast.success(result.message || 'Subscriber updated successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      return false;
    }
    try {
      const message = await subscribersApi.delete(id);
      toast.success(message);
      fetchSubscribersAndPlans();
      return true;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const generateVirtualAccount = async (id: string) => {
    try {
      const result = await subscribersApi.generateVirtualAccount(id);
      if (result.success) {
        toast.success(result.message || 'Virtual account generated successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const deleteVirtualAccount = async (id: string) => {
    try {
      const result = await subscribersApi.deleteVirtualAccount(id);
      if (result.success) {
        toast.success(result.message || 'Virtual account deactivated successfully!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const bulkUploadSubscribers = async (payload: CreateSubscriberPayload[]) => {
    try {
      const result = await subscribersApi.bulkUpload(payload);
      if (result.success) {
        toast.success(result.message || 'Bulk upload complete!');
        fetchSubscribersAndPlans();
        return result.data;
      }
      return null;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return null;
    }
  };

  const bulkSubscribeSubscribers = async (subscriberIds: string[], planId: string) => {
    try {
      const result = await subscribersApi.bulkSubscribe(subscriberIds, planId);
      if (result.success) {
        toast.success(result.message || 'Bulk subscription complete!');
        fetchSubscribersAndPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const resendPortalInvite = async (subscriberId: string) => {
    try {
      const result = await subscribersApi.resendPortalInvite(subscriberId);
      if (result.success) {
        toast.success('Setup link resent successfully! The subscriber can now complete their setup.');
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const filteredSubscribers = subscribers.filter(
    sub =>
      sub.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    subscribers,
    plans,
    filteredSubscribers,
    isLoading,
    searchQuery,
    setSearchQuery,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    subscribeCustomerToPlan,
    pauseSubscription,
    cancelSubscription,
    generateVirtualAccount,
    deleteVirtualAccount,
    bulkUploadSubscribers,
    bulkSubscribeSubscribers,
    resendPortalInvite,
    refreshData: fetchSubscribersAndPlans,
  };
}

