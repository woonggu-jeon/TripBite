'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { shareUrl } from '@/lib/share';
import { toast } from '@/lib/toast';
import styles from './DestinationActions.module.scss';

/**
 * 여행지 상세의 액션 row — 길찾기 + 공유.
 *
 * Spring DestinationDetailDto 는 좌표(coords)를 제공하지 않으므로, 길찾기는
 * **이름 기반 카카오맵 검색**으로 전환:
 *   https://map.kakao.com/link/search/{name}
 * name 은 항상 있어 길찾기 상시 노출. iOS/Android 카카오맵 앱 설치 시 자동 전환.
 * BE-TODO(§5 P2-5): DestinationDetailDto 에 coords(lat/lng) 추가 시, 아래 directionsHref
 * 를 좌표 기반 정밀 경로(`map.kakao.com/link/to/{name},{lat},{lng}`)로 승격 가능.
 */
export function DestinationActions({
  id,
  name,
  shareText,
}: {
  id: string;
  name: string;
  shareText?: string;
}) {
  const t = useTranslations('destination.actions');
  const tCommon = useTranslations('common');

  const handleShare = async () => {
    const result = await shareUrl({
      url: `/destination/${id}`,
      title: name,
      text: shareText ?? name,
    });
    if (result === 'copied') toast.success(tCommon('shareLinkCopied'));
    else if (result === 'failed') toast.error(tCommon('shareFailed'));
  };

  // 이름 기반 카카오맵 검색 (좌표 불필요). name 은 Spring 필수 필드.
  const directionsHref = `https://map.kakao.com/link/search/${encodeURIComponent(name)}`;

  return (
    <nav className={styles.row} aria-label={t('groupAria')}>
      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.btn} ${styles.directions}`}
      >
        <Icon name="location-18" size={18} />
        <span>{t('directions')}</span>
      </a>
      <button
        type="button"
        onClick={handleShare}
        className={`${styles.btn} ${styles.share}`}
      >
        <Icon name="share-18" size={18} />
        <span>{t('share')}</span>
      </button>
    </nav>
  );
}
