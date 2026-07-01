import { useState, useEffect, useCallback } from 'react';
import { plansApi } from '../api/plans.api';
import type { Plan, CreatePlanPayload } from '../types/plans.types';
import { getErrorMessage } from '../api/client';
import toast from 'react-hot-toast';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await plansApi.getAll();
      setPlans(data);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (payload: CreatePlanPayload) => {
    try {
      const result = await plansApi.create(payload);
      if (result.success) {
        toast.success(result.message || 'Plan created successfully!');
        fetchPlans();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const updated = await plansApi.updateStatus(plan.id, !plan.isActive);
      toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'} successfully!`);
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: updated.isActive } : p));
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const updatePlan = async (id: string, payload: Partial<CreatePlanPayload>) => {
    try {
      const updated = await plansApi.update(id, payload);
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
      toast.success('Plan updated successfully!');
      return true;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const deletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this billing plan? This action cannot be undone.')) {
      return;
    }

    try {
      const message = await plansApi.delete(id);
      toast.success(message);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredPlans = plans.filter(
    plan =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    plans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchPlans,
    createPlan,
    updatePlan,
    togglePlanStatus,
    deletePlan,
  };
}
