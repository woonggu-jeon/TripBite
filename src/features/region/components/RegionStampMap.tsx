'use client';

/**
 * <RegionStampMap />
 *
 * 마이페이지 "충북 11개 시군 도장깨기" 위젯.
 *
 * 표시:
 *   - ChungbukSvgMap 재사용
 *   - 방문/우승한 시군은 fill 색상 변경 + 도장 아이콘 오버레이
 *   - 진행률 (예: "5/11 완료")
 *
 * 데이터:
 *   - GET /mypage/stamps → { regions: RegionCode[], totalVisited }
 *   - "방문" 정의는 백엔드와 합의 필요:
 *     · 옵션 A: 해당 시군에서 토너먼트 1회 이상 우승
 *     · 옵션 B: 해당 시군 콘텐츠 1회 이상 조회
 *     · 옵션 C: A + B 조합
 */
export function RegionStampMap() {
  return null;
}
