import { api } from '@/services/api/client';
import { userSchema } from '@/features/user/schemas/user';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  FindIdRequest,
  FindIdResponse,
} from '@/features/auth/types';
import type { User } from '@/features/user/types';

/**
 * 인증 방식 — sessionID 단일 쿠키 (한국 표준)
 *
 * 백엔드가 Set-Cookie 로 단일 session cookie (예: `SID`) 를 HttpOnly + Lax
 * 로 발급. 프론트는 쿠키를 직접 읽지 않고 withCredentials=true 로 자동 전송.
 * 만료/Revocation 모두 BE 가 DB Session 행 변경으로 즉시 반영.
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

  // 로그인 상태에서 비밀번호 변경 (현재 비번 확인)
  changePassword: async (data: ChangePasswordRequest) => {
    await api.post('/me/change-password', data);
  },

  // 아이디 찾기 — 이름+이메일 매칭 → 마스킹 아이디 (메일 발송 X)
  findId: async (data: FindIdRequest): Promise<FindIdResponse> => {
    const res = await api.post<FindIdResponse>('/auth/find-id', data);
    return res.data;
  },

  logout: async () => {
    // 서버가 SID 쿠키를 만료시키도록 요청
    await api.post('/auth/logout');
  },

  // 회원 탈퇴 — DELETE /me. BE 가 소프트 삭제 + 세션 무효 (SID cookie 만료).
  deleteAccount: async () => {
    await api.delete('/me');
  },

  // 현재 사용자 정보 — 인증 상태 hydration 용.
  // 응답을 zod로 런타임 검증 — 백엔드 변경/오류 시 즉시 감지.
  me: async (): Promise<User> => {
    const res = await api.get<unknown>('/me');
    return userSchema.parse(res.data) as User;
  },
};
