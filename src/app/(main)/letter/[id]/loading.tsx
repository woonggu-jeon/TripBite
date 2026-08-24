import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /letter/[id] — 편지 상세 자리잡이.
 *
 * 헤더를 같이 그리는 이유 — 상세 제목은 받은/보낸에 따라 갈려서 클라이언트가
 * 렌더한다. 그 사이 한 프레임 헤더가 사라지면 바가 깜빡이므로, 여기서 중립
 * 제목("다섯글자 편지")으로 자리를 잡아둔다.
 *
 * 본문 자리잡이는 실제 화면 규격(도착 블록 144 → 카드 274 → 버튼 52)에 맞춘다.
 */
export default async function LetterDetailLoading() {
  const t = await getTranslations('letter');
  return (
    <>
      <SubHeader title={t('title')} />
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-10)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-5)',
            justifyItems: 'center',
          }}
        >
          <Skeleton width={84} height={84} radius="full" />
          <Skeleton width="60%" height={20} radius="sm" />
        </div>
        <Skeleton width="100%" height={274} radius="lg" />
        <Skeleton width="100%" height={52} radius="md" />
      </div>
    </>
  );
}
