'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { secureImageUrl } from '@/lib/secure-image-url';
import styles from './HomeHero.module.scss';

/**
 * 홈 hero — Figma "HOME · 홈 · hero-block" (2026-06-23).
 *
 * 단일 큰 카드 (이전 RecommendationBanner 의 5-slide carousel 폐기). 추천
 * top 1 destination 의 image + 90deg dark overlay + eyebrow / title / 📍
 * footer.
 *
 * spec:
 *   - 320×176 radius 12 overflow hidden, padding 0 0 0 18.
 *   - hero-img: absolute fill, bg image + #A8B29C fallback.
 *   - hero-overlay: linear-gradient 90deg rgba(0,0,0,0.72→0.4→0).
 *   - hero-text z2:
 *     · eyebrow Inter ExtraBold 11.5 ls 0.04em opacity 0.95.
 *     · title Inter ExtraBold 21 line 126% ls -0.035em.
 *     · 📍 footer Medium 12 opacity 0.9.
 *
 * 데이터: useRecommendedDestinations(5) → [0] 만 사용. TanStack Query cache
 * 공유 — HomeRecBlock 가 같은 hook 호출 시 한 번 fetch.
 */
export function HomeHero() {
  const t = useTranslations('home.hero');
  const { data, isLoading } = useRecommendedDestinations(5);

  if (isLoading) {
    return <Skeleton width="100%" height={176} radius="md" />;
  }
  const item = data?.[0]?.destination;
  if (!item) return null;

  const region = CHUNGBUK_REGIONS.find((r) => r.code === item.region);
  const regionKo = region?.ko ?? item.region;
  const safeImg = secureImageUrl(item.imageUrl);

  return (
    <Link
      href={{ pathname: `/destination/${item.id}` }}
      className={styles.hero}
      aria-label={`${item.name} · ${regionKo}`}
    >
      <div className={styles.heroImg} aria-hidden>
        {safeImg && (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 360px"
            className={styles.heroImage}
            priority
          />
        )}
      </div>
      <div className={styles.heroOverlay} aria-hidden />
      <div className={styles.heroText}>
        <span className={styles.heroEyebrow}>{t('eyebrow')}</span>
        <h2 className={styles.heroTitle}>{t('title')}</h2>
        <span className={styles.heroFooter}>
          <MapPin size={12} aria-hidden />
          <span>
            {regionKo} · {item.name}
          </span>
        </span>
      </div>
    </Link>
  );
}
