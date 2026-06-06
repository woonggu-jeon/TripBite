/**
 * 알림 시드 — 무한스크롤 + 4종 명세 데모 (안 읽음 8 + 읽음 27 = 35).
 *
 * BE 명세 4종 (2026-06-06):
 *   - letter.received   : 새 편지 도착 (지역+글자수 동적)
 *   - letter.delivered  : 보낸 편지 전달 완료 (신규 type)
 *   - event (master)    : 충북 마스터 달성 — link=/mypage
 *   - event (savedFull) : 우승지 저장 한도 — link=/mypage?tab=saved
 *
 * 정렬: createdAt DESC.
 */
type SeedType =
  | 'letter.received'
  | 'letter.liked'
  | 'letter.delivered'
  | 'tournament.shared'
  | 'event'
  | 'security';

type Seed = {
  id: string;
  type: SeedType;
  read: boolean;
  createdAt: string;
  title?: string;
  body?: string;
  link?: string;
};

const TYPE_SEQUENCE: SeedType[] = [
  'letter.received',
  'letter.delivered',
  'letter.liked',
  'tournament.shared',
  'event',
  'security',
];

// 명세 4종 demo — 가장 최근 (위쪽) 에 노출.
const SHOWCASE: Seed[] = [
  {
    id: 'n-showcase-1',
    type: 'letter.received',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    title: '청주시에서 3글자 편지가 왔어요',
    link: '/letter/letter-1',
  },
  {
    id: 'n-showcase-2',
    type: 'letter.delivered',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    title: '내 편지가 누군가에게 도착했어요 ✈',
    link: '/letters?tab=sent',
  },
  {
    id: 'n-showcase-3',
    type: 'event',
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    title: '충북 마스터 카드를 공유해보세요!',
    link: '/mypage',
  },
  {
    id: 'n-showcase-4',
    type: 'event',
    read: false,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    title: '우승지가 꽉 찼어요! 삭제 후 저장하세요',
    link: '/mypage?tab=saved',
  },
];

// 일반 알림 35개 (무한스크롤 검증).
const GENERIC: Seed[] = Array.from({ length: 35 }, (_, i) => {
  const type = TYPE_SEQUENCE[i % TYPE_SEQUENCE.length] ?? 'event';
  const read = i >= 4; // 위쪽 4개 미읽음.
  const minutesAgo = i * 47 + 120;
  return {
    id: `n-${i + 1}`,
    type,
    read,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
});

export const notificationSeeds: Seed[] = [...SHOWCASE, ...GENERIC];
