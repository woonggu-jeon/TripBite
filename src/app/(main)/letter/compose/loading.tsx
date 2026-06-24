import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /letter/compose cold start fallback — LetterComposeForm layout 정합.
 *
 * 구조 (LetterComposeForm.module.scss `.form` gap var(--space-5)):
 *   1) intro — 2줄 center text (introMain B_16 + introSub R_14).
 *   2) inputSection — label + PinLikeInput (5칸, ≈72h) + count row (우측 정렬).
 *   3) anonymous box — checkbox row, 1px border, padding 0.75/0.875rem.
 *   4) locationSection — primary-fade bg, 1px border, padding 0.875/1rem,
 *      MapPin 16 + 2줄 텍스트 / 권한 요청 버튼.
 *   5) actions — grid 1fr/2fr 2-button row 48h.
 */
export default function LetterComposeLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-5)',
      }}
    >
      <SubHeaderSkeleton />
      {/* intro — 2줄 center. */}
      <div
        style={{
          display: 'grid',
          gap: 4,
          justifyItems: 'center',
        }}
      >
        <Skeleton width="70%" height={22} radius="sm" />
        <Skeleton width="50%" height={18} radius="sm" />
      </div>

      {/* inputSection — label + PIN 5칸 + count row. */}
      <div style={{ display: 'grid', gap: 8 }}>
        <Skeleton width={80} height={18} radius="sm" />
        <Skeleton width="100%" height={72} radius="md" />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton width={40} height={14} radius="sm" />
        </div>
        {/* anonymous box — 1px border, padding 0.75/0.875rem ≈ 64h. */}
        <Skeleton width="100%" height={64} radius="md" />
      </div>

      {/* locationSection — primary-fade bg ≈ 64h. */}
      <Skeleton width="100%" height={64} radius="md" />

      {/* actions — 1fr/2fr 2-button row 48h. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 10,
        }}
      >
        <Skeleton width="100%" height={48} radius="md" />
        <Skeleton width="100%" height={48} radius="md" />
      </div>
    </div>
  );
}
