import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /letter cold start fallback — LetterIndex layout 정합.
 *
 * 구조 (LetterIndex.module.scss `.wrap` gap var(--space-6)):
 *   1) ComposeEntryCard — hero 140 (grid-template-rows: 140px auto) + body row
 *      (title + subtitle + arrow 36 circle). radius-xl.
 *   2) 3 tabs (받은/보낸/하트) — 3-col grid 36h pill bg, padding 0.375rem.
 *      ※ 이전 4-tab 회귀 정정 (saved 탭 미노출, 3-tab 만).
 *   3) list min-height 360 — LetterRowCard ≈ 107h (80 image + padding 24).
 *      3 row + sentinel placeholder.
 */
export default function LetterLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-6)',
      }}
    >
      {/* ComposeEntryCard — hero 140 + body (16px padding row + arrow). */}
      <Skeleton width="100%" height={196} radius="lg" />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 3 tabs — grid-template-columns repeat(3,1fr) padding 0.375rem. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '0.375rem',
            background: 'color-mix(in srgb, var(--color-fg) 4%, transparent)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Skeleton width="100%" height={36} radius="md" />
          <Skeleton width="100%" height={36} radius="md" />
          <Skeleton width="100%" height={36} radius="md" />
        </div>

        {/* LetterRowCard list — 107h ×3 + sentinel. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 360,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={107} radius="md" />
          ))}
        </div>
      </section>
    </div>
  );
}
