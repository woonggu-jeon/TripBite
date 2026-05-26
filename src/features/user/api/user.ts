import { api } from '@/services/api/client';
import type { User } from '@/features/user/types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<User>('/users/me');
    return res.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'name'>>): Promise<User> => {
    const res = await api.patch<User>('/users/me', data);
    return res.data;
  },
};
