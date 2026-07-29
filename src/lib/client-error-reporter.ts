/**
 * 클라이언트 에러 수집 — `/api/client-error` 로 best-effort POST.
 *
 * 운영 빌드 (production) 만 active. dev / mock 환경은 console 로 충분.
 * PII 누출 방지 — payload 에 token / cookie / 사용자 입력 절대 X.
 */
import { createLogger } from '@/lib/logger';

const log = createLogger('client-error');

const ENDPOINT = '/api/client-error';
const MAX_STACK_CHARS = 4000;
const MAX_MESSAGE_CHARS = 500;

type ErrorSource =
  | 'window-error'
  | 'unhandled-rejection'
  | 'react-error-boundary'
  | 'react-query';

interface ErrorPayload {
  source: ErrorSource;
  message: string;
  stack?: string;
  url: string;
  ua: string;
  ts: number;
  digest?: string;
}

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

function truncate(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) + '…[truncated]' : s;
}

/**
 * Beacon API 우선 — page unload 직전에도 안전 전송. fetch fallback.
 * 본 함수는 throw 안 함 — 에러 보고가 새 에러 만들면 무한 루프 위험.
 */
function send(payload: ErrorPayload): void {
  if (!isProd()) {
    log.error(payload, 'client error (dev)');
    return;
  }
  if (typeof navigator === 'undefined') return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 보고 자체 실패는 silent — 사용자 흐름 영향 0.
  }
}

function commonContext() {
  return {
    url:
      typeof window === 'undefined'
        ? ''
        : window.location.pathname + window.location.search,
    ua: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    ts: Date.now(),
  };
}

export function reportClientError(
  source: ErrorSource,
  error: unknown,
  extra?: { digest?: string },
): void {
  const message = (() => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  })();
  const stack = error instanceof Error ? error.stack : undefined;
  send({
    source,
    message: truncate(message, MAX_MESSAGE_CHARS) ?? 'Unknown',
    stack: truncate(stack, MAX_STACK_CHARS),
    ...commonContext(),
    digest: extra?.digest,
  });
}

/**
 * 전역 window 핸들러 등록 — providers.tsx 의 useEffect 한 곳에서 호출.
 * 이미 등록됐으면 no-op (HMR / strict mode 안전망).
 */
let installed = false;
export function installGlobalErrorReporters(): void {
  if (installed) return;
  if (typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    reportClientError('window-error', event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError('unhandled-rejection', event.reason);
  });
}
