/**
 * 알림 시드 — 무한스크롤 검증 위해 35개 (안 읽음 8 + 읽음 27).
 *
 * 타입 분포:
 *   - letter.received  : 12
 *   - letter.liked     : 8
 *   - tournament.shared: 7
 *   - event            : 5
 *   - security         : 3 (BE spec 신규)
 *
 * 정렬: createdAt DESC (최신 → 오래된). 무한스크롤 cursor offset 기준.
 */
type SeedType =
  | 'letter.received'
  | 'letter.liked'
  | 'tournament.shared'
  | 'event'
  | 'security';

const TYPE_SEQUENCE: SeedType[] = [
  'letter.received',
  'letter.liked',
  'tournament.shared',
  'event',
  'security',
];

export const notificationSeeds = Array.from({ length: 35 }, (_, i) => {
  const type = TYPE_SEQUENCE[i % TYPE_SEQUENCE.length] ?? 'event';
  // 첫 8개는 안 읽음 (badge 검증), 나머지 읽음.
  const read = i >= 8;
  // 가장 최근부터 시간 역순.
  const minutesAgo = i * 47 + 5; // 5분, 52분, 99분, ... 분포
  return {
    id: `n-${i + 1}`,
    type,
    read,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
});
