import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TournamentPlayClient } from './_components/TournamentPlayClient';

/**
 * 토너먼트 진행 페이지 (/tournament/play)
 *
 * ─────────────────────────────────────────────────
 * 페이즈 (단일 페이지 내부에서 상태로 전환)
 * ─────────────────────────────────────────────────
 *
 *   Phase 1: 계절 일러스트
 *     - 화면 중앙에 계절 상징 일러스트 1개:
 *       봄 → 벚꽃나무, 여름 → 우산, 가을 → 단풍나무, 겨울 → 눈내리는 풍경
 *     - 해당 일러스트 클릭 시 작은 일러스트들이 화면에 흩날림:
 *       봄 → 벚꽃잎, 여름 → 물방울, 가을 → 단풍잎, 겨울 → 눈꽃
 *     - 동시에 충청북도 지도 위로 일러스트 N개(=토너먼트 갯수)가 랜덤 위치로 떨어짐
 *     - 떨어진 각 일러스트가 곧 토너먼트 참가 여행지로 사용됨
 *
 *   Phase 2: 토너먼트 매치업
 *     - 1:1 카드 대결, 사용자가 선택
 *     - 우승 시 다음 라운드 진행
 *     - 진행도 표시 (예: 16강 → 8강 → 4강 → 결승)
 *
 *   Phase 3: 우승 확정 → /tournament/result 자동 이동
 *
 * ─────────────────────────────────────────────────
 * 상태 / 데이터
 * ─────────────────────────────────────────────────
 *
 *   - store (Zustand): 설정값 (theme, category, count, seed)
 *   - server (TanStack Query):
 *       useRandomDestinations({ theme, category, count })
 *       → 백엔드가 조건에 맞는 여행지 N개 랜덤 반환
 *
 * 새로고침 시 store가 비어있으면 자동으로 /tournament 로 redirect.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return {
    title: t('inProgressTitle'),
    alternates: { canonical: '/tournament/play' },
    // 진행 화면은 store 상태 의존 — 공유 가치 없음, 색인 제외.
    robots: { index: false, follow: false },
  };
}

/**
 * 헤더는 `TournamentPlayClient` 가 직접 렌더한다 — 뒤로가기가 페이지 이탈이
 * 아니라 "직전 선택 취소 / 이전 단계"로 동작해야 해서 phase 상태가 필요하다.
 */
export default function TournamentPlayPage() {
  return <TournamentPlayClient />;
}
