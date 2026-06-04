'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Share2 } from 'lucide-react';
import { shareUrl } from '@/lib/share';
import { toast } from '@/lib/toast';
import styles from './DestinationActions.module.scss';

/**
 * 여행지 상세의 액션 row — 카카오 길찾기 + 공유.
 *
 * 카카오맵 URL scheme:
 *   https://map.kakao.com/link/to/{name},{lat},{lng}
 *
 * coords 가 있을 때만 길찾기 노출. 공유는 coords 무관 — 항상 노출.
 * iOS / Android 의 카카오맵 앱이 설치돼 있으면 web → 앱 자동 전환.
 *
 * 네이버 길찾기는 사용자 요청으로 일단 미노출 (재노출 대비 코드 주석 유지).
 * 재오픈 시: import 의 Navigation 아이콘 + naverHref 변수 + 네이버 <a> 블록 주석 해제.
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

  // 네이버 길찾기 — 미노출 (사용자 요청). 재노출 시 import 의 Navigation 아이콘과
  // 함께 아래 변수/링크 블록 주석 해제.
  // const naverHref = coords
  //   ? `https://map.naver.com/p?lat=${coords.lat}&lng=${coords.lng}&title=${encodeURIComponent(name)}&type=address`
  //   : null;

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
      {/* 네이버 길찾기 — 미노출 (사용자 요청). 추후 복원 시 주석 해제.
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
      */}
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
