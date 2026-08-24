// 신규 Spring BE 지원: login / logout / signup / me(getMe) + 계정찾기 3종(2026-08).
import {
  findId as beFindId,
  forgotPassword as beForgotPassword,
  login as beLogin,
  logout as beLogout,
  resetPassword as beResetPassword,
  signup as beSignup,
} from '@/api/be/auth/auth';
import {
  changePassword as beChangePassword,
  deleteMe as beDeleteMe,
  getMe as beGetMe,
} from '@/api/be/me/me';
import type { UserResponseDto } from '@/api/be/schemas';
import type { UserDto } from '@/types/api-domain';

/**
 * Spring UserResponseDto → 도메인 UserDto 파생 뷰 (FE 소비 필드만).
 * name/phone/birthDate/travelType/createdAt 는 화면 미소비라 미매핑.
 * avatarUrl 은 BE 제공(2026-08) — 미설정 시 null.
 */
function mapUser(u: UserResponseDto): UserDto {
  return {
    id: String(u.id ?? ''),
    username: u.username ?? '',
    nickname: u.nickname ?? '',
    email: u.email ?? '',
    avatarUrl: u.avatarUrl ?? null,
  };
}

/**
 * 인증 API — Spring BE(be/) client wrap.
 *
 * 인증 방식: 세션 쿠키 (Spring JSESSIONID; 운영 Secure/SameSite).
 *   - BE 가 Set-Cookie 로 발급, FE 는 withCredentials=true 로 자동 전송.
 *
 * 신규 BE: login(→{userId}) / logout / me(→UserResponseDto). login 은 userId 만 반환 →
 * 프로필은 useLogin.onSuccess 가 /me 재조회로 hydrate.
 *
 * 계정찾기(2026-08, 전부 공개 엔드포인트):
 *   - findId: 이메일로 가입 아이디 조회 (없으면 username=null).
 *   - forgotPassword: 아이디+이메일로 재설정 토큰 발급(메일 발송).
 *   - resetPassword: 토큰+새 비밀번호로 재설정 (password ≥ 10자).
 */
export const authApi = {
  // LoginDto ≡ LoginRequestDto (username/password 동일).
  login: beLogin,
  // 신규 Spring BE: SignupRequestDto(username/password/name/birthDate/email/phone/nickname).
  // 응답은 ApiResponseUnit(user 없음) → useSignup 이 폼 입력값으로 pendingUser 구성.
  signup: beSignup,
  logout: beLogout,
  // 신규 BE: GET /me → ApiResponse<UserResponseDto> → 도메인 UserDto 매핑.
  me: async (signal?: AbortSignal): Promise<UserDto> => {
    const res = await beGetMe(signal);
    return mapUser(res.data ?? {});
  },
  // POST /auth/find-id → ApiResponse<{ username: string | null }>. 매칭 없으면 null.
  findId: async (email: string): Promise<string | null> => {
    const res = await beFindId({ email });
    return res.data?.username ?? null;
  },
  // POST /auth/forgot-password → ApiResponseUnit. 재설정 토큰 메일 발송(항상 성공 처리).
  forgotPassword: async (input: {
    username: string;
    email: string;
  }): Promise<void> => {
    await beForgotPassword(input);
  },
  // POST /auth/reset-password → ApiResponseUnit. token + 새 비밀번호(≥10자).
  resetPassword: async (input: {
    token: string;
    password: string;
  }): Promise<void> => {
    await beResetPassword(input);
  },
  // POST /me/change-password → ApiResponseUnit. 현재 비번 검증 + 새 비번(≥10자).
  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await beChangePassword(input);
  },
  // DELETE /me → 회원 탈퇴. BE 가 세션 무효 + 소프트 삭제.
  deleteAccount: async (): Promise<void> => {
    await beDeleteMe();
  },
};
