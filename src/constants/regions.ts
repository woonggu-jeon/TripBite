/**
 * 충청북도 11개 시군
 *
 * 한 곳에 모아두는 이유:
 *   - 도장깨기(마이페이지), 지도, 토너먼트 필터, 시군별 랭킹 등 다양한 곳에서 사용
 *   - 정렬/표시 순서 일관성 보장
 *   - TourAPI sigunguCode 와의 매핑은 백엔드 측에서 처리 (id 만 사용)
 *
 * centroid: 시군 대표 좌표(시·군청 기준 근사). GPS 좌표 → 최근접 시군 매핑
 *   (편지 위치 regionCode 산출)에 사용 — BE reverse-geocoding 의존 제거. FE 전용.
 */
export const CHUNGBUK_REGIONS = [
  {
    code: 'cheongju',
    ko: '청주시',
    en: 'Cheongju',
    centroid: { lat: 36.6424, lng: 127.489 },
  },
  {
    code: 'chungju',
    ko: '충주시',
    en: 'Chungju',
    centroid: { lat: 36.991, lng: 127.9259 },
  },
  {
    code: 'jecheon',
    ko: '제천시',
    en: 'Jecheon',
    centroid: { lat: 37.1326, lng: 128.191 },
  },
  {
    code: 'boeun',
    ko: '보은군',
    en: 'Boeun',
    centroid: { lat: 36.4893, lng: 127.7294 },
  },
  {
    code: 'okcheon',
    ko: '옥천군',
    en: 'Okcheon',
    centroid: { lat: 36.3064, lng: 127.5714 },
  },
  {
    code: 'yeongdong',
    ko: '영동군',
    en: 'Yeongdong',
    centroid: { lat: 36.1749, lng: 127.7764 },
  },
  {
    code: 'jincheon',
    ko: '진천군',
    en: 'Jincheon',
    centroid: { lat: 36.8555, lng: 127.4355 },
  },
  {
    code: 'goesan',
    ko: '괴산군',
    en: 'Goesan',
    centroid: { lat: 36.8153, lng: 127.7866 },
  },
  {
    code: 'eumseong',
    ko: '음성군',
    en: 'Eumseong',
    centroid: { lat: 36.9403, lng: 127.6905 },
  },
  {
    code: 'danyang',
    ko: '단양군',
    en: 'Danyang',
    centroid: { lat: 36.9846, lng: 128.3654 },
  },
  {
    code: 'jeungpyeong',
    ko: '증평군',
    en: 'Jeungpyeong',
    centroid: { lat: 36.7846, lng: 127.5816 },
  },
] as const;

export type RegionCode = (typeof CHUNGBUK_REGIONS)[number]['code'];

export function getRegion(code: RegionCode) {
  return CHUNGBUK_REGIONS.find((r) => r.code === code);
}

export function isRegionCode(value: string): value is RegionCode {
  return CHUNGBUK_REGIONS.some((r) => r.code === value);
}
