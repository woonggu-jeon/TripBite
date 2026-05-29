/**
 * 상대 시간 포맷터 — 도착/생성 시각을 "방금 전 / N분 전 / N시간 전 / N일 전"으로.
 *
 * i18n 분리:
 *   - 이 함수는 라벨 키만 결정.
 *   - 라벨 본문은 호출자가 useTranslations 로 받아 t(token, params) 처리.
 *
 * 1주일 초과는 'date' 토큰 — 호출자가 useFormatter().dateTime() 등으로 처리.
 */

export type RelativeTimeToken =
  | { kind: 'justNow' }
  | { kind: 'minutes'; value: number }
  | { kind: 'hours'; value: number }
  | { kind: 'days'; value: number }
  | { kind: 'date' };

export function relativeTimeToken(isoOrDate: string | Date): RelativeTimeToken {
  const t =
    typeof isoOrDate === 'string'
      ? new Date(isoOrDate).getTime()
      : isoOrDate.getTime();
  const diff = Date.now() - t;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return { kind: 'justNow' };
  const m = Math.floor(s / 60);
  if (m < 60) return { kind: 'minutes', value: m };
  const h = Math.floor(m / 60);
  if (h < 24) return { kind: 'hours', value: h };
  const d = Math.floor(h / 24);
  if (d < 7) return { kind: 'days', value: d };
  return { kind: 'date' };
}
