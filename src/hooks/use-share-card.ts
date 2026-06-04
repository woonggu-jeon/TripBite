'use client';

import { useTranslations } from 'next-intl';
import { shareWithImage } from '@/lib/share';
import { toast } from '@/lib/toast';

/**
 * OG 이미지 카드 공유 + status → toast 매핑 흐름 흡수.
 *
 * 사용처: TravelTypeResult / TournamentResultClient / StampsClient — 모두 동일한
 *   - shareWithImage 호출
 *   - status('copied' / 'copied-and-downloaded' / 'downloaded' / 'failed') → toast 매핑
 *
 * 사용:
 *   const shareCard = useShareCard();
 *   await shareCard({ imageUrl: '/api/og/master?count=11', filename: 'master.png' });
 *
 * 토스트 메시지는 `common.share*` i18n 키 사용 (이미 정의됨).
 */
export function useShareCard() {
  const t = useTranslations('common');
  return async function shareCard(params: {
    imageUrl: string;
    filename: string;
  }) {
    const status = await shareWithImage(params);
    if (status === 'copied-image') {
      toast.success(t('shareImageCopied'));
    } else if (status === 'copied-and-downloaded') {
      toast.success(t('shareCopiedAndDownloaded'));
    } else if (status === 'copied') toast.success(t('shareLinkCopied'));
    else if (status === 'downloaded') toast.success(t('shareDownloaded'));
    else if (status === 'failed') toast.error(t('shareFailed'));
    return status;
  };
}
