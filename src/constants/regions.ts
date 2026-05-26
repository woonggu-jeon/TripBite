/**
 * 충청북도 11개 시군
 *
 * 한 곳에 모아두는 이유:
 *   - 도장깨기(마이페이지), 지도, 토너먼트 필터, 시군별 랭킹 등 다양한 곳에서 사용
 *   - 정렬/표시 순서 일관성 보장
 *   - TourAPI sigunguCode 와의 매핑은 백엔드 측에서 처리 (id 만 사용)
 */
export const CHUNGBUK_REGIONS = [
  { code: 'cheongju', ko: '청주시', en: 'Cheongju' },
  { code: 'chungju', ko: '충주시', en: 'Chungju' },
  { code: 'jecheon', ko: '제천시', en: 'Jecheon' },
  { code: 'boeun', ko: '보은군', en: 'Boeun' },
  { code: 'okcheon', ko: '옥천군', en: 'Okcheon' },
  { code: 'yeongdong', ko: '영동군', en: 'Yeongdong' },
  { code: 'jincheon', ko: '진천군', en: 'Jincheon' },
  { code: 'goesan', ko: '괴산군', en: 'Goesan' },
  { code: 'eumseong', ko: '음성군', en: 'Eumseong' },
  { code: 'danyang', ko: '단양군', en: 'Danyang' },
  { code: 'jeungpyeong', ko: '증평군', en: 'Jeungpyeong' },
] as const;

export type RegionCode = (typeof CHUNGBUK_REGIONS)[number]['code'];

export function getRegion(code: RegionCode) {
  return CHUNGBUK_REGIONS.find((r) => r.code === code);
}

export function isRegionCode(value: string): value is RegionCode {
  return CHUNGBUK_REGIONS.some((r) => r.code === value);
}
