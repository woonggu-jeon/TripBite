import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /region/[code] cold start fallback — Figma "RGN · 시군상세" layout 정합.
 *
 * page.module.scss `.body` (padding 4 4 0 gap 16) 안에서:
 *   1) RegionHero banner — 320×103 padding 16 20 gap 12 radius 12 (primary-soft
 *      bg + 1px border). title B_20 + eyebrow + description 2줄.
 *   2) RegionDetailTabs — 4 chip tabs (28h pill, gap 4) + panelArea min-height
 *      460 (DestinationCard 2-col grid ≈ 220h ×2 row).
 */
export default function RegionDetailLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '4px 4px 0',
      }}
    >
      {/* RegionHero banner placeholder — 103h radius 12. */}
      <Skeleton width="100%" height={103} radius="md" />

      {/* RegionDetailTabs wrap — gap var(--space-4) = 16. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 4 chip tabs — 28h pill, gap 4. 첫 칩은 active 라 width 가 약간 큼. */}
        <div style={{ display: 'flex', gap: 4 }}>
          <Skeleton width={64} height={28} radius="full" />
          <Skeleton width={72} height={28} radius="full" />
          <Skeleton width={56} height={28} radius="full" />
          <Skeleton width={88} height={28} radius="full" />
        </div>

        {/* panelArea — DestinationCard 2 columns × 2 rows ≈ 460h. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={220} radius="md" />
          ))}
        </div>
      </div>
    </div>
  );
}
