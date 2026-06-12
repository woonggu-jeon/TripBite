'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MediaThumb } from '@/components/ui';
import type { RegionContentDto } from '@/api/generated/schemas';
import styles from './RegionContentRow.module.scss';

const TYPE_EMOJI: Partial<Record<RegionContentDto['type'], string>> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
};

/**
 * 시군 상세 row 카드 — 좌측 이미지(또는 emoji fallback) + 제목/한줄소개 + 화살표.
 *
 * 클릭 시 여행지 상세 페이지 (/destination/[id]) 로 이동.
 * imageUrl 있으면 TourAPI 실 이미지, 없으면 emoji + tone gradient.
 */
export function RegionContentRow({ content }: { content: RegionContentDto }) {
  return (
    <Link
      href={{ pathname: `/destination/${content.id}` }}
      prefetch={false}
      className={`${styles.row} ${styles[content.type]}`}
      aria-label={content.title}
    >
      <MediaThumb
        src={content.imageUrl}
        emoji={TYPE_EMOJI[content.type]}
        sizes="56px"
        className={styles.image}
        emojiClassName={styles.emoji}
      />
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
