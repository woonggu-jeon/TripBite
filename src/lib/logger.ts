import pino, { type Logger, type LoggerOptions } from 'pino';

/**
 * 공통 로거 — pino 기반, **browser + server 공용** 단일 진입점.
 *
 * 정책:
 * - **운영(production)에서는 노출 X** — level `silent` 로 어떤 로그도 출력하지 않음
 *   (운영 관측은 `client-error-reporter` 의 beacon 이 담당). test 도 노이즈 방지로 silent.
 * - **개발 편의 색상**: 브라우저 콘솔에 레벨별 색상 태그(`%c`)로 출력(개발자 주 화면).
 *   서버(node)는 pino 기본 구조화 출력 — 색상이 필요하면 `next dev | npx pino-pretty`.
 *   (pino transport(worker)는 Next 번들 서버에서 모듈 해석이 취약해 미사용)
 * - level: dev 는 `NEXT_PUBLIC_LOG_LEVEL` 우선(없으면 debug).
 *
 * 사용:
 *   import { logger, createLogger } from '@/lib/logger';
 *   logger.info({ userId }, 'signed in');
 *   const log = createLogger('tournament');   // scope child
 *
 * 주의: 민감정보(PII/토큰)는 로그에 남기지 말 것.
 */
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// 운영/테스트는 완전 침묵(노출 X). 개발만 실제 출력.
const level: pino.LevelWithSilent =
  isProd || isTest
    ? 'silent'
    : ((process.env.NEXT_PUBLIC_LOG_LEVEL as pino.Level) ?? 'debug');

/** pino level(number) → 브라우저 표시 메타(라벨/색/console 메서드). */
const LEVEL_META: Record<
  number,
  { label: string; css: string; method: 'debug' | 'info' | 'warn' | 'error' }
> = {
  10: { label: 'TRACE', css: 'color:#9ca3af', method: 'debug' },
  20: { label: 'DEBUG', css: 'color:#6b7280', method: 'debug' },
  30: { label: 'INFO', css: 'color:#3b82f6', method: 'info' },
  40: { label: 'WARN', css: 'color:#f59e0b', method: 'warn' },
  50: { label: 'ERROR', css: 'color:#ef4444', method: 'error' },
  60: { label: 'FATAL', css: 'color:#fff;background:#ef4444', method: 'error' },
};

/**
 * 브라우저 콘솔 컬러 출력 — `%c` CSS 로 레벨 태그만 색칠.
 * `LEVEL [time] (scope) msg { ...fields }` 형태.
 */
function browserWrite(obj: object): void {
  const o = obj as {
    level: number;
    time?: number;
    scope?: string;
    msg?: string;
    [k: string]: unknown;
  };
  const meta = LEVEL_META[o.level] ?? LEVEL_META[30]!;
  const rest: Record<string, unknown> = { ...o };
  delete rest.level;
  delete rest.time;
  delete rest.scope;
  delete rest.msg;
  const time = new Date(o.time ?? Date.now()).toLocaleTimeString('en-GB');
  const head = `%c${meta.label}%c ${time}${o.scope ? ` (${o.scope})` : ''}${o.msg ? ` ${o.msg}` : ''}`;
  const args: unknown[] = [
    head,
    `${meta.css};font-weight:700`,
    'color:inherit;font-weight:400',
  ];
  if (Object.keys(rest).length > 0) args.push(rest);
  // eslint-disable-next-line no-console -- 로거 자체의 브라우저 sink (dev 전용, prod 는 silent)
  console[meta.method](...args);
}

const options: LoggerOptions = {
  level,
  // pid/hostname 등 base 필드 제거 — browser/edge 안전 + 노이즈 감소.
  base: undefined,
  browser: {
    asObject: true,
    // dev 만 실제 출력(prod/test 는 level=silent 로 write 도달 전 차단).
    write: browserWrite,
  },
};

export const logger: Logger = pino(options);

/**
 * 스코프(기능/모듈)별 child 로거.
 * @param scope 로그에 `scope` 필드로 붙는 식별자 (예: 'auth', 'api').
 * @param bindings 공통으로 붙일 추가 필드.
 */
export function createLogger(
  scope: string,
  bindings: Record<string, unknown> = {},
): Logger {
  return logger.child({ scope, ...bindings });
}
