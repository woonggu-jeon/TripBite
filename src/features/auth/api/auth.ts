// 신규 Spring BE 지원: login / logout / signup / me(getMe). (그 외는 미지원 → 구 generated mock 유지)
import {
  login as beLogin,
  logout as beLogout,
  signup as beSignup,
} from '@/api/be/auth/auth';
import { getMe as beGetMe } from '@/api/be/me/me';
import type { UserResponseDto } from '@/api/be/schemas';
import {
  authControllerCheckEmailV1,
  authControllerCheckUsernameV1,
  authControllerFindIdV1,
  authControllerForgotPasswordV1,
  authControllerResetPasswordV1,
} from '@/api/generated/auth/auth';
import {
  meControllerChangePasswordV1,
  meControllerWithdrawV1,
} from '@/api/generated/me/me';
import type { UserDto } from '@/api/generated/schemas';

/**
 * 신규 UserResponseDto → 기존 도메인 UserDto 매핑.
 * 새 BE 는 avatarUrl / homeRegion / isOnboarded 미제공:
 *   - avatarUrl: null (ProfileCard 는 fallback)
 *   - homeRegion: 미제공 (UI 게이팅 비의존)
 *   - isOnboarded: true (온보딩 게이팅은 middleware 의 `tripbite.visited` 쿠키 — user 객체 무관)
 *   - travelType: 신규는 code 문자열 → { code } brief 로 (title/emoji 는 mypage summary 가 제공)
 */
function mapUser(u: UserResponseDto): UserDto {
  return {
    id: String(u.id ?? ''),
    username: u.username ?? '',
    nickname: u.nickname ?? '',
    email: u.email ?? '',
    isOnboarded: true,
    avatarUrl: null,
    travelType: u.travelType
      ? ({ code: u.travelType } as UserDto['travelType'])
      : null,
  } as UserDto;
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
  // 가입 폼 중복확인 — 버튼 클릭 시 호출. nickname 은 unique 정책 없어 endpoint 없음.
  checkUsername: (username: string) =>
    authControllerCheckUsernameV1({ username }),
  checkEmail: (email: string) => authControllerCheckEmailV1({ email }),
  forgotPassword: authControllerForgotPasswordV1,
  resetPassword: authControllerResetPasswordV1,
  changePassword: meControllerChangePasswordV1,
  findId: authControllerFindIdV1,
  logout: beLogout,
  deleteAccount: meControllerWithdrawV1,
  // 신규 BE: GET /me → ApiResponse<UserResponseDto> → 도메인 UserDto 매핑.
  me: async (signal?: AbortSignal): Promise<UserDto> => {
    const res = await beGetMe(signal);
    return mapUser(res.data ?? {});
  },
};
