/**
 * Open-redirect 방어 — 같은 origin 의 내부 경로만 통과시킨다.
 *
 * 기존 문자 가드 `raw.startsWith('/') && !raw.startsWith('//')` 는 우회가 있다:
 *   - 백슬래시: `/\evil.com` → WHATWG URL 파서가 `//evil.com` 로 정규화 → evil.com
 *   - 탭/개행: `/\t/evil.com` → 파서가 제어문자 제거 후 `//evil.com` → evil.com
 * (둘 다 문자 가드를 통과하지만 외부 origin 으로 탈출한다 — Node 재현 확인.)
 *
 * 그래서 **WHATWG URL 로 base 기준 해석 → origin 이 base 와 같을 때만** 통과시킨다.
 * 절대/프로토콜상대/백슬래시/제어문자/스킴(javascript:) 우회를 전부 차단하고,
 * 정규화된 `pathname+search+hash` 를 돌려준다(아니면 `/`).
 *
 * base 는 아무 고정 origin 이면 된다(상대 경로는 base 를 유지, 외부 URL 은 탈출).
 * 그래서 SSR/SW/edge 어디서든 안전 — 기본 sentinel 로 window 접근 불필요.
 *
 * 사용처: middleware(?redirect), LoginForm(?redirect), OnboardingFlow(?next),
 * push 알림 link, interceptor return-path. (모두 동일 규칙 공유.)
 */
const SENTINEL_ORIGIN = 'https://internal.invalid';

export function safeInternalPath(
  raw: string | null | undefined,
  baseOrigin?: string,
): string {
  if (!raw) return '/';
  const base = baseOrigin || SENTINEL_ORIGIN;
  try {
    const b = new URL(base);
    const u = new URL(raw, b);
    if (u.origin !== b.origin) return '/';
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path.startsWith('/') ? path : '/';
  } catch {
    return '/';
  }
}
