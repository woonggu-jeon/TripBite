'use client';

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
 */
export function RegionContentRow({ content }: { content: RegionContent }) {
  return (
    <article
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
    </article>
  );
}
