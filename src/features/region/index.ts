/**
 * Region feature — Public API
 *
 * 사용처:
 *   - /region (지도)
 *   - /region/[code] (시군 상세 — 관광지/축제/체험)
 *   - 홈: 진행 중 축제 캐러셀
 *   - /mypage/stamps: 도장책 (ChungbukStampMap 직접 사용)
 *   - 토너먼트 필터: 지역 선택
 */
export { regionApi } from './api/region';
export { RegionHero } from './components/RegionHero';
export {
  useRegionSummary,
  useRegionContents,
  useOngoingFestivals,
  regionKeys,
} from './hooks/use-region';
