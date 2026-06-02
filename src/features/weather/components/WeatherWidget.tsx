'use client';

import { useTranslations } from 'next-intl';
import { Cloud, CloudRain, CloudSnow, Sun, CloudFog, Zap } from 'lucide-react';
import { useCurrentWeather } from '@/features/weather/hooks/use-weather';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useLocationStore } from '@/stores/location-store';
import type { WeatherCondition } from '@/features/weather/types';
import styles from './WeatherWidget.module.scss';

/**
 * <WeatherWidget />
 *
 * 홈 대시보드의 위치+날씨 카드.
 *
 * 표시: condition icon + 온도 + 시군 라벨 + 한 줄 코멘트 (summary).
 *
 * 데이터:
 *   - location-store 의 resolved.coords 사용 (이미 위치 동의 완료한 경우만)
 *   - useCurrentWeather(coords) — 15분 cache
 *
 * 분기:
 *   - 위치 미동의 / 좌표 없음 → render 안 함 (null)
 *   - isLoading → Skeleton
 *   - isError → null (silent — 홈 핵심 흐름 방해 X)
 *
 * 디자이너 시안 받으면 icon / 그라데이션 / typography 만 교체.
 */
const CONDITION_ICON: Record<WeatherCondition, typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  foggy: CloudFog,
  stormy: Zap,
};

export function WeatherWidget() {
  const t = useTranslations('weather');
  const resolved = useLocationStore((s) => s.resolved);
  const coords = resolved
    ? {
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        accuracy: resolved.accuracy,
      }
    : undefined;
  const { data, isLoading, isError } = useCurrentWeather(coords);

  if (!coords) return null;
  if (isLoading) {
    return <Skeleton width="100%" height={88} radius="lg" />;
  }
  if (isError || !data) return null;

  const Icon = CONDITION_ICON[data.condition];
  const ariaLabel = `${data.locationLabel ?? ''} ${t(`condition.${data.condition}`)} ${Math.round(data.temperature)}도`;

  return (
    <section
      className={`${styles.card} ${styles[data.condition]}`}
      aria-label={ariaLabel}
    >
      <div className={styles.iconWrap} aria-hidden>
        <Icon size={28} />
      </div>
      <div className={styles.body}>
        <p className={styles.location}>
          {data.locationLabel ?? t('locationFallback')}
        </p>
        <p className={styles.summary}>
          {data.summary ?? t(`condition.${data.condition}`)}
        </p>
      </div>
      <div className={styles.temp} aria-hidden>
        <span className={styles.tempValue}>{Math.round(data.temperature)}</span>
        <span className={styles.tempUnit}>°</span>
      </div>
    </section>
  );
}
