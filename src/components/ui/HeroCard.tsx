'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { MediaThumb } from './MediaThumb';
import styles from './HeroCard.module.scss';

/**
 * 텍스트 블록의 세로 정렬.
 *   - `center` — Figma `HOME · 홈` 의 hero (텍스트 세로 중앙)
 *   - `bottom` — Figma `visualCard` (랭킹 1위, 텍스트 하단)
 */
export type HeroCardAlign = 'center' | 'bottom';

interface HeroCardProps {
  /** 진입 경로. 없으면 링크 아닌 순수 표시용 블록으로 렌더. */
  href?: ComponentProps<typeof Link>['href'];
  /** 배경 사진 URL (TourAPI). http → https 정규화는 MediaThumb 담당. */
  imageUrl?: string | null;
  /** 사진 없을 때 fallback emoji */
  emoji: ReactNode;
  /** 제목 위 10px 라벨 (Figma `Caption/B_10`). 없으면 미노출 */
  eyebrow?: ReactNode;
  /** 20px 볼드 제목 (Figma `Title/B_20_130%`) */
  title: ReactNode;
  /** 제목 아래 12px 보조 줄 (Figma `Caption/R_12`) — 위치·횟수 등 */
  meta?: ReactNode;
  /** meta 앞 12px 아이콘 슬롯 (Figma `pin`) */
  metaIcon?: ReactNode;
  /** 제목 태그 — 페이지 내 heading 위계에 맞춰 호출 측이 지정 */
  titleAs?: 'h2' | 'h3' | 'p';
  align?: HeroCardAlign;
  /** next/image sizes — 사용처의 실제 렌더 폭 */
  sizes?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * 사진 배경 hero 카드 — 풀블리드 사진 + 좌→우 검정 scrim + 흰 텍스트.
 *
 * Figma `hero` 프레임 실측 (320x176, radius 12):
 *   - `hero-img`     : ABSOLUTE, IMAGE(FILL) + solid #A8B29C 플레이스홀더
 *   - `hero-overlay` : ABSOLUTE, linear-gradient 좌→우
 *                      rgba(0,0,0,.72) 0% → .40 40% → 0 72% → 0 100%
 *   - `hero-text`    : AUTO, gap 4, 좌측 padding, 흰 텍스트 3단
 *                      (Caption/B_10 → Title/B_20_130% → Caption/R_12)
 *
 * 4px 그리드: Figma 홈 인스턴스의 좌 padding 18px 은 그리드에서 벗어나므로,
 * 동일 컴포넌트의 랭킹 인스턴스가 쓰는 16px(`--space-4`) 로 통일.
 *
 * 사진 위 텍스트는 배경이 임의 이미지라 대비 수치를 확정할 수 없어,
 * scrim 이 얇아지는 우측 구간을 위해 `text-shadow` 를 legibility 보강으로 추가
 * (Figma 대응 없음). 텍스트 폭은 scrim 이 0 이 되는 72% 안으로 제한.
 */
export function HeroCard({
  href,
  imageUrl,
  emoji,
  eyebrow,
  title,
  meta,
  metaIcon,
  titleAs = 'h3',
  align = 'center',
  sizes = '(max-width: 720px) 100vw, 720px',
  ariaLabel,
  className,
}: HeroCardProps) {
  const TitleTag = titleAs;
  const cls = [styles.hero, styles[align], className].filter(Boolean).join(' ');

  const inner = (
    <>
      <MediaThumb
        src={imageUrl}
        emoji={emoji}
        sizes={sizes}
        className={styles.media}
        emojiClassName={styles.emoji}
      />
      <div className={styles.scrim} aria-hidden />
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <TitleTag className={styles.title}>{title}</TitleTag>
        {meta && (
          <p className={styles.meta}>
            {metaIcon && (
              <span className={styles.metaIcon} aria-hidden>
                {metaIcon}
              </span>
            )}
            {meta}
          </p>
        )}
      </div>
    </>
  );

  if (!href) {
    return (
      <div className={cls} aria-label={ariaLabel}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} prefetch={false} className={cls} aria-label={ariaLabel}>
      {inner}
    </Link>
  );
}
