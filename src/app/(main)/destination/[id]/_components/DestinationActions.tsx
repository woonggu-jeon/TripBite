'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { shareUrl } from '@/lib/share';
import { toast } from '@/lib/toast';
import styles from './DestinationActions.module.scss';

/**
 * 여행지 상세의 액션 row — 길찾기 (카카오/네이버) + 공유.
 *
 * 카카오맵 URL scheme:
 *   https://map.kakao.com/link/to/{name},{lat},{lng}
 *
 * 네이버맵 URL scheme:
 *   https://map.naver.com/p?lat={lat}&lng={lng}&title={name}&type=address
 *
 * 둘 다 외부 키 불필요. coords 가 있을 때만 노출 (없으면 길찾기 버튼 미렌더).
 * 공유는 coords 무관 — 항상 노출.
 *
 * iOS / Android 의 카카오맵/네이버맵 앱이 설치돼 있으면 web → 앱 자동 전환
 * (각 사이트의 `intent://` 또는 universal link 처리).
 */
export function DestinationActions({
  id,
  name,
  coords,
  shareText,
}: {
  id: string;
  name: string;
  coords?: { lat: number; lng: number };
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

  const kakaoHref = coords
    ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${coords.lat},${coords.lng}`
    : null;

  const naverHref = coords
    ? `https://map.naver.com/p?lat=${coords.lat}&lng=${coords.lng}&title=${encodeURIComponent(name)}&type=address`
    : null;

  return (
    <nav className={styles.row} aria-label={t('groupAria')}>
      {kakaoHref && (
        <a
          href={kakaoHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.kakao}`}
        >
          <MapPin size={16} aria-hidden />
          <span>{t('kakao')}</span>
        </a>
      )}
      {naverHref && (
        <a
          href={naverHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.naver}`}
        >
          <Navigation size={16} aria-hidden />
          <span>{t('naver')}</span>
        </a>
      )}
      <button
        type="button"
        onClick={handleShare}
        className={`${styles.btn} ${styles.share}`}
      >
        <Share2 size={16} aria-hidden />
        <span>{t('share')}</span>
      </button>
    </nav>
  );
}
