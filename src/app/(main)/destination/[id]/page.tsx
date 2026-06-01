import { DestinationDetailClient } from './_components/DestinationDetailClient';

/**
 * 여행지 상세 (/destination/[id])
 *
 * 진입 경로:
 *   - 시군 상세 (/region/[code]) 의 콘텐츠 row 클릭
 *   - 토너먼트 결과의 우승지 (deep-link 도입 시)
 *
 * 데이터:
 *   - `useDestinationDetail(id)` → GET /destinations/:id
 *   - mock 은 destinationSeeds + regionContentSeeds 둘 다 탐색
 *
 * SubHeader title 은 fetched detail.name 으로 동적 결정해야 하므로 client 가
 * 통째로 담당 (server 가 빈 SubHeader 를 먼저 그리면 client SubHeader 와 두 번
 * 겹쳐 보임).
 */
type Props = { params: Promise<{ id: string }> };

export default async function DestinationDetailPage({ params }: Props) {
  const { id } = await params;
  return <DestinationDetailClient id={id} />;
}
