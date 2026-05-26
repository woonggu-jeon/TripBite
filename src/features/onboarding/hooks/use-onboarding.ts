'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/features/onboarding/api/onboarding';

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
