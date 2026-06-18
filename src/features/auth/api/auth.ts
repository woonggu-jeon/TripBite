import {
  authControllerCheckUsernameV1,
  authControllerFindIdV1,
  authControllerForgotPasswordV1,
  authControllerLoginV1,
  authControllerLogoutV1,
  authControllerResetPasswordV1,
  authControllerSignupV1,
} from '@/api/generated/auth/auth';
import {
  meControllerChangePasswordV1,
  meControllerGetMeV1,
  meControllerWithdrawV1,
} from '@/api/generated/me/me';

/**
 * 인증 API — orval 가 BE swagger 로부터 자동 생성한 client functions wrap.
 *
 * 인증 방식: sessionID 단일 쿠키 `SID` (HttpOnly; SameSite; Secure 운영).
 *   - BE 가 Set-Cookie 로 발급, FE 는 withCredentials=true 로 자동 전송.
 *   - 만료/Revocation 은 BE 가 DB Session 행 변경으로 즉시 반영.
 *
 * 마이그 패턴 (얕은): hook 의 mutationFn 만 generated 함수 호출로 교체.
 * onSuccess (router redirect / cache clear) 등 FE 특화 흐름은 hook 안에 유지.
 */
export const authApi = {
  login: authControllerLoginV1,
  signup: authControllerSignupV1,
  // username 중복확인 — debounced 호출용. nickname 은 unique 정책 없어 endpoint 없음.
  checkUsername: (username: string) =>
    authControllerCheckUsernameV1({ username }),
  forgotPassword: authControllerForgotPasswordV1,
  resetPassword: authControllerResetPasswordV1,
  changePassword: meControllerChangePasswordV1,
  findId: authControllerFindIdV1,
  logout: authControllerLogoutV1,
  deleteAccount: meControllerWithdrawV1,
  me: meControllerGetMeV1,
};
