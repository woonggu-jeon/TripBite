import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { LetterDetailClient } from './_components/LetterDetailClient';

/**
 * 편지 상세 noindex — robots.ts disallow (`/letter/`) 와 이중 가드.
 * 받은 편지 본문 (5글자 + 개인 location label) 검색 노출 방지.
 * 2026-06-19 Round 17 audit.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('letter.detail');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

/**
 * 편지 상세 페이지 (/letter/[id])
 *
 * 도착한 편지 카드 클릭 시 진입.
 *
 * 표시:
 *   - 원고지 일러스트 위에 5글자 본문 노출
 *   - 닉네임 (없으면 "익명의 여행자")
 *   - 보낸 위치 (예: "충북 청주시")
 *   - 좋아요 버튼 (토글)
 *     - 누르면 보낸 사람에게 알림 발송 (서버 측 push)
 *   - 저장 버튼
 *     - 저장 X: 3일 후 자동 삭제
 *     - 저장 O: 마이페이지에서 영구 보관 + 삭제 가능
 *
 * 데이터:
 *   - useLetter(id) — features/letter
 *   - useLikeLetter(), useSaveLetter()
 *
 * 인증/소유권:
 *   - 받은 편지의 수신자가 아닌 사용자가 접근 시 404
 *   - 서버 측 검증 필수
 */
type Props = {
  params: Promise<{ id: string }>;
};

export default async function LetterDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('letter.detail');
  return (
    <>
      <SubHeader title={t('title')} />
      <LetterDetailClient letterId={id} />
    </>
  );
}
