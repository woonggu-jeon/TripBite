'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { RegionContent } from '@/features/region/types';
import styles from './RegionContentRow.module.scss';

const TYPE_EMOJI = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
} as const;

/**
 * 시군 상세 row 카드 — 좌측 카테고리 이모지 + 가운데 제목/한줄소개 + 우측 화살표.
 *
 * 클릭 시 여행지 상세 페이지 (/destination/[id]) 로 이동. mock `/destinations/:id`
 * 가 regionContentSeeds 도 fallback 으로 탐색해 같은 endpoint 로 detail 응답.
 */
export function RegionContentRow({ content }: { content: RegionContent }) {
  return (
    <Link
      href={{ pathname: `/destination/${content.id}` }}
      className={`${styles.row} ${styles[content.type]}`}
      aria-label={content.title}
    >
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>{TYPE_EMOJI[content.type]}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{content.title}</h3>
        {content.summary && <p className={styles.summary}>{content.summary}</p>}
      </div>
      <span className={styles.chevron} aria-hidden>
        <ChevronRight size={16} />
      </span>
    </Link>
  );
}
