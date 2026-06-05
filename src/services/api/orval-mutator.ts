import type { AxiosRequestConfig } from 'axios';
import { api } from './client';

/**
 * Orval mutator — generated client 함수가 response data (T) 만 반환하도록 wrap.
 *
 * 기본 mutator (`api` 자체) 는 `Promise<AxiosResponse<T>>` 반환 → hooks 에서 매번
 * `res.data` 추출 필요. mutator 가 한 곳에서 unwrap 하면 generated 함수가 곧바로
 * `Promise<T>` 반환 → react-query queryFn / mutationFn 에 그대로 사용 가능.
 *
 * 우리 axios instance (interceptors / withCredentials / multipart FormData 처리) 그대로 사용.
 */
export const orvalMutator = async <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const res = await api.request<T>(config);
  return res.data;
};
