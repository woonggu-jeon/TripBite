// 신규 Spring BE 지원: login / logout / signup / me(getMe). (그 외는 미지원 → 구 generated mock 유지)
import {
  login as beLogin,
  logout as beLogout,
  signup as beSignup,
} from '@/api/be/auth/auth';
import { getMe as beGetMe } from '@/api/be/me/me';
import type { UserResponseDto } from '@/api/be/schemas';
import { api } from '@/services/api/client';
import type {
  ChangePasswordDto,
  FindIdDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UserDto,
} from '@/types/api-domain';

/**
 * Spring UserResponseDto → 도메인 UserDto 파생 뷰 (FE 소비 필드만).
 * avatarUrl/homeRegion/isOnboarded/travelType(brief) 는 Spring 미제공/미표시 — 매핑 안 함.
 */
function mapUser(u: UserResponseDto): UserDto {
  return {
    id: String(u.id ?? ''),
    username: u.username ?? '',
    nickname: u.nickname ?? '',
    email: u.email ?? '',
  };
}

/**
 * 인증 API — 신규 Spring BE(be/) + 미지원 endpoint 는 구 generated(mock) 혼합.
 *
 * 인증 방식: 세션 쿠키 (Spring JSESSIONID; 운영 Secure/SameSite).
 *   - BE 가 Set-Cookie 로 발급, FE 는 withCredentials=true 로 자동 전송.
 *
 * 신규 BE: login(→{userId}) / logout / me(→UserResponseDto). login 은 userId 만 반환 →
 * 프로필은 useLogin.onSuccess 가 /me 재조회로 hydrate.
 */
export const authApi = {
  // LoginDto ≡ LoginRequestDto (username/password 동일).
  login: beLogin,
  // 신규 Spring BE: SignupRequestDto(username/password/name/birthDate/email/phone/nickname).
  // 응답은 ApiResponseUnit(user 없음) → useSignup 이 폼 입력값으로 pendingUser 구성.
  signup: beSignup,
  // ⚠️ 아래 6개는 Spring BE 미지원 — MSW mock 으로만 동작. 실 BE 는 404.
  //    BE 가 엔드포인트 추가해야 함 (BE_REQUEST 문서 참조).
  checkUsername: (username: string) =>
    api
      .get('/auth/check-username', { params: { username } })
      .then((r) => r.data),
  checkEmail: (email: string) =>
    api.get('/auth/check-email', { params: { email } }).then((r) => r.data),
  forgotPassword: (data: ForgotPasswordDto) =>
    api.post('/auth/forgot-password', data).then((r) => r.data),
  resetPassword: (data: ResetPasswordDto) =>
    api.post('/auth/reset-password', data).then((r) => r.data),
  changePassword: (data: ChangePasswordDto) =>
    api.post('/me/change-password', data).then((r) => r.data),
  findId: (data: FindIdDto) =>
    api.post('/auth/find-id', data).then((r) => r.data),
  logout: beLogout,
  deleteAccount: () => api.delete('/me').then((r) => r.data),
  // 신규 BE: GET /me → ApiResponse<UserResponseDto> → 도메인 UserDto 매핑.
  me: async (signal?: AbortSignal): Promise<UserDto> => {
    const res = await beGetMe(signal);
    return mapUser(res.data ?? {});
  },
};
