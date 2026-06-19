'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/features/onboarding/api/onboarding';
import { authKeys } from '@/features/auth/hooks/use-auth';

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
