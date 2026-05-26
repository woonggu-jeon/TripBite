/**
 * 편지함 시드 — 30개 (페이지네이션 테스트용)
 */
const SAMPLE_BODIES = ['고마워요', '안녕히가', '잘있어요', '보고싶어', '오늘맑음', '꽃이폈어'];

export const letterSeeds = Array.from({ length: 30 }, (_, i) => ({
  id: `letter-${i + 1}`,
  body: SAMPLE_BODIES[i % SAMPLE_BODIES.length],
  fromAnonymous: true,
  location: '충북 청주시',
  receivedAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
  liked: i % 4 === 0,
  saved: i % 6 === 0,
}));
