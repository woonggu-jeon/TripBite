import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { TournamentResultClient } from './_components/TournamentResultClient';

/**
 * 토너먼트 결과 페이지 (/tournament/result)
 *
 * 우승 여행지 확정 후 표시되는 결과 화면.
 *
 * 섹션:
 *   1) 우승 여행지 정보 및 특징
 *      - 대표 이미지, 이름, 카테고리(축제/관광지/체험관광),
 *        한줄 소개, 위치, 운영시간 등
 *      - 데이터: useDestination(winnerId)
 *
 *   2) 행운의 색
 *      - 우승 여행지의 ID/이름을 시드로 사용한 의사난수 색상 1개
 *      - features/tournament/utils/lucky-color.ts 의 deriveLuckyColor()
 *      - 색 원 + hex 코드 + 짧은 해석 문구
 *
 *   3) 여행에서 인연을 만날 확률 — 사다리타기
 *      - 4~6개의 세로줄 + 가로 다리(랜덤) SVG 사다리
 *      - 사용자가 상단 칸 1개 선택 → 애니메이션으로 따라 내려가서 결과 칸 도착
 *      - 결과 칸 값: "5%", "30%", "60%", "99%" 등 (라벨 텍스트)
 *      - 컴포넌트: <LuckyLadder seed={winnerId} />
 *
 *   4) 저장 / 재시도 액션
 *      - "마이페이지에 저장하시겠습니까?" → POST /mypage/tournaments
 *        (마이페이지엔 최대 20개 보관, 초과 시 사용자에게 교체 선택 UI 노출)
 *      - "다시 하시겠습니까?" → store 초기화 + router.replace('/tournament')
 *
 * 새로고침 / 직접 진입 시 store에 winner 없으면 /tournament 로 복귀.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return {
    title: t('resultTitle'),
    alternates: { canonical: '/tournament/result' },
    // 결과는 store 의존 + ?id= deep-link 도 사용자별 — 색인 제외.
    robots: { index: false, follow: false },
  };
}

export default async function TournamentResultPage() {
  const t = await getTranslations('tournament');
  return (
    <>
      <SubHeader title={t('resultTitle')} />
      <TournamentResultClient />
    </>
  );
}
