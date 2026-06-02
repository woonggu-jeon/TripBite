'use client';

import { useFormatter } from 'next-intl';
import { useCallback, useMemo } from 'react';

/**
 * 날짜/숫자 포맷 훅 — next-intl useFormatter 래핑
 *
 * date-fns/dayjs 불필요 (README 방침): next-intl이 Intl 기반 locale 포맷 제공.
 *
 * 사용:
 *   const fmt = useFormat();
 *   fmt.relativeTime(letter.arrivedAt);  // "3시간 전"
 *   fmt.dateTime(letter.createdAt);      // "2026. 5. 27. 오후 2:30"
 *   fmt.date(letter.createdAt);          // "2026. 5. 27."
 *   fmt.dateLong(letter.createdAt);      // "2026년 5월 27일 화요일"
 *   fmt.time(letter.createdAt);          // "오후 2:30"
 *   fmt.number(12345);                   // "12,345"
 *   fmt.compactNumber(12345);            // "1.2만"
 *   fmt.percent(0.842);                  // "84%"
 */
export function useFormat() {
  const f = useFormatter();

  const relativeTime = useCallback(
    (iso: string | number | Date) => f.relativeTime(new Date(iso)),
    [f],
  );

  const dateTime = useCallback(
    (iso: string | number | Date) =>
      f.dateTime(new Date(iso), { dateStyle: 'medium', timeStyle: 'short' }),
    [f],
  );

  const date = useCallback(
    (iso: string | number | Date) =>
      f.dateTime(new Date(iso), { dateStyle: 'medium' }),
    [f],
  );

  const dateLong = useCallback(
    (iso: string | number | Date) =>
      f.dateTime(new Date(iso), { dateStyle: 'full' }),
    [f],
  );

  const time = useCallback(
    (iso: string | number | Date) =>
      f.dateTime(new Date(iso), { timeStyle: 'short' }),
    [f],
  );

  const number = useCallback((n: number) => f.number(n), [f]);

  const compactNumber = useCallback(
    (n: number) => f.number(n, { notation: 'compact' }),
    [f],
  );

  const percent = useCallback(
    (ratio: number, fractionDigits = 0) =>
      f.number(ratio, {
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    [f],
  );

  return useMemo(
    () => ({
      relativeTime,
      dateTime,
      date,
      dateLong,
      time,
      number,
      compactNumber,
      percent,
    }),
    [
      relativeTime,
      dateTime,
      date,
      dateLong,
      time,
      number,
      compactNumber,
      percent,
    ],
  );
}
