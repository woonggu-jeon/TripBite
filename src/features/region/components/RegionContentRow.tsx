'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { secureImageUrl } from '@/lib/secure-image-url';
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
  const safeImg = secureImageUrl(content.imageUrl);
  return (
    <Link
      href={{ pathname: `/destination/${content.id}` }}
      prefetch={false}
      className={`${styles.row} ${styles[content.type]}`}
      aria-label={content.title}
    >
      <div className={styles.image} aria-hidden>
        {safeImg ? (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="56px"
            className={styles.photo}
          />
        ) : (
          <span className={styles.emoji}>{TYPE_EMOJI[content.type]}</span>
        )}
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
