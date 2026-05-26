/**
 * List feature — Public API
 *
 * 사용:
 *   import { useInfiniteList, InfiniteList } from '@/features/list';
 *
 * 적용 권장 위치:
 *   - 편지함 (받은/보낸/저장/좋아요)
 *   - 토너먼트 기록
 *   - 시군 상세의 관광지/축제/체험 탭
 *   - 마이페이지 저장된 우승지 (10개 미만이라 페이징 불필요할 수 있음 — 그땐 일반 useQuery)
 */
export { useInfiniteList } from './hooks/use-infinite-list';
export { InfiniteList } from './components/InfiniteList';
export type { PageResponse } from './hooks/use-infinite-list';
