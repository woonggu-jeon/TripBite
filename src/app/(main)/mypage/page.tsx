import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { MyPageClient } from './_components/MyPageClient';

/**
 * 마이페이지 (/mypage) — 사이트맵 v2
 *
 * 섹션 (위 → 아래):
 *   1) 프로필 카드
 *      - 닉네임 + 여행 유형 뱃지 (있다면)
 *      - "유형 테스트 받기" CTA (미완료 시)
 *
 *   2) 충북 11개 시군 도장깨기 🗺️
 *      - RegionStampMap (SVG 지도 위에 도장 오버레이)
 *      - 진행률 "X/11 완료"
 *
 *   3) 토너먼트 우승지 저장 (최대 20개)
 *      - 카드 그리드 또는 가로 캐러셀
 *      - 카드 클릭 → 결과 페이지 재진입 또는 모달
 *      - 삭제 버튼 개별
 *
 *   4) 토너먼트 기록
 *      - 모든 토너먼트 진행 이력 (저장 안 한 것도 포함, InfiniteList)
 *      - 일시 + 우승지 + 카테고리
 *
 *   5) 편지함 (4탭)
 *      - 받은 / 좋아요 / 저장 / 보낸
 *      - 각 탭은 InfiniteList
 *
 *   6) (계정 액션은 /settings 페이지로 이동)
 *
 * 성능:
 *   - 페이지 자체는 Server Component
 *   - 각 섹션은 자체 useQuery (parallel)
 *   - 도장맵 진행률 / 우승지는 마이페이지 summary 한 번에 + 편지 4탭은 lazy
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mypage');
  return { title: t('title') };
}

export default function MyPage() {
  return <MyPageClient />;
}
