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
 *   fmt.compactNumber(12345);            // "1.2만"
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

  const compactNumber = useCallback(
    (n: number) => f.number(n, { notation: 'compact' }),
    [f],
  );

  return useMemo(
    () => ({ relativeTime, dateTime, date, compactNumber }),
    [relativeTime, dateTime, date, compactNumber],
  );
}
