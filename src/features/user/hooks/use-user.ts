'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/features/user/api/user';
import type { User } from '@/features/user/types';

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Pick<User, 'nickname'>>) =>
      userApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.profile(), updated);
    },
  });
}
