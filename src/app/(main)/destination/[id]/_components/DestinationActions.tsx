'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Share2 } from 'lucide-react';
import { shareUrl } from '@/lib/share';
import { toast } from '@/lib/toast';
import styles from './DestinationActions.module.scss';

/**
 * 여행지 상세의 액션 row — 길찾기 + 공유.
 *
 * 길찾기 라벨은 provider 중립 ("길찾기"). 실제 진입 URL 은 카카오맵 scheme 사용:
 *   https://map.kakao.com/link/to/{name},{lat},{lng}
 *
 * coords 가 있을 때만 길찾기 노출. 공유는 coords 무관 — 항상 노출.
 * iOS / Android 의 카카오맵 앱이 설치돼 있으면 web → 앱 자동 전환.
 *
 * provider 전환 (kakao ↔ naver) 시 directionsHref 변수만 교체하면 됨 — UI 변경 X.
 * 네이버 URL: https://map.naver.com/p?lat={lat}&lng={lng}&title={name}&type=address
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

  // provider 결정 — 현재 kakao 사용. naver 로 전환하려면 아래 한 줄만 교체.
  const directionsHref = coords
    ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${coords.lat},${coords.lng}`
    : null;
  // 네이버 대체 — 사용 시 directionsHref 위 줄 대신 아래 한 줄로 교체:
  // const directionsHref = coords
  //   ? `https://map.naver.com/p?lat=${coords.lat}&lng=${coords.lng}&title=${encodeURIComponent(name)}&type=address`
  //   : null;

  return (
    <nav className={styles.row} aria-label={t('groupAria')}>
      {directionsHref && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.directions}`}
        >
          <MapPin size={18} aria-hidden />
          <span>{t('directions')}</span>
        </a>
      )}
      <button
        type="button"
        onClick={handleShare}
        className={`${styles.btn} ${styles.share}`}
      >
        <Share2 size={18} aria-hidden />
        <span>{t('share')}</span>
      </button>
    </nav>
  );
}
