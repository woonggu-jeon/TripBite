import type { Letter } from '@/features/letter/types';

/**
 * 편지함 시드 — 30개 (페이지네이션 테스트용)
 * Letter 타입 호환: id/body/author/arrivedAt/createdAt/isMine/liked/saved/likeCount
 */
const SAMPLE_BODIES = [
  '고마워요',
  '안녕히가',
  '잘있어요',
  '보고싶어',
  '오늘맑음',
  '꽃이폈어',
  '편지보낼',
  '봄이왔다',
  '잘지내요',
  '응원할게',
];

const LOCATIONS = [
  '충북 청주시',
  '충북 충주시',
  '충북 제천시',
  '충북 단양군',
  '충북 보은군',
  '충북 옥천군',
  '충북 영동군',
  '충북 진천군',
  '충북 괴산군',
  '충북 음성군',
  '충북 증평군',
];

const NICKNAMES = [
  '익명의 여행자',
  '봄바람',
  '청주산책가',
  '단양호반',
  '괴산고추',
  '제천음악광',
];

export const letterSeeds: Letter[] = Array.from({ length: 30 }, (_, i) => {
  const arrivedMs = Date.now() - i * 1800 * 1000; // 30분 간격
  const isMine = i % 5 === 0; // 6개는 내가 보낸 편지
  return {
    id: `letter-${i + 1}`,
    body: SAMPLE_BODIES[i % SAMPLE_BODIES.length] ?? '안녕하세',
    author: {
      nickname: NICKNAMES[i % NICKNAMES.length] ?? '익명의 여행자',
      location: LOCATIONS[i % LOCATIONS.length] ?? '충북 청주시',
    },
    arrivedAt: new Date(arrivedMs).toISOString(),
    createdAt: new Date(arrivedMs - 60 * 60 * 1000).toISOString(),
    isMine,
    liked: i % 4 === 0,
    saved: i % 6 === 0,
    likeCount: (i * 3) % 17,
    // 가장 최근 받은 편지 4개 (i=1..4) 미읽음 — NEW 배지 노출. 보낸 편지는 true (자기 글 읽음).
    read: isMine ? true : i >= 5,
  };
});
