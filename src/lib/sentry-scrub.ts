/**
 * Sentry beforeSend — PII 스크러빙 (README 보안 섹션 가이드)
 *
 * Sentry는 무심코 PII가 새는 가장 흔한 경로.
 * URL 쿼리/요청 body에서 토큰·비밀번호류를 마스킹한 뒤 전송.
 */
const TOKEN_QUERY = /([?&])(token|code|access_token|refresh_token)=[^&]*/gi;
const SENSITIVE_KEYS = ['password', 'token', 'refresh_token', 'access_token'];

export function scrubEvent<
  T extends {
    request?: { url?: string; data?: unknown };
  },
>(event: T): T {
  if (event.request?.url) {
    event.request.url = event.request.url.replace(TOKEN_QUERY, '$1$2=***');
  }
  if (event.request?.data && typeof event.request.data === 'object') {
    const data = event.request.data as Record<string, unknown>;
    for (const k of SENSITIVE_KEYS) {
      if (k in data) data[k] = '***';
    }
  }
  return event;
}
