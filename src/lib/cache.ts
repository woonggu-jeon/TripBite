/**
 * TanStack Query 캐시 정책
 *
 * 리소스별 갱신 특성에 따라 stale/gc 시간 표준화.
 * 각 hook 에서 import 해서 일관 적용 → 휴면 메모리 / 불필요한 재요청 방지.
 *
 * stale: "오래되었다" 표시 시점. 그 전엔 cache hit만으로 즉시 반환.
 * gc:    inactive 상태에서 메모리 보관 시간. 만료 시 캐시 폐기.
 *
 * 원칙:
 *   - 자주 안 바뀜 → stale 길게, gc 길게 (충북 시군 리스트 등)
 *   - 사용자별 데이터 → stale 보통, gc 짧게 (마이페이지)
 *   - 실시간성 → stale 짧게 + 폴링 (편지 도착 알림)
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const CACHE = {
  /** 거의 불변 (충북 시군 메타, 행정구역 등) */
  static: {
    staleTime: DAY,
    gcTime: 7 * DAY,
  },
  /** 변화가 느림 (TourAPI 여행지 정보, 시군 상세) */
  slow: {
    staleTime: 30 * MINUTE,
    gcTime: 2 * HOUR,
  },
  /** 보통 (랭킹, 인기 차트) */
  normal: {
    staleTime: 5 * MINUTE,
    gcTime: 30 * MINUTE,
  },
  /** 사용자 데이터 (마이페이지, /me) */
  user: {
    staleTime: 2 * MINUTE,
    gcTime: 10 * MINUTE,
  },
  /** 실시간성 — 폴링과 결합 */
  realtime: {
    staleTime: 30 * SECOND,
    gcTime: 5 * MINUTE,
    refetchInterval: 30 * SECOND,
  },
  /** 한 번 가져오면 세션 내 고정 (토너먼트 후보 여행지) */
  session: {
    staleTime: Infinity,
    gcTime: HOUR,
  },
  /** 날씨 — 시간 단위로 변화 */
  weather: {
    staleTime: 15 * MINUTE,
    gcTime: HOUR,
  },
} as const;

export type CacheProfile = keyof typeof CACHE;
