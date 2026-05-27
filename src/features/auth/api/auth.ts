import { api } from '@/services/api/client';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/features/auth/types';
import type { User } from '@/features/user/types';

/**
 * 아키텍처 문서 14번
 *
 * 백엔드가 Set-Cookie로 access_token/refresh_token을 발급한다고 가정.
 * 프론트는 응답 body의 토큰을 읽지 않는다.
 */

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await api.post<LoginResponse>('/auth/login', data);
    return res.data;
  },

  signup: async (data: SignupRequest) => {
    await api.post('/auth/signup', data);
  },

  // 재설정 링크 메일 발송 (백엔드가 토큰 URL 메일 전송)
  forgotPassword: async (data: ForgotPasswordRequest) => {
    await api.post('/auth/forgot-password', data);
  },

  // 메일 링크의 토큰 + 새 비밀번호
  resetPassword: async (data: ResetPasswordRequest) => {
    await api.post('/auth/reset-password', data);
  },

  logout: async () => {
    // 서버가 쿠키를 만료시키도록 요청
    await api.post('/auth/logout');
  },

  // 명시적 호출 거의 안 함 — interceptor가 자동 처리
  refresh: async () => {
    await api.post('/auth/refresh');
  },

  // 현재 사용자 정보 — 인증 상태 hydration 용
  me: async (): Promise<User> => {
    const res = await api.get<User>('/me');
    return res.data;
  },
};
