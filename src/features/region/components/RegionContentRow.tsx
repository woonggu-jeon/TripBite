'use client';

import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { MediaThumb } from '@/components/ui';
import type { RegionContent } from '@/features/region/types';
import styles from './RegionContentRow.module.scss';

// BE 가 RegionContent 에는 'local' 카테고리 안 보내지만 generated DestinationCategory
// 는 4종 enum 이라 type-check 위해 fallback 키 추가.
const TYPE_EMOJI = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
  local: '🏘️',
} as const;

/**
 * 시군 상세 row 카드 — 좌측 이미지(또는 emoji fallback) + 제목/한줄소개 + 화살표.
 *
 * 클릭 시 여행지 상세 페이지 (/destination/[id]) 로 이동.
 * imageUrl 있으면 TourAPI 실 이미지, 없으면 emoji + tone gradient.
 */
export function RegionContentRow({ content }: { content: RegionContent }) {
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
