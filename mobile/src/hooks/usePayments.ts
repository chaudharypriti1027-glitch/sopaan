import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, type PremiumPlanId, type VerifyPaymentInput } from '../api';
import { queryKeys } from './queryKeys';

export function usePremiumPlans() {
  return useQuery({
    queryKey: queryKeys.payments.plans(),
    queryFn: paymentsApi.listPlans,
    staleTime: 5 * 60_000,
  });
}

export function useSubscriptionEntitlement(enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.entitlement(),
    queryFn: paymentsApi.getEntitlement,
    enabled,
    staleTime: 60_000,
  });
}

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (plan: PremiumPlanId) => paymentsApi.createOrder(plan),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyPaymentInput) => paymentsApi.verifyPayment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

export function useStartFreeTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentsApi.startFreeTrial,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

export function useRestorePurchases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentsApi.restorePurchases,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { atPeriodEnd?: boolean }) => paymentsApi.cancelSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
